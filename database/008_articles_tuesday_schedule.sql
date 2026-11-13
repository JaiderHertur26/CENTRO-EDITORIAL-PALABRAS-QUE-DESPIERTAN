-- Agenda artículos semanales. Horario Colombia (UTC-05), martes 18:55.
-- EJECUTADA DE FORMA EQUIVALENTE por Supabase Data API el 13/11/2026.
-- 11 artículos verificados como scheduled; NO volver a ejecutar este SQL.
-- ART-001 ya publicado; no modificar ni ocultar.
BEGIN;
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.editorial_items
 WHERE kind='articulo' AND code >= 'ART-002' AND code <= 'ART-012'
   AND approved_by_author = true AND state = 'pending' AND published_at IS NULL
   AND length(trim(body)) > 1500;
 IF n <> 11 THEN
  RAISE EXCEPTION 'Se esperaban 11 artículos aprobados pendientes; encontrados %', n;
 END IF;
 IF NOT EXISTS(
  SELECT 1 FROM public.editorial_items
  WHERE kind='articulo' AND code='ART-001' AND state='published'
 ) THEN RAISE EXCEPTION 'No se puede alterar el historial del ART-001'; END IF;
END $$;
WITH agenda(code, publicacion) AS (
 VALUES
 ('ART-002','2026-11-17T23:55:00Z'::timestamptz),
 ('ART-003','2026-11-24T23:55:00Z'::timestamptz),
 ('ART-004','2026-12-01T23:55:00Z'::timestamptz),
 ('ART-005','2026-12-08T23:55:00Z'::timestamptz),
 ('ART-006','2026-12-15T23:55:00Z'::timestamptz),
 ('ART-007','2026-12-22T23:55:00Z'::timestamptz),
 ('ART-008','2026-12-29T23:55:00Z'::timestamptz),
 ('ART-009','2027-01-05T23:55:00Z'::timestamptz),
 ('ART-010','2027-01-12T23:55:00Z'::timestamptz),
 ('ART-011','2027-01-19T23:55:00Z'::timestamptz),
 ('ART-012','2027-01-26T23:55:00Z'::timestamptz)
)
UPDATE public.editorial_items AS e
SET state='scheduled',
    scheduled_at=agenda.publicacion,
    change_note='Programación semanal aprobada por el autor: martes 18:55 America/Bogota, después del mensaje PD-002; no se modificó el original.'
FROM agenda
WHERE e.kind='articulo' AND e.code=agenda.code AND e.state='pending';
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.editorial_items
 WHERE kind='articulo' AND code BETWEEN 'ART-002' AND 'ART-012'
 AND state='scheduled' AND scheduled_at IS NOT NULL;
 IF n <> 11 THEN
  RAISE EXCEPTION 'Verificación fallida: % de 11 artículos quedaron programados',n;
 END IF;
END $$;
COMMIT;
SELECT code,title,state,scheduled_at,canonical_url
FROM public.editorial_items WHERE kind='articulo' ORDER BY code;
