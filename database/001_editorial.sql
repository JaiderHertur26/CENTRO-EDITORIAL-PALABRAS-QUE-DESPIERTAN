-- PALABRAS QUE DESPIERTAN · Centro editorial
-- Target project: lwuzkjvolxwkxdyafcjv. Idempotent installation.
begin;
create table if not exists public.editorial_items (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('articulo','mensaje','tema')),
 slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=150),
 code text not null check (char_length(code) between 3 and 35),
 title text not null check (char_length(btrim(title)) between 2 and 240),
 subtitle text not null default '',
 summary text not null default '',
 body text not null default '',
 cover_url text,
 bible_reference text not null default '',
 season text,series text,
 state text not null default 'pending' check(state in ('pending','scheduled','published')),
 approved_by_author boolean not null default false,
 social_state text not null default 'no-programado',
 scheduled_at timestamptz,published_at timestamptz,
 featured boolean not null default false,
 position integer not null default 0,
 source_url text,
 updated_by uuid references auth.users(id) on delete set null,
 change_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(kind,slug),unique(kind,code),
 constraint scheduled_requires_date check(state<>'scheduled' or scheduled_at is not null)
);
create index if not exists editorial_kind_state on public.editorial_items(kind,state,scheduled_at);
create table if not exists public.editorial_audit (
 id bigint generated always as identity primary key,
 item_id uuid not null references public.editorial_items(id) on delete restrict,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,old_state text,new_state text,
 change_note text,changed_at timestamptz not null default now()
);
create index if not exists editorial_audit_recent on public.editorial_audit(changed_at desc);
alter table public.editorial_items enable row level security;
alter table public.editorial_audit enable row level security;
revoke all on public.editorial_items,public.editorial_audit from public,anon,authenticated;
grant all on public.editorial_items,public.editorial_audit to service_role;
grant usage,select on sequence public.editorial_audit_id_seq to service_role;
grant select(kind,slug,state,scheduled_at) on public.editorial_items to anon,authenticated;
drop policy if exists editorial_public_slug_read on public.editorial_items;
create policy editorial_public_slug_read on public.editorial_items for select to anon,authenticated
using(state='published' or (state='scheduled' and scheduled_at<=now()));

create schema if not exists private;
create or replace function private.editorial_write_audit()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.id is distinct from old.id or new.kind is distinct from old.kind
     or new.slug is distinct from old.slug or new.code is distinct from old.code
     or new.approved_by_author is distinct from old.approved_by_author then
   raise exception 'Identidad y aprobacion autoral no modificables desde el centro';
  end if;
 end if;
 if new.updated_by is not null and not exists (
  select 1 from public.discussion_moderators where user_id=new.updated_by
 ) then raise exception 'Editor no autorizado'; end if;
 new.updated_at=now();
 if TG_OP='UPDATE' then
  insert into public.editorial_audit(item_id,actor_id,action,old_state,new_state,change_note)
  values(new.id,new.updated_by,'actualizar',old.state,new.state,new.change_note);
 else
  insert into public.editorial_audit(item_id,actor_id,action,old_state,new_state,change_note)
  values(new.id,new.updated_by,'crear',null,new.state,new.change_note);
 end if;
 return new;
end;$$;
revoke all on function private.editorial_write_audit() from public,anon,authenticated;
drop trigger if exists editorial_item_audit on public.editorial_items;
create trigger editorial_item_audit before insert or update on public.editorial_items
for each row execute function private.editorial_write_audit();

create or replace function private.editorial_sync_subject()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.discussion_subjects(kind,subject_id,title,enabled)
 values(new.kind,new.slug,new.title,new.state in ('published','scheduled'))
 on conflict(kind,subject_id) do update
 set title=excluded.title,enabled=excluded.enabled;
 return null;
end;$$;
revoke all on function private.editorial_sync_subject() from public,anon,authenticated;
drop trigger if exists editorial_sync_subject on public.editorial_items;
create trigger editorial_sync_subject after insert or update of state,title
on public.editorial_items for each row execute function private.editorial_sync_subject();

drop policy if exists comments_public_read on public.discussion_entries;
create policy comments_public_read on public.discussion_entries for select to anon,authenticated
using(status='approved' and exists(
 select 1 from public.editorial_items p where p.kind=subject_type and p.slug=subject_id
 and (p.state='published' or (p.state='scheduled' and p.scheduled_at<=now()))
));
drop policy if exists comments_author_submit on public.discussion_entries;
create policy comments_author_submit on public.discussion_entries for insert to authenticated
with check ((select auth.uid())=author_id and status='approved' and consent_confirmed
 and exists(select 1 from public.editorial_items p where p.kind=subject_type and p.slug=subject_id
 and (p.state='published' or (p.state='scheduled' and p.scheduled_at<=now()))));
drop policy if exists subject_public_read on public.discussion_subjects;
create policy subject_public_read on public.discussion_subjects for select to anon,authenticated
using(enabled and exists(
 select 1 from public.editorial_items p where p.kind=kind and p.slug=subject_id
 and (p.state='published' or (p.state='scheduled' and p.scheduled_at<=now()))
));
commit;
