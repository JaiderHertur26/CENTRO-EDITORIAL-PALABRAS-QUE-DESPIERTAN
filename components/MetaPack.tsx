"use client";
import {useMemo,useState} from "react";
import {Copy,Link2,Share2,CalendarClock,Check} from "lucide-react";
import type {MetaPublication} from "@/lib/meta";
const hour=(s:string|null)=>s?new Date(s).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Bogota"}):"Pendiente de programación";
export function MetaPack({items}:{items:MetaPublication[]}){
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("todos");
 const [copied,setCopied]=useState("");
 const rows=useMemo(()=>items.filter(x=>
  (filter==="todos"||x.state===filter)&&
  (x.code+" "+x.title).toLowerCase().includes(query.trim().toLowerCase())
 ),[items,query,filter]);
 function caption(x:MetaPublication){
  return [
   x.code+" · "+x.title,"",x.body,"",
   ...(x.bible_reference?["Fundamento bíblico: "+x.bible_reference]:[]),
   "P. Jaider Herrera Turizo","","LEE Y COMENTA LA REFLEXIÓN COMPLETA:",
   x.canonical_url,"","#PalabrasQueDespiertan #FeCatólica #Oración"
  ].join("\n");
 }
 async function copy(what:string,text:string){
  try{await navigator.clipboard.writeText(text);setCopied(what);}
  catch{setCopied("No se pudo copiar. Abre el enlace y copia la dirección.");}
 }
 return <section className="section-card">
  <div className="section-card-header"><div><p className="kicker">CARPETA DE DIFUSIÓN</p><h2>Enlaces y descripciones originales</h2><p>Solo se incluyen los textos aprobados y las direcciones estables de la revista.</p></div><span className="section-count">{items.length}</span></div>
  <div className="toolbar" style={{paddingTop:22}}>
   <label className="search-field"><Link2 size={17}/><input aria-label="Buscar mensaje" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por número o título"/></label>
   <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar por estado"><option value="todos">Todos los mensajes</option><option value="scheduled">Programados</option><option value="pending">Pendientes</option><option value="published">Publicados</option></select>
  </div>
  <div className="meta-list">
   {rows.map(item=><article className="meta-item" key={item.code}>
    <div className="meta-item-top"><span className="item-code">{item.code}</span><span className={"state "+(item.state==="published"?"visible":item.state)}>{item.state==="published"?"Publicado":item.state==="scheduled"?"Programado":"Pendiente"}</span></div>
    <h3>{item.title}</h3>
    <p className="meta-date"><CalendarClock size={15}/>Web: {hour(item.scheduled_at)} · Meta: {hour(item.social_scheduled_at)}</p>
    <p className="meta-url">{item.canonical_url}</p>
    <div className="meta-copy-actions">
     <button className="muted-button" onClick={()=>void copy(item.code+"url",item.canonical_url)}><Copy size={15}/> Copiar enlace</button>
     <button className="gold-button small" onClick={()=>void copy(item.code+"caption",caption(item))}><Share2 size={15}/> Copiar descripción con enlace</button>
    </div>
    {copied===item.code+"url"&&<p className="meta-success"><Check size={14}/>Enlace copiado</p>}
    {copied===item.code+"caption"&&<p className="meta-success"><Check size={14}/>Texto y enlace copiados</p>}
   </article>)}
   {rows.length===0&&<div className="empty-list">No hay mensajes con este filtro.</div>}
  </div>
  <p className="board-footnote">Los enlaces programados pueden mostrar «no disponible» antes de su hora. Copiar aquí no modifica por sí solo las entradas ya programadas en Meta.</p>
 </section>;
}
