-- Audit repair: insert events must be written AFTER the referenced item exists.
begin;
create or replace function private.editorial_write_audit()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and (
   new.id is distinct from old.id or new.kind is distinct from old.kind
   or new.slug is distinct from old.slug or new.code is distinct from old.code
   or new.approved_by_author is distinct from old.approved_by_author
 ) then raise exception 'Identidad y aprobacion autoral no modificables desde el centro';end if;
 if new.updated_by is not null and not exists(
  select 1 from public.discussion_moderators where user_id=new.updated_by
 ) then raise exception 'Editor no autorizado';end if;
 new.updated_at=now();
 return new;
end;$$;
revoke all on function private.editorial_write_audit() from public,anon,authenticated;
create or replace function private.editorial_audit_after()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.editorial_audit(item_id,actor_id,action,old_state,new_state,change_note)
 values(new.id,new.updated_by,case when TG_OP='UPDATE' then 'actualizar' else 'crear' end,
 case when TG_OP='UPDATE' then old.state else null end,new.state,new.change_note);
 return null;
end;$$;
revoke all on function private.editorial_audit_after() from public,anon,authenticated;
drop trigger if exists editorial_item_audit_after on public.editorial_items;
create trigger editorial_item_audit_after after insert or update on public.editorial_items
for each row execute function private.editorial_audit_after();
commit;
