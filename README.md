# PALABRAS QUE DESPIERTAN · CENTRO EDITORIAL

Aplicación administrativa privada e independiente, construida en Next.js 16 / React 19 y conectada a la **misma** base Supabase de la revista pública, `lwuzkjvolxwkxdyafcjv`.

## Acceso
- La única cuenta de dirección autorizada inicialmente es `pquedespiertan@gmail.com`.
- Acceso privado por enlace de correo de Supabase Auth; requiere correo verificado y pertenencia a `discussion_moderators`.
- No existe registro público ni datos editoriales expuestos sin autenticación.
- El dominio exacto de esta aplicación debe figurar en las redirecciones permitidas de Supabase Auth.

## Módulos
- Inicio: centro de mando y métricas reales, catálogo de mensajes, artículos y temas.
- Publicaciones: mostrar/ocultar de inmediato, programar por fecha y hora (Colombia), editar textos y ficha, crear elementos nuevos pendientes.
- Comunidad: consultas de participantes, respuestas, comentarios y testimonios, retirar contenido y resolver reportes.
- Calendario: programación de la web y registro independiente de programación en redes; Meta no está conectado como programador automático.
- Temporadas y series: las 12 temporadas y 36 series del plan maestro.
- Biblioteca gráfica: los 2 originales de identidad verificados con SHA256.
- Auditoría: registro de modificaciones almacenado en Supabase.

## Configuración
- `NEXT_PUBLIC_SUPABASE_URL` = URL del proyecto autorizado.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = clave pública para Supabase Auth.
- `SUPABASE_SECRET_KEY` = clave privada de servidor (nunca incluir el prefijo `NEXT_PUBLIC_`).
- Las variables privadas deben permanecer solo en `.env.local` y en el entorno seguro de Vercel.
- `npm ci && npm test && npm run build`; `npm run dev` para desarrollo.
- `npm run prepare:seed` genera una semilla desde los originales y snapshots de la web en modo **lectura**; su resultado es privado y se excluye de Git.

## Base
Migraciones en `database/001_editorial.sql`, `database/001b_audit_fix.sql` , `database/003_social_schedule.sql` y `database/004_author_approval.sql` (aprobación posterior solo por la dirección). La primera semilla (12 artículos, 20 mensajes, 6 temas) ya está aplicada a Supabase, con **ART-001 visible y ART-002–012 pendientes**. El proceso es auditado y no cambia la aprobación del autor. La revista pública utiliza rutas dinámicas protegidas por la misma fuente de visibilidad.

## Repositorio y despliegue
- GitHub: https://github.com/JaiderHertur26/CENTRO-EDITORIAL-PALABRAS-QUE-DESPIERTAN
- Vercel: https://vercel.com/jaiderherreras-projects/c-edi-palabras-que-despiertan
- Proyecto Vercel: `prj_7iubu82UYs1nE2gAurBx9LnAQAX3`.
- La web pública permanece separada en el repositorio `PALABRAS-QUE-DESPIERTAN`. El control de visibilidad se hace por los registros de Supabase, no mediante nuevos despliegues.

## Reglas editoriales
- Escritura, Tradición y Magisterio; teología católica y aplicaciones pastorales.
- Mantener la autoría `P. Jaider Herrera Turizo`.
- ART-001–012 fueron autorizados en la revista; no confundir aprobación con visibilidad.
- Jamás sustituir los dos originales gráficos ni dar por publicadas obras solo programadas en Meta.
- No hay revisión por pares atribuida a los artículos.
- Comentarios y testimonios funcionan en los hilos originales de la revista, con reportes y protección de datos.
- Todas las acciones de publicación son registradas en auditoría y las identidades del artículo son inmutables.

## Privacidad
Las direcciones de correo de lectores aparecen **solo** en vistas administrativas autenticadas. No se publica esta información en la revista.
