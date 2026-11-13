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
- No se utiliza ni se almacena `SUPABASE_SECRET_KEY` en este proyecto. Las operaciones editoriales se ejecutan con la sesión verificada y funciones SQL de acceso restringido en Supabase.
- Las variables privadas deben permanecer solo en `.env.local` y en el entorno seguro de Vercel.
- `npm ci && npm test && npm run build`; `npm run dev` para desarrollo.
- `npm run prepare:seed` genera una semilla desde los originales y snapshots de la web en modo **lectura**; su resultado es privado y se excluye de Git.

## Base
Migraciones en `database/001_editorial.sql`, `database/001b_audit_fix.sql`, `database/003_social_schedule.sql`, `database/004_author_approval.sql` y `database/005_editorial_session_rpc.sql` (acceso exclusivamente con JWT validado por Supabase; sin llave de administrador en Vercel). La primera semilla (12 artículos, 20 mensajes, 6 temas) ya está aplicada a Supabase, con **ART-001 visible y ART-002–012 pendientes**. El proceso es auditado y no cambia la aprobación del autor. La revista pública utiliza rutas dinámicas protegidas por la misma fuente de visibilidad.

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

## Sincronización de la revista con Meta (v1.1)

El catálogo editorial conserva los 20 mensajes y sus 19 tarjetas futuras cotejadas con los originales (los originales en MENSAJES no se modifican). Para PD-002 a PD-013, la hora de Meta confirmada en el catálogo maestro es 19:00 Colombia y la revista se hace visible a las 18:55 de las respectivas fechas. Los siete mensajes restantes están completos y pendientes de programación en Meta.

En **Enlaces para redes** hay un enlace canónico permanente por mensaje y una descripción preparada para copiar a Meta Business Suite. La aplicación no tiene autorización de escritura en las entradas ya programadas de Meta, por lo que no afirma haber modificado esas publicaciones externas. Las descripciones preparadas se conservaron también en GITHUB\\ENLACES_META_PARA_ACTUALIZAR.

La migración privada `database/006_web_schedule_and_canonical.sql`, generada a partir de originales aprobados, fue aplicada a Supabase pero no se publica en GitHub porque contiene mensajes futuros aún no estrenados. La migración versionada `database/007_meta_synchronization.sql` incorpora el control temporal de cinco minutos, las funciones autenticadas de reprogramación y el recurso privado de enlaces. Las imágenes originales futuras se entregan solo cuando la obra ya es pública, incluso si se solicita su optimización.
