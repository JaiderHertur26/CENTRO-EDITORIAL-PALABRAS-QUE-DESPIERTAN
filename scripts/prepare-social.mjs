import fs from "node:fs";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const cat=JSON.parse(fs.readFileSync(path.join(root,"data/catalog.json"),"utf8"));
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const rows=cat.messages.filter(m=>m.social_date&&/^\d{4}-\d{2}-\d{2}$/.test(m.social_date));
const sql=[
 "-- Calendario social leído del CSV maestro (solo lectura).",
 "begin;",
 "alter table public.editorial_items add column if not exists social_scheduled_at timestamptz;",
 ...rows.map(m=>{
  const date=m.social_date+"T"+(m.social_time||"19:00")+":00-05:00";
  return "update public.editorial_items set social_scheduled_at="+q(date)+
   " where kind='mensaje' and code="+q(m.code)+" and social_scheduled_at is distinct from "+q(date)+"::timestamptz;";
 }),
 "commit;",""
].join("\n");
fs.writeFileSync(path.join(root,"database/003_social_schedule.sql"),sql);
console.log("Social calendar migration prepared: "+rows.length+" dated messages");
