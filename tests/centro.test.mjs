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
 assert.match(auth,/discussion_moderators/);
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
