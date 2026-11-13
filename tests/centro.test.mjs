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
