import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const plan=JSON.parse(read("data/site-content.json"));
const expected={
 "cruz-fondo.png":"3ceb3342f306e0872cca6cb0edcffe661f498f35d5f10da0e296748bf6b2029b",
 "portada-oficial.png":"259001b1803576f4c4cf7b7b5a0aa7a05c192b1a782468fe78501062f6d646d8"
};
test("Identidad original intacta",()=>{
 for(const [file,hash]of Object.entries(expected))
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"public",file))).digest("hex"),hash,file);
});
test("El plan tiene las 12 temporadas y las 36 series históricas",()=>{
 assert.equal(plan.temporadas.length,12);
 assert.equal(plan.temporadas.reduce((n,t)=>n+t.series.length,0),36);
});
test("Solo el correo de dirección autorizado puede operar el Centro",()=>{
 const auth=read("lib/supabase.ts");
 assert.match(auth,/pquedespiertan@gmail.com/);
 assert.match(auth,/editorial_is_authorized/);
 assert.match(auth,/auth.getUser\(\)/);
 assert.match(auth,/email_confirmed_at/);
});
test("Ningún dato privado llega al navegador sin autorización",()=>{
 const api=read("app/api/items/route.ts");
 const community=read("app/api/community/route.ts");
 assert.match(api,/await verifyEditor\(\)/);
 assert.match(community,/await verifyEditor\(\)/);
 assert.match(api,/originSafe\(req\)/);
 assert.match(community,/origin!==req.nextUrl.origin/);
 assert.match(api,/updated_at!==current.updated_at/);
 assert.match(api,/client.rpc\("editorial_update"/);
 assert.match(community,/client.rpc\("editorial_moderate"/);
});
test("La aprobación por el autor no desaparece al ocultar",()=>{
 const sql=read("database/001_editorial.sql");
 assert.match(sql,/approved_by_author is distinct from old.approved_by_author/);
 assert.match(sql,/editorial_items enable row level security/);
 assert.match(sql,/editorial_audit enable row level security/);
 assert.match(sql,/revoke all on public.editorial_items/);
});
test("El centro no contiene claves ni originales de otra carpeta",()=>{
 const ignore=read(".gitignore");
 assert.match(ignore,/\.env\*/);
 assert.match(ignore,/\/data\/catalog.json/);
 assert.match(ignore,/\/database\/002_seed.sql/);
 assert.ok(!read("app/page.tsx").includes("SUPABASE_SECRET_KEY"));
 assert.ok(!read("lib/supabase.ts").includes("SUPABASE_SECRET_KEY"));
 assert.match(read("database/005_editorial_session_rpc.sql"),/security definer/);
 assert.match(read("database/005_editorial_session_rpc.sql"),/private.editorial_is_director/);
 assert.match(read("database/005_editorial_session_rpc.sql"),/grant execute on function public.editorial_read/);
});
test("La publicación debe reflejar el estado efectivo y la fecha",()=>{
 const board=read("components/Board.tsx");
 const site=read("lib/data.ts");
 assert.match(board,/const willPublish=!canShow\(item\)/);
 assert.match(site,/state==="published"/);
 assert.match(site,/state==="scheduled"/);
 assert.match(board,/Date\.now\(\)/);
});

test("Las aprobaciones nuevas solo corresponden a la dirección y no pueden revocarse",()=>{
 const sql=read("database/004_author_approval.sql");
 const api=read("app/api/items/route.ts");
 assert.match(sql,/pquedespiertan@gmail.com/);
 assert.match(sql,/No se puede retirar una aprobacion de autor/);
 assert.match(sql,/La aprobacion corresponde a la direccion autora/);
 assert.match(api,/data.confirmApproval===true/);
 assert.match(api,/patch.approved_by_author=true/);
});

test("Acceso privado adaptable a teléfonos, sin desbordamiento mínimo de CSS Grid",()=>{
 const css=read("app/globals.css");
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.login-left,\.login-right,\.login-message,\.login-box\{min-width:0\}/);
 assert.match(css,/font-size:clamp\(31px,9vw,38px\)/);
});

test("La sincronización Meta activa la revista exactamente cinco minutos antes",()=>{
 const sql=read("database/007_meta_synchronization.sql");
 const route=read("app/api/programar-meta/route.ts");
 assert.match(sql,/p_meta_at-interval '5 minutes'/);
 assert.match(sql,/private.editorial_is_director\(\)/);
 assert.match(sql,/char_length\(pg_catalog.btrim\(r.body\)\)<20/);
 assert.match(sql,/r.cover_url is null/);
 assert.match(route,/await verifyEditor\(\)/);
 assert.match(route,/editorial_schedule_from_meta/);
});
test("El centro presenta enlaces permanentes y descripciones de los originales",()=>{
 const data=read("lib/data.ts");
 const pack=read("components/MetaPack.tsx");
 assert.match(data,/canonical_url:string/);
 assert.match(pack,/navigator.clipboard.writeText/);
 assert.match(pack,/LEE Y COMENTA LA REFLEXIÓN COMPLETA/);
 assert.match(read("components/Shell.tsx"),/\/enlaces/);
});
test("Se previene publicación en Meta sin sincronización de la web",()=>{
 const sql=read("database/007_meta_synchronization.sql");
 assert.match(sql,/new.scheduled_at<>new.social_scheduled_at-interval '5 minutes'/);
 assert.match(sql,/grant execute on function public.editorial_meta_export/);
});

test("Los mensajes previstos en web, aún no programados en Meta, tienen calendario visible en el Centro",()=>{
 const calendar=read("app/calendario/page.tsx");
 const pack=read("components/MetaPack.tsx");
 assert.match(calendar,/const awaitingMeta=/);
 assert.match(calendar,/getTime\(\)\+300000/);
 assert.match(calendar,/todavía no programado en Meta/);
 assert.match(pack,/aún sin programar en redes/);
});

test("Agenda semanal de artículos: once martes a las 18:55 Colombia, preservando ART-001",()=>{
 const sql=read("database/008_articles_tuesday_schedule.sql");
 const matches=[...sql.matchAll(/\('ART-(\d{3})','([^']+)'::timestamptz\)/g)];
 assert.equal(matches.length,11);
 const dates=matches.map((m,i)=>{
  assert.equal(Number(m[1]),i+2);
  const date=new Date(m[2]);
  assert.equal(date.getUTCDay(),2);
  assert.equal(date.getUTCHours(),23);
  assert.equal(date.getUTCMinutes(),55);
  return date.getTime();
 });
 assert.equal(new Date(dates[0]).toISOString().slice(0,10),"2026-11-17");
 assert.equal(new Date(dates.at(-1)).toISOString().slice(0,10),"2027-01-26");
 assert.ok(dates.every((t,i)=>i===0||t-dates[i-1]===7*86400000));
 assert.match(sql,/code='ART-001' AND state='published'/);
 assert.match(sql,/approved_by_author = true AND state = 'pending'/);
});

test("El Centro muestra vistas de la revista en un panel solo para dirección",()=>{
 const page=read("app/estadisticas/page.tsx");
 const helper=read("lib/visits.ts");
 const home=read("app/page.tsx");
 assert.match(read("components/Shell.tsx"),/\/estadisticas/);
 assert.match(page,/await requireEditor\(\)/);
 assert.match(page,/readVisitStats\(days\)/);
 assert.match(page,/Artículos/);
 assert.match(page,/Mensajes/);
 assert.match(page,/Testimonios/);
 assert.match(helper,/session\.access_token/);
 assert.match(helper,/cache:"no-store"/);
 assert.match(home,/readVisitStats\(30\)/);
 assert.match(home,/PÁGINAS VISTAS/);
});

test("Integraciones Meta: el paso inicial es privado, no publica contenido y conserva la seguridad",()=>{
 const page=read("app/integraciones/page.tsx");
 const state=read("lib/meta-connection.ts");
 const shell=read("components/Shell.tsx");
 assert.match(page,/await requireEditor\(\)/);
 assert.match(page,/Meta Graph API/i);
 assert.match(page,/facebook\.com\/PalabrasQueDespiertan01/);
 assert.match(page,/instagram\.com\/palabrasquedespiertan/);
 assert.match(page,/developers\.facebook\.com\/apps/);
 assert.match(page,/Publicación automática inactiva/);
 assert.match(page,/no crea publicaciones en redes/);
 assert.match(shell,/href:"\/integraciones"/);
 assert.match(state,/automaticPublishingEnabled:false/);
 assert.match(state,/permissionsVerified:false/);
 assert.doesNotMatch(page,/fetch\(|\.post\(|access_token|META_APP_SECRET/);
});

test("La URL de retorno de Meta valida estado CSRF y no publica contenido",()=>{
 const route=read("app/api/meta/callback/route.ts");
 const start=read("app/api/meta/connect/route.ts");
 const oauth=read("lib/meta-oauth.ts");
 const panel=read("app/integraciones/page.tsx");
 assert.match(route,/publishingEnabled:false/);
 assert.match(route,/timingSafeEqual/);
 assert.match(route,/query\.has\("code"\)/);
 assert.match(route,/equalState\(expected,received\)/);
 assert.match(route,/await verifyEditor\(\)/);
 assert.match(start,/randomBytes\(32\)/);
 assert.match(start,/sameSite:"lax"/);
 assert.match(start,/httpOnly:true/);
 assert.match(start,/await verifyEditor\(\)/);
 assert.match(oauth,/config_id/);
 assert.match(oauth,/response_type","code"/);
 assert.match(oauth,/instagram_content_publish/);
 assert.match(panel,/https:\/\/c-edi-palabras-que-despiertan\.vercel\.app\/api\/meta\/callback/);
 assert.match(panel,/Autorizar Instagram con Meta/);
});

test("Las tres variables Meta se validan en el servidor sin exponer claves",()=>{
 const check=read("lib/meta-connection.ts");
 const panel=read("app/integraciones/page.tsx");
 assert.match(check,/process\.env\.META_APP_ID/);
 assert.match(check,/process\.env\.META_CONFIG_ID/);
 assert.match(check,/process\.env\.META_APP_SECRET/);
 assert.match(check,/verifyMetaAppCredentials/);
 assert.match(check,/grant_type:"client_credentials"/);
 assert.match(check,/graph\.facebook\.com\/v26\.0\/oauth\/access_token/);
 assert.match(check,/automaticPublishingEnabled:false/);
 assert.match(panel,/verifyMetaAppCredentials\(\)/);
 assert.doesNotMatch(panel,/(?:value|href)=\{process\.env\./);
});

test("Integraciones Meta refleja la autorización real y separa permisos de identidad",()=>{
 const page=read("app/integraciones/page.tsx");
 const oauth=read("lib/meta-oauth.ts");
 assert.match(page,/authorization\.connected/);
 assert.match(page,/authorization\.verifiedAccount/);
 assert.match(page,/authorization\.username==="palabrasquedespiertan"/);
 assert.match(page,/hasAccess\?facebookGranted\?facebookVerified\?/);
 assert.match(page,/Facebook: pendiente/);
 assert.match(page,/Publicación automática inactiva/);
 assert.match(page,/Meta no respondió a la verificación de identidad/);
 assert.match(oauth,/X-PQD-Meta-App-Authorization/);
 assert.match(oauth,/verifiedAccount:status\.verifiedAccount===true/);
 assert.doesNotMatch(page,/access_token|META_APP_SECRET|SUPABASE_SECRET_KEY/);
});

test("Actualización de permisos Meta sin reemplazar un token válido por una autorización incompleta",()=>{
 const panel=read("app/integraciones/page.tsx");
 const oauth=read("lib/meta-oauth.ts");
 assert.match(panel,/Actualizar permisos de Instagram y Facebook/);
 assert.match(panel,/hasAccess&&!facebookGranted/);
 assert.match(panel,/facebookMissing\.join/);
 assert.match(panel,/facebookScopes\.every/);
 assert.match(panel,/página por verificar/);
 assert.match(oauth,/pages_show_list/);
 assert.match(oauth,/pages_read_engagement/);
 assert.match(oauth,/pages_manage_posts/);
 assert.match(oauth,/if\(required\.some\(scope=>!scopes\.includes\(scope\)\)\)throw/);
 const validate=oauth.indexOf("if(required.some(");
 const save=oauth.indexOf('await vaultRequest("POST"');
 assert.ok(validate>0&&save>validate,"No guardar token nuevo si faltan permisos");
});

test("Facebook tiene verificación propia y no se confunde con los cinco permisos concedidos",()=>{
 const panel=read("app/integraciones/page.tsx");
 const api=read("lib/meta-oauth.ts");
 assert.match(panel,/facebookVerified=facebookGranted&&authorization\.facebookPageVerified===true/);
 assert.match(panel,/facebookCanPost=facebookVerified&&authorization\.facebookCanCreateContent===true/);
 assert.match(panel,/Falta la prueba controlada antes de publicar/);
 assert.match(panel,/Permisos recibidos · página por verificar/);
 assert.match(api,/facebookPageVerified:status\.facebookPageVerified===true/);
 assert.match(api,/facebookCanCreateContent:status\.facebookCanCreateContent===true/);
});

test("Integraciones refleja los recibos reales de TEST-001 sin confundir feed, historias y programación",()=>{
 const panel=read("app/integraciones/page.tsx");
 assert.match(panel,/testReceipts=await metaPublishBridge\("GET"/);
 assert.match(panel,/facebookTestPublished=testReceipts\?\.deliveries\?\.facebook_feed\?\.status==="published"/);
 assert.match(panel,/instagramTestPublished=testReceipts\?\.deliveries\?\.instagram_feed\?\.status==="published"/);
 assert.match(panel,/bothFeedsPublished=facebookTestPublished&&instagramTestPublished/);
 assert.match(panel,/facebookCanPost\?allTestPublished\?/);
 assert.match(panel,/4 de 4 destinos publicados/);
 assert.match(panel,/allTestPublished=bothFeedsPublished&&bothStoriesPublished/);
 assert.match(panel,/Publicación automática inactiva/);
 assert.doesNotMatch(panel,/El siguiente paso será integrar Facebook/);
});

test("Simulacion de Meta solo consulta estados y nunca envia contenido",()=>{
 const page=read("app/integraciones/simulacion/page.tsx");
 const main=read("app/integraciones/page.tsx");
 assert.match(page,/await requireEditor\(\)/);
 assert.match(page,/metaVaultStatus\(\)/);
 assert.match(page,/verifyMetaAppCredentials\(\)/);
 assert.match(page,/facebookCanCreateContent/);
 assert.match(page,/instagram_content_publish/);
 assert.match(page,/expiresAt\*1000>Date\.now\(\)/);
 assert.match(page,/No se enviará ningún contenido sin tu aprobación/);
 assert.match(main,/href="\/integraciones\/simulacion"/);
 assert.doesNotMatch(page,/method:\s*["']POST|fetch\(|\/feed\b|\/media_publish\b|access_token|META_APP_SECRET/);
});

test("Editor privado de Facebook, Instagram, feeds e historias funciona sin publicar",()=>{
 const page=read("app/publicar/page.tsx");
 const editor=read("components/MetaComposer.tsx");
 const nav=read("components/Shell.tsx");
 assert.match(page,/await requireEditor\(\)/);
 assert.match(nav,/href:"\/publicar"/);
 for(const scope of ["facebook_feed","instagram_feed","facebook_story","instagram_story"])
  assert.match(editor,new RegExp(scope));
 assert.match(editor,/Guardar borrador privado/);
 assert.match(editor,/TEST-001/);
 assert.match(editor,/instagramAccountType==="BUSINESS"/);
 assert.match(editor,/Las fechas son objetivos editoriales|programación automática permanece desactivada/);
 assert.match(editor,/contentApproved:false/);
 assert.match(editor,/X-PQD-Expected-Revision/);
 assert.match(editor,/Consulta el registro de envíos/);
 assert.doesNotMatch(editor,/media_publish|fetch\(\s*["']https:\/\/graph\.facebook/);
});
test("Endpoints de borradores son privados, comprueban origen y no publican",()=>{
 const center=read("app/api/meta/borradores/route.ts");
 const media=read("app/api/meta/borradores/media/route.ts");
 const bridge=read("lib/meta-drafts-bridge.ts");
 assert.match(center,/await verifyEditor\(\)/);
 assert.match(center,/origin!==req.nextUrl.origin/);
 assert.match(media,/await verifyEditor\(\)/);
 assert.match(media,/origin!==req.nextUrl.origin/);
 assert.match(bridge,/X-PQD-Meta-Bridge/);
 assert.match(bridge,/getSession/);
 assert.match(bridge,/Bearer /);
 assert.match(bridge,/api\/editorial\/meta\/drafts/);
 assert.doesNotMatch(center,/graph.facebook.com|media_publish/);
 assert.doesNotMatch(media,/graph.facebook.com|media_publish/);
});

test("La sesión editorial se renueva en publicar e integraciones",()=>{
 const middleware=read("proxy.ts");
 assert.match(middleware,/\/publicar\/:path\*/);
 assert.match(middleware,/\/integraciones\/:path\*/);
 assert.match(middleware,/client\.auth\.getUser\(\)/);
});

test("Enviar TEST-001 requiere segunda confirmación y registra Meta IDs sin duplicar",()=>{
 const comp=read("components/MetaComposer.tsx");
 const api=read("app/api/meta/publicar/route.ts");
 const bridge=read("lib/meta-drafts-bridge.ts");
 assert.match(comp,/window.confirm/);
 assert.match(comp,/liveConsent/);
 assert.match(comp,/PUBLICAR_TEST001_UNA_VEZ/);
 assert.match(comp,/record\?\./);
 assert.match(comp,/!!record\|\|checking\|\|!readiness/);
 assert.match(api,/await verifyEditor\(\)/);
 assert.match(api,/origin!==req.nextUrl.origin/);
 assert.match(bridge,/metaPublishBridge/);
 assert.match(bridge,/getSession/);
 assert.doesNotMatch(api,/graph.facebook.com|access_token/);
});

test("Centro Editorial solo permite TEST001 con preflight listo y doble confirmación",()=>{
 const src=read("components/MetaComposer.tsx");
 const api=read("app/api/meta/publicar/route.ts");
 assert.match(src,/preflight=1/);
 assert.match(src,/Volver a comprobar permisos sin publicar/);
 assert.match(src,/readiness\?\.channels\[channel\]\?\.ready/);
 assert.match(src,/window.confirm/);
 assert.match(src,/liveConsent/);
 assert.match(src,/!!record\|\|checking/);
 assert.match(api,/args.set\("preflight","1"\)/);
 assert.match(api,/await verifyEditor\(\)/);
});

test("Cuatro destinos Meta con historias condicionadas y sin cron activo",()=>{
 const src=read("components/MetaComposer.tsx");
 const page=read("app/publicar/page.tsx");
 assert.match(src,/\["facebook_feed","instagram_feed","facebook_story","instagram_story"\] as const/);
 assert.match(src,/INSTAGRAM_STORIES_BUSINESS_REQUIRED/);
 assert.match(src,/FACEBOOK_STORY_BUSINESS_PERMISSION_REQUIRED/);
 assert.match(src,/readiness\?\.channels\[channel\]\?\.ready/);
 assert.match(src,/window.confirm/);
 assert.match(page,/programación automática continúa desactivada/);
 assert.doesNotMatch(src,/setInterval|setTimeout\(.*publishTest|crons\//);
});

test("Feed e historias tienen aprobaciones independientes y diagnóstico de Meta en solo lectura",()=>{
 const comp=read("components/MetaComposer.tsx");
 const css=read("app/publicar/publicar.css");
 assert.match(comp,/Aprobar publicaciones del feed/);
 assert.match(comp,/Aprobar específicamente la imagen vertical y las historias/);
 assert.match(comp,/storyApproved/);
 assert.match(comp,/storyApprovalAt/);
 assert.match(comp,/storySavedAndUnchanged/);
 assert.match(comp,/setSavedBaseline\(current\)/);
 assert.match(comp,/storyAccounts/);
 assert.match(comp,/Consulta sin publicaciones|consulta sin publicaciones/);
 assert.match(comp,/channel.endsWith\("_story"\)\?draft.storyApproved:draft.contentApproved/);
 assert.match(css,/meta-publisher-diagnostics/);
});

test("El enlace directo de TEST-001 abre el borrador privado sin publicar automáticamente",()=>{
 const page=read("app/publicar/page.tsx");
 const editor=read("components/MetaComposer.tsx");
 assert.match(page,/searchParams:Promise<\{test\?:string\}>/);
 assert.match(page,/autoOpenTest=\(await searchParams\).test==="1"/);
 assert.match(editor,/didOpenLinkedTest=useRef\(false\)/);
 assert.match(editor,/x\.id==="8077d038-98eb-4729-abe5-425a26267460"/);
 assert.match(editor,/if\(test\)\{didOpenLinkedTest.current=true;openExisting\(test\);\}/);
 assert.match(editor,/meta-story-approval/);
 assert.match(editor,/Comprobar permisos sin publicar/);
 assert.match(editor,/window.confirm/);
 assert.match(editor,/liveConsent/);
});

test("Una casilla marcada sin guardar no se presenta como aprobacion persistida ni habilita envio",()=>{
 const ui=read("components/MetaComposer.tsx");
 assert.match(ui,/const storyApprovalStored=draft.storyApproved===true&&savedBaseline\?\.storyApproved===true/);
 assert.match(ui,/La casilla está marcada, pero todavía NO has guardado la aprobación/);
 assert.match(ui,/Historias: \{storyApprovalStored\?"aprobadas y guardadas":draft.storyApproved\?"marcadas, falta GUARDAR"/);
 assert.match(ui,/Aprobación sin guardar: pulsa «Guardar borrador privado»/);
 assert.match(ui,/channel.endsWith\("_story"\)\?storyApprovalStored:feedApprovalStored/);
});

test("Confirmación Business independiente de aprobación y envío, con registro explícito",()=>{
 const ui=read("components/MetaComposer.tsx");
 assert.match(ui,/instagramBusinessConfirmed:false/);
 assert.match(ui,/Confirmo que @palabrasquedespiertan es una cuenta de empresa \(Business\)/);
 assert.match(ui,/businessOwnerConfirmationStored=/);
 assert.match(ui,/Confirmación Business.*todavía NO se ha guardado|confirmación Business está marcada pero todavía NO se ha guardado/);
 assert.match(ui,/Meta validará la elegibilidad en el envío/);
 assert.match(ui,/INSTAGRAM_BUSINESS_OWNER_CONFIRMATION_REQUIRED/);
 assert.match(ui,/window.confirm/);
 assert.match(ui,/!!record\|\|checking/);
});

test("Integraciones registra cuatro destinos y no vuelve a informar historias pendientes tras publicar",()=>{
 const panel=read("app/integraciones/page.tsx");
 assert.match(panel,/facebookStoryPublished=testReceipts\?\.deliveries\?\.facebook_story\?\.status==="published"/);
 assert.match(panel,/instagramStoryPublished=testReceipts\?\.deliveries\?\.instagram_story\?\.status==="published"/);
 assert.match(panel,/allTestPublished=bothFeedsPublished&&bothStoriesPublished/);
 assert.match(panel,/allTestPublished\?"4 de 4 confirmados"/);
 assert.match(panel,/Instagram · Historia/);
 assert.match(panel,/Facebook · Historia/);
 assert.match(panel,/testReceipts\.deliveries\.instagram_story\.metaPostId/);
 assert.match(panel,/Programación automática:\<\/strong\> desactivada/);
 assert.doesNotMatch(panel,/No hay historias publicadas de TEST-001/);
});

test("Calendario consulta Meta de forma autenticada y muestra conciliación sin crear envíos",()=>{
 const calendar=read("app/calendario/page.tsx");
 const component=read("components/MetaReconciliation.tsx");
 const proxy=read("app/api/meta/publicar/route.ts");
 assert.match(calendar,/await requireEditor\(\)/);
 assert.match(calendar,/MetaReconciliation/);
 assert.match(calendar,/new Date\(m.social_scheduled_at\).getTime\(\)>Date.now\(\)/);
 assert.match(component,/scheduled=1/);
 assert.match(component,/Coincidencia|coinciden|coincide|CONFLICTO/);
 assert.match(component,/Instagram: Meta Graph no ofrece en esta conexión una lista equivalente/);
 assert.match(component,/No se pudo verificar la programación/);
 assert.match(component,/Meta Business Suite/);
 assert.match(proxy,/verifyEditor\(\)/);
 assert.match(proxy,/args.set\("scheduled","1"\)/);
 assert.doesNotMatch(component,/fetch\([^\n]*method:"POST"/);
});
