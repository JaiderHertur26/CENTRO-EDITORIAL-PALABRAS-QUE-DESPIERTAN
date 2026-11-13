import fs from "node:fs";
import path from "node:path";
const project=path.resolve(import.meta.dirname,"..");
const website=path.resolve(project,"..","PÁGINA WEB");
const messagesRoot=path.resolve(project,"..","MENSAJES");
const articleData=JSON.parse(fs.readFileSync(path.join(website,"data/public-articles.json"),"utf8")).articulos;
const visibleMessages=JSON.parse(fs.readFileSync(path.join(website,"data/site-content.json"),"utf8")).mensajes;
const topics=JSON.parse(fs.readFileSync(path.join(website,"data/testimony-topics.json"),"utf8"));
function csvParse(input){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&c===','){row.push(cell);cell="";}
  else if(!quoted&&(c==='\r'||c==='\n')){
   if(c==='\r'&&input[i+1]==='\n')i++;
   row.push(cell);cell="";
   if(row.some(x=>x!==""))rows.push(row);row=[];
  }else cell+=c;
 }
 if(cell||row.length){row.push(cell);rows.push(row)}
 const [headers,...values]=rows;
 headers[0]=headers[0].replace(/^\uFEFF/,"");
 return values.map(v=>Object.fromEntries(headers.map((h,i)=>[h,v[i]??""])));
}
const catalog=csvParse(fs.readFileSync(path.join(messagesRoot,"CATALOGO_GENERAL_MENSAJES.csv"),"utf8"));
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const articleItems=articleData.map((a,i)=>({
 kind:"articulo",code:a.id,slug:a.slug,title:a.titulo,subtitle:a.subtitulo||"",summary:a.resumen||"",
 body:a.contenido||"",cover_url:a.imagen||null,bible_reference:"",season:null,series:null,
 approved_by_author:true,
 state:i===0?"published":"pending",published_at:i===0?"2026-11-13T12:00:00Z":null,
 position:i+1,source_url:"/articulos/"+a.slug,social_state:"no-programado",scheduled_at:null
}));
const publishedMessage=new Map(visibleMessages.map(m=>[m.id,m]));
const messageItems=catalog.map((m,i)=>{
 const known=publishedMessage.get(m.ID);
 const slug=known?.slug||("pd-"+m.ID.replace("PD-","").toLowerCase()+"-"+normalize(m.TITULO));
 return {
  kind:"mensaje",code:m.ID,slug,title:m.TITULO,subtitle:"",
  summary:known?.texto||"",body:known?.texto||"",cover_url:known?.imagen||null,
  bible_reference:known?.referencia||m.REFERENCIAS||"",
  season:"T"+String(m.TEMPORADA).padStart(2,"0"),
  series:"T"+String(m.TEMPORADA).padStart(2,"0")+"-S"+String(m.SERIE).padStart(2,"0"),
  approved_by_author:!!m.ESTADO_EDITORIAL?.includes("APROBADO"),
  state:m.ID==="PD-001"?"published":"pending",
  scheduled_at:null,published_at:m.ID==="PD-001"?"2026-11-12T19:00:00-05:00":null,
  position:i+1,source_url:m.INSTAGRAM_URL||null,
  social_state:m.ESTADO_PUBLICACION||"no-programado"
 };
});
const topicItems=topics.map((t,i)=>({
 kind:"tema",code:"TEMA-"+String(i+1).padStart(2,"0"),slug:t.slug,title:t.titulo,
 subtitle:t.subtitulo||"",summary:t.introduccion||"",body:t.pregunta||"",
 cover_url:null,bible_reference:t.referencia||"",season:null,series:null,
 approved_by_author:true,state:"published",scheduled_at:null,published_at:"2026-11-13T12:00:00Z",
 position:i+1,source_url:"/testimonios/"+t.slug,social_state:"no-programado"
}));
const all=[...articleItems,...messageItems,...topicItems];
if(articleItems.length!==12||messageItems.length!==20||topicItems.length!==6)throw Error("Counts differ from approved catalogs");
const keys=new Set(all.map(x=>x.kind+":"+x.slug));
if(keys.size!==all.length)throw Error("Repeated slugs");
fs.writeFileSync(path.join(project,"data","catalog.json"),JSON.stringify({
 source:"Instantánea de solo lectura de PÁGINA WEB y del catálogo de MENSAJES; generada 2026-11-13",
 articles:articleItems.map(x=>({kind:x.kind,code:x.code,slug:x.slug,title:x.title,subtitle:x.subtitle,summary:x.summary})),
 messages:messageItems.map((x,i)=>({kind:x.kind,code:x.code,slug:x.slug,title:x.title,season:x.season,series:x.series,social_state:x.social_state,social_date:catalog[i]?.FECHA_PROGRAMADA||catalog[i]?.FECHA_PUBLICACION||null,social_time:catalog[i]?.HORA_PROGRAMADA_COLOMBIA||null})),
 topics:topicItems.map(x=>({kind:x.kind,code:x.code,slug:x.slug,title:x.title}))
},null,2)+"\n");
const quote=x=>x==null?"null":"'"+String(x).replaceAll("'","''")+"'";
const columns=["kind","code","slug","title","subtitle","summary","body","cover_url","bible_reference","season","series","approved_by_author","state","scheduled_at","published_at","position","source_url","social_state"];
const values=all.map(item=>"("+columns.map(k=>typeof item[k]==="boolean"?(item[k]?"true":"false"):typeof item[k]==="number"?item[k]:quote(item[k])).join(",")+")");
const sql=[
 "-- Semilla fundacional revisable; solo la primera investigación se muestra en la revista.",
 "-- No altera jamás el indicador approved_by_author de un artículo existente.",
 "begin;",
 "insert into public.editorial_items ("+columns.join(",")+") values",
 values.join(",\n"),
 "on conflict(kind,slug) do nothing;",
 "commit;",
 ""
].join("\n");
fs.writeFileSync(path.join(project,"database","002_seed.sql"),sql);
console.log(JSON.stringify({articulos:articleItems.length,articulosPublicos:articleItems.filter(a=>a.state==="published").length,
  articulosPendientes:articleItems.filter(a=>a.state==="pending").length,mensajes:messageItems.length,temas:topicItems.length,bytes:Buffer.byteLength(sql)}));
