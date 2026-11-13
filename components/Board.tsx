"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {Search,Plus,Eye,EyeOff,Pencil,CalendarClock,X,Check,Loader2,ExternalLink,FileText,MessageCircle,MessagesSquare,ChevronRight,ShieldCheck} from "lucide-react";
import type {EditorialItem} from "@/lib/data";

type Kind="articulo"|"mensaje"|"tema";
const kindLabels:Record<Kind,string>={articulo:"Artículos",mensaje:"Mensajes",tema:"Testimonios"};
const stat:Record<string,string>={pending:"Pendiente",published:"Visible",scheduled:"Programado"};
const timezone="America/Bogota";
const canShow=(i:EditorialItem)=>i.state==="published"||(i.state==="scheduled"&&i.scheduled_at!==null&&new Date(i.scheduled_at).getTime()<=Date.now());
function dateCO(date:string|null){
 if(!date)return "—";
 return new Date(date).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short",timeZone:timezone});
}
function datetimeLocal(date:string|null){
 if(!date)return "";
 const d=new Date(date);return new Intl.DateTimeFormat("sv-SE",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(d).replace(" ","T");
}
function icon(k:Kind){return k==="articulo"?<FileText size={16}/>:k==="mensaje"?<MessageCircle size={16}/>:<MessagesSquare size={16}/>}
export function Board({initial}:{initial:EditorialItem[]}){
 const router=useRouter();
 const [kind,setKind]=useState<Kind>("articulo");
 const [query,setQuery]=useState("");
 const [statusFilter,setStatusFilter]=useState("todos");
 const [editor,setEditor]=useState<(EditorialItem&{body:string})|null>(null);
 const [create,setCreate]=useState(false);
 const [newItem,setNewItem]=useState({kind:"articulo" as Kind,code:"",slug:"",title:"",body:"",summary:"",confirmApproval:false});
 const [schedule,setSchedule]=useState("");
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const grouped=useMemo(()=>initial.filter(i=>i.kind===kind),[initial,kind]);
 const list=useMemo(()=>grouped.filter(i=>(statusFilter==="todos"||i.state===statusFilter)&&
  (i.title+" "+i.code+" "+i.summary).toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")))
  .sort((a,b)=>a.position-b.position),[grouped,statusFilter,query]);
 const totals=(type:Kind)=>initial.filter(i=>i.kind===type).length;
 const published=grouped.filter(canShow).length;
 const pending=grouped.filter(i=>i.state==="pending").length;

 async function loadItem(id:string){
  setBusy(id);setError("");setSuccess("");
  try{
   const r=await fetch("/api/items?id="+encodeURIComponent(id),{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||"No se pudo abrir esta publicación");
   setEditor(j.item);
   setSchedule(datetimeLocal(j.item.scheduled_at));
  }catch(e){setError(e instanceof Error?e.message:"No se pudo abrir");}
  finally{setBusy("");}
 }
 async function patch(item:EditorialItem,payload:Record<string,unknown>,close=true){
  setBusy(item.id);setError("");setSuccess("");
  try{
   const r=await fetch("/api/items",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id,updated_at:item.updated_at,...payload})});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||"No fue posible guardar");
   setSuccess("Cambios guardados y sincronizados con la revista.");
   if(close)setEditor(null);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Ocurrió un problema");}
  finally{setBusy("");}
 }
 async function toggle(item:EditorialItem){
  const willPublish=!canShow(item);
  if(willPublish&&!item.approved_by_author){setError("Este contenido necesita aprobación autoral antes de mostrarse.");return;}
  if(!window.confirm(willPublish?"¿Publicar «"+item.title+"» en la revista ahora?":"¿Retirar «"+item.title+"» de la vista pública? El original y sus comentarios se conservarán."))return;
  await patch(item,{state:willPublish?"published":"pending",change_note:willPublish?"Publicación activada desde el Centro":"Visibilidad desactivada desde el Centro"});
 }
 async function saveEditor(){
  if(!editor)return;
  const form=document.querySelector<HTMLFormElement>("#edit-form");
  if(!form)return;
  const fd=new FormData(form);
  const state=String(fd.get("state"));
  const date=String(fd.get("scheduled_at")||"");
  const dt=state==="scheduled"&&date?new Date(date+":00-05:00").toISOString():null;
  if(state==="scheduled"&&!date){setError("Indica una fecha de publicación en horario de Colombia.");return;}
  await patch(editor,{
   title:String(fd.get("title")),subtitle:String(fd.get("subtitle")),summary:String(fd.get("summary")),
   body:String(fd.get("body")),state,scheduled_at:dt,featured:fd.get("featured")==="on",
   cover_url:fd.get("cover_url")||null,bible_reference:String(fd.get("bible_reference")),
   change_note:String(fd.get("change_note")||"Cambios editoriales desde el Centro")
  });
 }
 async function addItem(){
  setBusy("new");setError("");setSuccess("");
  try{
   const r=await fetch("/api/items",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newItem)});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||"No se pudo crear");
   setCreate(false);setSuccess("Nueva publicación creada en Pendientes.");
   setKind(newItem.kind);setNewItem({kind:"articulo",code:"",slug:"",title:"",body:"",summary:"",confirmApproval:false});
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo crear");}
  finally{setBusy("");}
 }
 return <div className="board">
  <div className="board-tabs" role="tablist" aria-label="Tipo de publicación">
   {(["articulo","mensaje","tema"] as Kind[]).map(k=><button type="button" role="tab" aria-selected={kind===k} className={kind===k?"tab active":"tab"} onClick={()=>{setKind(k);setStatusFilter("todos");setQuery("");setError("");}} key={k}>{icon(k)}{kindLabels[k]}<span>{totals(k)}</span></button>)}
  </div>
  <div className="board-overview"><div><span className="big-number">{published}</span><span className="metric-caption">visibles en la revista</span></div><div><span className="big-number">{pending}</span><span className="metric-caption">en pendientes</span></div><p>Los cambios de visibilidad se aplican a listados y páginas individuales. Las fechas programadas utilizan hora de Colombia.</p></div>
  <div className="toolbar">
   <label className="search-field"><Search size={17}/><input aria-label="Buscar publicación" value={query} onChange={e=>setQuery(e.target.value)} placeholder={"Buscar "+kindLabels[kind].toLowerCase()+"..."}/></label>
   <select aria-label="Filtrar por estado" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="todos">Todos los estados</option><option value="pending">Pendientes</option><option value="published">Publicados</option><option value="scheduled">Programados</option></select>
   <button className="gold-button small" type="button" onClick={()=>{setCreate(true);setError("");}}><Plus size={17}/>Nueva publicación</button>
  </div>
  {error&&<div className="feedback error" role="alert">{error}<button onClick={()=>setError("")} aria-label="Cerrar"><X size={16}/></button></div>}
  {success&&<div className="feedback success" role="status">{success}<button onClick={()=>setSuccess("")} aria-label="Cerrar"><X size={16}/></button></div>}
  <div className="publication-list">
   <div className="table-head"><span>PUBLICACIÓN</span><span>ESTADO</span><span>PROGRAMACIÓN</span><span>CONTROL</span></div>
   {list.map(item=><article className="publication-row" key={item.id}>
    <div className="item-main"><span className="item-code">{item.code}</span><div><h3>{item.title}</h3><p>{item.kind==="articulo"?"Investigación teológica":item.kind==="mensaje"?"Pensamiento editorial":"Tema de testimonios"} · {item.approved_by_author?"Aprobado por el autor":"En preparación"}</p></div></div>
    <div><span className={"state "+(canShow(item)?"visible":item.state)}><span className="state-dot"/>{canShow(item)?"Visible":stat[item.state]}</span></div>
    <span className="schedule-date">{item.state==="scheduled"?dateCO(item.scheduled_at):item.state==="published"?dateCO(item.published_at):"Sin fecha de publicación"}</span>
    <div className="item-actions">
     <button className="icon-button" type="button" title="Editar y programar" aria-label={"Editar "+item.code} onClick={()=>void loadItem(item.id)}>{busy===item.id?<Loader2 size={17}/>:<Pencil size={17}/>}</button>
     <button className={"visibility-button "+(canShow(item)?"on":"")} disabled={busy===item.id} type="button" onClick={()=>void toggle(item)} aria-label={canShow(item)?"Ocultar "+item.code:"Mostrar "+item.code}>{canShow(item)?<Eye size={16}/>:<EyeOff size={16}/>}<span>{canShow(item)?"Retirar":"Publicar"}</span></button>
    </div>
   </article>)}
   {list.length===0&&<div className="empty-list">No hay publicaciones con estos criterios.</div>}
  </div>
  <p className="board-footnote"><ShieldCheck size={15}/> Ocultar una publicación no elimina su texto original, su autorización ni el historial de la comunidad.</p>
  {(editor||create)&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget){setEditor(null);setCreate(false);setError("");}}}>
   <div role="dialog" aria-modal="true" aria-label={create?"Nueva publicación":"Editar publicación"} className="editor-dialog">
    <header className="dialog-header"><div><p className="kicker">{create?"CREACIÓN EDITORIAL":"FICHA EDITORIAL"}</p><h2>{create?"Nueva publicación":editor?.code+" · "+editor?.title}</h2></div><button aria-label="Cerrar editor" className="icon-button" onClick={()=>{setEditor(null);setCreate(false);setError("");}}><X size={20}/></button></header>
    {error&&<div className="feedback error" role="alert">{error}</div>}
    {create?<form className="edit-form" onSubmit={e=>{e.preventDefault();void addItem();}}>
      <div className="form-two"><label>Tipo<select value={newItem.kind} onChange={e=>setNewItem({...newItem,kind:e.target.value as Kind})}><option value="articulo">Artículo</option><option value="mensaje">Mensaje</option><option value="tema">Tema de testimonios</option></select></label><label>Código<input required value={newItem.code} placeholder={newItem.kind==="articulo"?"ART-013":newItem.kind==="mensaje"?"PD-021":"TEMA-07"} onChange={e=>setNewItem({...newItem,code:e.target.value.toUpperCase()})}/></label></div>
      <label>Título<input required minLength={2} maxLength={240} value={newItem.title} onChange={e=>setNewItem({...newItem,title:e.target.value})}/></label>
      <label>Identificador web (slug)<input required placeholder="titulo-sin-acentos" value={newItem.slug} onChange={e=>setNewItem({...newItem,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-")})}/></label>
      <label>Resumen<textarea rows={3} value={newItem.summary} onChange={e=>setNewItem({...newItem,summary:e.target.value})}/></label>
      <label>Contenido inicial<textarea rows={9} value={newItem.body} onChange={e=>setNewItem({...newItem,body:e.target.value})}/></label>
      <label className="checkbox-line"><input type="checkbox" checked={newItem.confirmApproval} onChange={e=>setNewItem({...newItem,confirmApproval:e.target.checked})}/>Confirmo que el contenido ha sido aprobado por la dirección autora.</label>
      <p className="form-hint">La nueva obra comenzará en Pendientes. No aparecerá públicamente hasta que la publiques.</p>
      <div className="dialog-actions"><button type="button" className="muted-button" onClick={()=>setCreate(false)}>Cancelar</button><button className="gold-button" type="submit" disabled={busy==="new"}>Guardar borrador <Check size={16}/></button></div>
     </form>:editor&&<form id="edit-form" className="edit-form" onSubmit={e=>{e.preventDefault();void saveEditor();}}>
      <div className="form-two"><label>Estado<select name="state" defaultValue={editor.state} onChange={e=>{const s=e.target.value;if(s==="scheduled"&&!schedule)setSchedule(datetimeLocal(new Date(Date.now()+86400000).toISOString()));}}><option value="pending">Pendiente / oculto</option><option value="published">Publicado / visible</option><option value="scheduled">Programado</option></select></label>
      <label>Fecha y hora (Colombia)<input name="scheduled_at" type="datetime-local" value={schedule} onChange={e=>setSchedule(e.target.value)}/></label></div>
      <div className="approval-note">{editor.approved_by_author?"✓ Texto aprobado por el autor; se conserva esta aprobación aunque esté pendiente.":"Esta obra no tiene aprobación autoral; no debe hacerse pública."}</div>
      <label>Título<input name="title" required defaultValue={editor.title} maxLength={240}/></label>
      <label>Subtítulo<input name="subtitle" defaultValue={editor.subtitle||""}/></label>
      <label>Resumen / introducción<textarea name="summary" rows={4} defaultValue={editor.summary||""}/></label>
      <label>Contenido original autorizado / texto de publicación<textarea className="editor-body" name="body" rows={12} defaultValue={editor.body||""}/></label>
      <div className="form-two"><label>Referencia bíblica<input name="bible_reference" defaultValue={editor.bible_reference||""}/></label><label>Imagen de portada<input name="cover_url" defaultValue={editor.cover_url||""} placeholder="https://..."/></label></div>
      <label>Nota para la bitácora<input name="change_note" maxLength={500} defaultValue="Actualización editorial desde el Centro"/></label>
      <label className="checkbox-line"><input type="checkbox" name="featured" defaultChecked={editor.featured}/>Destacar esta publicación</label>
      <p className="form-hint">Programar una fecha publica automáticamente el contenido desde esa hora; no programa publicaciones en Facebook o Instagram.</p>
      <div className="dialog-actions"><button type="button" className="muted-button" onClick={()=>setEditor(null)}>Cancelar</button><button className="gold-button" disabled={busy===editor.id} type="submit">{busy===editor.id?"Guardando…":"Guardar cambios"} <Check size={16}/></button></div>
     </form>}
   </div>
  </div>}
 </div>;
}
