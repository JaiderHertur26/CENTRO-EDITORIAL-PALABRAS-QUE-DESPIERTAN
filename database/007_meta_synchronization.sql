-- Controlled scheduling and linked Meta copy, owner-only via Supabase Auth.
begin;
create or replace function private.editorial_write_audit()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.id is distinct from old.id or new.kind is distinct from old.kind
    or new.slug is distinct from old.slug or new.code is distinct from old.code
  then raise exception 'Identidad editorial inmutable'; end if;
  if new.approved_by_author is distinct from old.approved_by_author then
   if old.approved_by_author or not new.approved_by_author
   then raise exception 'No se puede retirar una aprobacion de autor'; end if;
   if new.updated_by is null or not exists(
     select 1 from auth.users u where u.id=new.updated_by
       and lower(u.email)='pquedespiertan@gmail.com' and u.email_confirmed_at is not null
   ) then raise exception 'La aprobacion corresponde a la direccion autora';end if;
   if pg_catalog.char_length(pg_catalog.btrim(new.body))<20 then
    raise exception 'La obra debe contener texto antes de aprobarse'; end if;
  end if;
 end if;
 if new.updated_by is not null and not exists(
  select 1 from public.discussion_moderators where user_id=new.updated_by
 ) then raise exception 'Editor no autorizado';end if;
 -- Five-minute contract for messages with a programmed Meta time.
 if new.kind='mensaje' and new.state='scheduled' and new.social_scheduled_at is not null
  and (new.scheduled_at is null or new.scheduled_at<>new.social_scheduled_at-interval '5 minutes')
 then raise exception 'La web debe publicarse exactamente cinco minutos antes de Meta'; end if;
 new.updated_at=now();
 return new;
end;$$;
revoke all on function private.editorial_write_audit() from public,anon,authenticated;

create or replace function public.editorial_schedule_from_meta(
 p_id uuid,p_meta_at timestamptz,p_expected_updated_at timestamptz
) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare r public.editorial_items%rowtype;
begin
 if not private.editorial_is_director() then
  raise exception 'Acceso editorial denegado' using errcode='42501';end if;
 if p_meta_at is null or p_meta_at<=now()+interval '5 minutes' or p_meta_at>now()+interval '1 year'
 then raise exception 'Fecha futura de Meta fuera del intervalo permitido';end if;
 select * into r from public.editorial_items where id=p_id for update;
 if not found or r.kind<>'mensaje' then raise exception 'Mensaje no encontrado';end if;
 if r.updated_at is distinct from p_expected_updated_at
 then raise exception 'Esta ficha cambió en otra sesión';end if;
 if not r.approved_by_author or pg_catalog.char_length(pg_catalog.btrim(r.body))<20
  or r.cover_url is null
 then raise exception 'El mensaje debe estar aprobado, completo y con imagen original';end if;
 update public.editorial_items set
  social_scheduled_at=p_meta_at,
  scheduled_at=p_meta_at-interval '5 minutes',
  state='scheduled',
  social_state='FECHA META INFORMADA EN CENTRO EDITORIAL; CONFIRMAR EN META BUSINESS SUITE',
  updated_by=(select auth.uid()),
  change_note='Programado automáticamente cinco minutos antes de Meta'
 where id=p_id returning * into r;
 return pg_catalog.jsonb_build_object(
  'id',r.id,'state',r.state,'updated_at',r.updated_at,
  'scheduled_at',r.scheduled_at,'social_scheduled_at',r.social_scheduled_at,
  'canonical_url',r.canonical_url
 );
end;$$;
revoke all on function public.editorial_schedule_from_meta(uuid,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.editorial_schedule_from_meta(uuid,timestamptz,timestamptz) to authenticated;

create or replace function public.editorial_meta_export()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.editorial_is_director() then
  raise exception 'Acceso editorial denegado' using errcode='42501';end if;
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m)),'[]'::jsonb)
 into result from (
  select code,title,body,bible_reference,canonical_url,state,
   scheduled_at,social_scheduled_at,social_state,source_url
  from public.editorial_items where kind='mensaje' and approved_by_author=true
  order by code
 )m;
 return result;
end;$$;
revoke all on function public.editorial_meta_export() from public,anon,authenticated;
grant execute on function public.editorial_meta_export() to authenticated;
commit;
