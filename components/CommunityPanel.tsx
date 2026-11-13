"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {MessageSquareText,Users,Flag,EyeOff,CheckCircle,Search,X,ShieldCheck} from "lucide-react";
type Comment={id:string;subject_type:string;subject_id:string;display_name:string;body:string;created_at:string;status:string;author_id:string;parent_id:string|null};
type Report={id:string;entry_id:string;reporter_id:string;motive:string;details:string|null;created_at:string;resolved:boolean};
type Person={id:string;email:string;verified:boolean;joined:string;lastLogin:string|null};
type Props={initial:{comments:Comment[];reports:Report[];people:Person[];audit:unknown[]}};
export function CommunityPanel({initial}:Props){
 const [tab,setTab]=useState<"comments"|"reports"|"people">("comments");
 const [search,setSearch]=useState("");
 const [busy,setBusy]=useState("");
 const [message,setMessage]=useState("");
 const router=useRouter();
 const openReports=initial.reports.filter(r=>!r.resolved);
 async function action(type:"hide"|"resolve",id:string){
  const prompt=type==="hide"?"Razón de la retirada (quedará en auditoría):":"Nota de resolución del reporte:";
  const note=window.prompt(prompt, type==="hide"?"Infracción de las normas de participación":"Reporte revisado por la dirección editorial");
  if(note===null)return;
  setBusy(id);setMessage("");
  try{
   const r=await fetch("/api/community",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,id,note})});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||"No se pudo aplicar la decisión");
   setMessage("Decisión guardada en Supabase.");
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo completar");}
  finally{setBusy("");}
 }
 return <section className="section-card community-space">
  <div className="community-tabs">
   <button className={tab==="comments"?"active":""} onClick={()=>setTab("comments")}><MessageSquareText size={17}/> Conversaciones <span>{initial.comments.length}</span></button>
   <button className={tab==="reports"?"active":""} onClick={()=>setTab("reports")}><Flag size={17}/> Reportes <span>{openReports.length}</span></button>
   <button className={tab==="people"?"active":""} onClick={()=>setTab("people")}><Users size={17}/> Participantes <span>{initial.people.length}</span></button>
  </div>
  <div className="toolbar"><label className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar en esta sección..." aria-label="Buscar"/></label></div>
  {message&&<div className="feedback" role="status">{message}<button onClick={()=>setMessage("")}><X size={15}/></button></div>}
  {tab==="comments"&&<div className="community-feed">
   {initial.comments.filter(x=>(x.display_name+" "+x.body+" "+x.subject_id).toLowerCase().includes(search.toLowerCase())).map(c=><article className="comment-tile" key={c.id}>
    <div className="comment-head"><strong>{c.display_name}</strong><span className={"state "+(c.status==="approved"?"visible":"pending")}>{c.status==="approved"?"Pública":c.status}</span><time>{new Date(c.created_at).toLocaleString("es-CO",{timeZone:"America/Bogota"})}</time></div>
    <p className="comment-context">{c.subject_type==="articulo"?"ARTÍCULO":c.subject_type==="mensaje"?"MENSAJE":"TESTIMONIO"} · {c.subject_id} {c.parent_id?"· RESPUESTA":""}</p>
    <p>{c.body}</p>
    <div className="comment-foot"><span>Identificador privado: {c.author_id.slice(0,8)}…</span>{c.status==="approved"&&<button disabled={busy===c.id} onClick={()=>void action("hide",c.id)}><EyeOff size={15}/> Retirar contenido</button>}</div>
   </article>)}
   {!initial.comments.length&&<div className="empty-list">Todavía no se registran comentarios ni respuestas.</div>}
  </div>}
  {tab==="reports"&&<div className="community-feed">{initial.reports.filter(r=>(r.motive+" "+(r.details??"")).toLowerCase().includes(search.toLowerCase())).map(r=><article className="comment-tile" key={r.id}>
   <div className="comment-head"><strong>{r.motive.replaceAll("_"," ")}</strong><span className={"state "+(r.resolved?"visible":"pending")}>{r.resolved?"Resuelto":"Por atender"}</span><time>{new Date(r.created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota"})}</time></div>
   <p>{r.details||"El lector no añadió detalles."}</p><p className="comment-context">Comentario: {r.entry_id}</p>
   {!r.resolved&&<div className="comment-foot"><span>Evaluar con prudencia y caridad.</span><button disabled={busy===r.id} onClick={()=>void action("resolve",r.id)}><CheckCircle size={15}/> Marcar atendido</button></div>}
  </article>)}{!initial.reports.length&&<div className="empty-list">No hay reportes. La comunidad está al día.</div>}</div>}
  {tab==="people"&&<div className="people-table"><div className="table-head"><span>CORREO PRIVADO</span><span>CUENTA</span><span>REGISTRO</span></div>
  {initial.people.filter(x=>x.email.toLowerCase().includes(search.toLowerCase())).map(p=><article key={p.id} className="person-row">
   <div className="person-profile"><span className="person-avatar">{p.email.slice(0,1).toUpperCase()}</span><span><strong>{p.email}</strong><small>Datos privados: uso exclusivamente editorial</small></span></div>
   <div className={"state "+(p.verified?"visible":"pending")}>{p.verified?"Correo verificado":"Sin confirmar"}</div>
   <time>{new Date(p.joined).toLocaleDateString("es-CO",{timeZone:"America/Bogota"})}</time>
  </article>)}
  {!initial.people.length&&<div className="empty-list">No hay usuarios registrados.</div>}</div>}
  <p className="board-footnote"><ShieldCheck size={15}/> La dirección puede ocultar una participación publicada y atender reportes. Cada retirada se registra mediante los controles existentes de Supabase.</p>
 </section>;
}
