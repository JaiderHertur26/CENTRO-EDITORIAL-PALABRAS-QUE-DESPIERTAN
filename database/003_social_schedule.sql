-- Calendario social leído del CSV maestro (solo lectura).
begin;
alter table public.editorial_items add column if not exists social_scheduled_at timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-12T19:00:00-05:00' where kind='mensaje' and code='PD-001' and social_scheduled_at is distinct from '2026-11-12T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-16T19:00:00-05:00' where kind='mensaje' and code='PD-002' and social_scheduled_at is distinct from '2026-11-16T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-18T19:00:00-05:00' where kind='mensaje' and code='PD-003' and social_scheduled_at is distinct from '2026-11-18T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-20T19:00:00-05:00' where kind='mensaje' and code='PD-004' and social_scheduled_at is distinct from '2026-11-20T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-23T19:00:00-05:00' where kind='mensaje' and code='PD-005' and social_scheduled_at is distinct from '2026-11-23T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-25T19:00:00-05:00' where kind='mensaje' and code='PD-006' and social_scheduled_at is distinct from '2026-11-25T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-27T19:00:00-05:00' where kind='mensaje' and code='PD-007' and social_scheduled_at is distinct from '2026-11-27T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-11-30T19:00:00-05:00' where kind='mensaje' and code='PD-008' and social_scheduled_at is distinct from '2026-11-30T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-12-02T19:00:00-05:00' where kind='mensaje' and code='PD-009' and social_scheduled_at is distinct from '2026-12-02T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-12-04T19:00:00-05:00' where kind='mensaje' and code='PD-010' and social_scheduled_at is distinct from '2026-12-04T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-12-07T19:00:00-05:00' where kind='mensaje' and code='PD-011' and social_scheduled_at is distinct from '2026-12-07T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-12-09T19:00:00-05:00' where kind='mensaje' and code='PD-012' and social_scheduled_at is distinct from '2026-12-09T19:00:00-05:00'::timestamptz;
update public.editorial_items set social_scheduled_at='2026-12-11T19:00:00-05:00' where kind='mensaje' and code='PD-013' and social_scheduled_at is distinct from '2026-12-11T19:00:00-05:00'::timestamptz;
commit;
