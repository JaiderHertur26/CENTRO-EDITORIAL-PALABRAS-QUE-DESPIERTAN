-- PALABRAS QUE DESPIERTAN: least-privilege editorial RPC (no service_role key in Vercel)
-- Restrict every action to verified editorial owner, using JWT from Supabase Auth.
begin;
create or replace function private.editorial_is_director()
returns boolean language sql stable security definer set search_path = ''
as $$
 select (select auth.uid()) is not null
  and exists (
   select 1 from auth.users u
   join public.discussion_moderators m on m.user_id = u.id
   where u.id = (select auth.uid())
     and lower(u.email) = 'pquedespiertan@gmail.com'
     and u.email_confirmed_at is not null
     and coalesce(u.is_anonymous,false)=false
  );
$$;
revoke all on function private.editorial_is_director() from public,anon,authenticated;

create or replace function public.editorial_is_authorized()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.editorial_is_director(); $$;
revoke all on function public.editorial_is_authorized() from public,anon,authenticated;
grant execute on function public.editorial_is_authorized() to authenticated;

create or replace function public.editorial_read(p_resource text,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
 if not private.editorial_is_director() then raise exception 'Acceso editorial denegado' using errcode='42501'; end if;
 if p_resource='items' then
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(e) - 'body' - 'change_note' - 'updated_by'), '[]'::jsonb) into result
  from (select * from public.editorial_items order by kind,position,code) e;
 elsif p_resource='item' then
  select pg_catalog.to_jsonb(e) into result
  from public.editorial_items e where id=p_id;
 elsif p_resource='counts' then
  select pg_catalog.jsonb_build_object(
   'commentCount', (select count(*) from public.discussion_entries),
   'reportCount', (select count(*) from public.discussion_reports where resolved=false)
  ) into result;
 elsif p_resource='audit' then
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t)), '[]'::jsonb) into result
  from (select id,item_id,actor_id,action,old_state,new_state,change_note,changed_at
      from public.editorial_audit order by changed_at desc limit 100) t;
 elsif p_resource='community' then
  select pg_catalog.jsonb_build_object(
   'comments', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c)),'[]'::jsonb)
       from (select id,subject_type,subject_id,parent_id,display_name,body,created_at,status,author_id,reviewed_at
            from public.discussion_entries order by created_at desc limit 100) c),
   'reports', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r)),'[]'::jsonb)
       from (select id,entry_id,reporter_id,motive,details,created_at,resolved
             from public.discussion_reports order by created_at desc limit 100) r),
   'audit', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a)),'[]'::jsonb)
       from (select id,item_id,actor_id,action,old_state,new_state,change_note,changed_at
             from public.editorial_audit order by changed_at desc limit 100) a),
   'people', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
                 'id',u.id,'email',u.email,'verified',u.email_confirmed_at is not null,
                 'joined',u.created_at,'lastLogin',u.last_sign_in_at
              )),'[]'::jsonb)
       from (select id,email,email_confirmed_at,created_at,last_sign_in_at
             from auth.users order by created_at desc limit 200) u)
  ) into result;
 else
  raise exception 'Recurso editorial desconocido';
 end if;
 return result;
end;
$$;
revoke all on function public.editorial_read(text,uuid) from public,anon,authenticated;
grant execute on function public.editorial_read(text,uuid) to authenticated;

create or replace function public.editorial_update(
 p_id uuid, p_expected_updated_at timestamptz,p_patch jsonb
) returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
 r public.editorial_items%rowtype;
 next_state text;
 next_body text;
 next_approval boolean;
 key text;
 updated public.editorial_items%rowtype;
begin
 if not private.editorial_is_director() then raise exception 'Acceso editorial denegado' using errcode='42501'; end if;
 if p_patch is null or pg_catalog.jsonb_typeof(p_patch)<>'object'
 then raise exception 'Datos editoriales incorrectos';end if;
 for key in select pg_catalog.jsonb_object_keys(p_patch) loop
  if key not in ('title','subtitle','summary','body','cover_url','bible_reference',
     'state','scheduled_at','featured','social_state','change_note','approved_by_author')
  then raise exception 'Campo no modificable: %',key;end if;
 end loop;
 select * into r from public.editorial_items where id=p_id for update;
 if not found then raise exception 'Publicación no encontrada';end if;
 if r.updated_at is distinct from p_expected_updated_at
 then raise exception 'Esta publicación cambió en otra sesión';end if;
 next_state=case when p_patch ? 'state' then p_patch->>'state' else r.state end;
 if next_state not in ('pending','scheduled','published') then raise exception 'Estado no válido';end if;
 next_body=case when p_patch ? 'body' then p_patch->>'body' else r.body end;
 next_approval=case when p_patch ? 'approved_by_author'
   then (p_patch->>'approved_by_author')::boolean else r.approved_by_author end;
 if r.approved_by_author and not next_approval then raise exception 'No se revoca la aprobación del autor';end if;
 if not next_approval and next_state<>'pending' then raise exception 'La publicación necesita aprobación autoral';end if;
 if next_state<>'pending' and pg_catalog.char_length(pg_catalog.btrim(next_body))<20
 then raise exception 'Contenido insuficiente para publicar';end if;
 if next_state='scheduled' and (
   (not (p_patch ? 'scheduled_at') and r.scheduled_at is null)
   or (p_patch ? 'scheduled_at' and p_patch->>'scheduled_at' is null)
 ) then raise exception 'Falta la fecha de programación';end if;
 if p_patch ? 'title' and pg_catalog.char_length(pg_catalog.btrim(p_patch->>'title')) not between 2 and 240
 then raise exception 'Título inválido';end if;
 if pg_catalog.char_length(next_body)>200000 then raise exception 'Contenido demasiado largo';end if;
 update public.editorial_items set
  title=case when p_patch ? 'title' then p_patch->>'title' else title end,
  subtitle=case when p_patch ? 'subtitle' then p_patch->>'subtitle' else subtitle end,
  summary=case when p_patch ? 'summary' then p_patch->>'summary' else summary end,
  body=next_body,
  cover_url=case when p_patch ? 'cover_url' then p_patch->>'cover_url' else cover_url end,
  bible_reference=case when p_patch ? 'bible_reference' then p_patch->>'bible_reference' else bible_reference end,
  state=next_state,
  scheduled_at=case when next_state='scheduled' then
    case when p_patch ? 'scheduled_at' then (p_patch->>'scheduled_at')::timestamptz else scheduled_at end
    else null end,
  published_at=case when next_state='published' and published_at is null then now() else published_at end,
  featured=case when p_patch ? 'featured' then (p_patch->>'featured')::boolean else featured end,
  social_state=case when p_patch ? 'social_state' then p_patch->>'social_state' else social_state end,
  approved_by_author=next_approval,
  change_note=case when p_patch ? 'change_note' then p_patch->>'change_note' else change_note end,
  updated_by=(select auth.uid())
 where id=p_id
 returning * into updated;
 return pg_catalog.jsonb_build_object('id',updated.id,'state',updated.state,'updated_at',updated.updated_at);
end;
$$;
revoke all on function public.editorial_update(uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.editorial_update(uuid,timestamptz,jsonb) to authenticated;

create or replace function public.editorial_create(p_content jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare output public.editorial_items%rowtype;
begin
 if not private.editorial_is_director() then raise exception 'Acceso editorial denegado' using errcode='42501'; end if;
 if p_content is null or pg_catalog.jsonb_typeof(p_content)<>'object'
 then raise exception 'Contenido inválido';end if;
 if p_content->>'kind' not in ('articulo','mensaje','tema')
   or (p_content->>'code' !~ '^(ART-[0-9]{3}|PD-[0-9]{3}|TEMA-[0-9]{2,3})$')
   or (p_content->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$')
 then raise exception 'Tipo, código o slug incorrecto';end if;
 if pg_catalog.char_length(pg_catalog.btrim(p_content->>'title')) not between 2 and 240
 then raise exception 'Título no válido';end if;
 if pg_catalog.char_length(coalesce(p_content->>'body',''))>200000 then raise exception 'Texto demasiado largo';end if;
 if (p_content->>'approved_by_author')::boolean is true
   and pg_catalog.char_length(pg_catalog.btrim(coalesce(p_content->>'body','')))<20
 then raise exception 'Completa el texto antes de aprobar';end if;
 insert into public.editorial_items
  (kind,code,slug,title,subtitle,summary,body,approved_by_author,state,updated_by,change_note)
 values(
  p_content->>'kind',p_content->>'code',p_content->>'slug',p_content->>'title',
  coalesce(p_content->>'subtitle',''),coalesce(p_content->>'summary',''),
  coalesce(p_content->>'body',''),coalesce((p_content->>'approved_by_author')::boolean,false),
  'pending',(select auth.uid()),'Alta desde el Centro Editorial'
 ) returning * into output;
 return pg_catalog.jsonb_build_object('id',output.id,'slug',output.slug);
end;
$$;
revoke all on function public.editorial_create(jsonb) from public,anon,authenticated;
grant execute on function public.editorial_create(jsonb) to authenticated;

create or replace function public.editorial_moderate(p_action text,p_id uuid,p_note text default '')
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
declare n integer;
begin
 if not private.editorial_is_director() then raise exception 'Acceso editorial denegado' using errcode='42501'; end if;
 if pg_catalog.char_length(coalesce(p_note,''))>500 then raise exception 'Nota demasiado larga';end if;
 if p_action='hide' then
  update public.discussion_entries set
   status='hidden',reviewed_by=(select auth.uid()),
   moderation_note=coalesce(nullif(pg_catalog.btrim(p_note),''),'Retirada por dirección editorial')
  where id=p_id and status='approved';
 elsif p_action='resolve' then
  update public.discussion_reports set
    resolved=true,resolved_by=(select auth.uid()),resolved_at=now(),
    resolution_note=coalesce(nullif(pg_catalog.btrim(p_note),''),'Reporte atendido')
  where id=p_id and resolved=false;
 else
  raise exception 'Acción no permitida';
 end if;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'El elemento ya no permite esta acción';end if;
 return true;
end;
$$;
revoke all on function public.editorial_moderate(text,uuid,text) from public,anon,authenticated;
grant execute on function public.editorial_moderate(text,uuid,text) to authenticated;
commit;
