-- Director-only approval for new manuscripts. Existing approvals remain immutable.
begin;
create or replace function private.editorial_write_audit()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.id is distinct from old.id or new.kind is distinct from old.kind
    or new.slug is distinct from old.slug or new.code is distinct from old.code
  then raise exception 'Identidad editorial inmutable'; end if;
  if new.approved_by_author is distinct from old.approved_by_author then
   if old.approved_by_author or not new.approved_by_author then
    raise exception 'No se puede retirar una aprobacion de autor';
   end if;
   if new.updated_by is null or not exists (
    select 1 from auth.users u where u.id=new.updated_by
      and lower(u.email)='pquedespiertan@gmail.com'
      and u.email_confirmed_at is not null
   ) then raise exception 'La aprobacion corresponde a la direccion autora'; end if;
   if char_length(btrim(new.body))<20 then
    raise exception 'La obra debe contener texto antes de aprobarse';
   end if;
  end if;
 end if;
 if new.updated_by is not null and not exists (
  select 1 from public.discussion_moderators where user_id=new.updated_by
 ) then raise exception 'Editor no autorizado'; end if;
 new.updated_at=now();
 return new;
end;$$;
revoke all on function private.editorial_write_audit() from public,anon,authenticated;
commit;
