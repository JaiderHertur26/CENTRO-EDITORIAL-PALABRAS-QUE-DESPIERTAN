import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {itemsList,visibleNow} from "@/lib/data";
import {MetaReconciliation} from "@/components/MetaReconciliation";

export const dynamic="force-dynamic";
const dateCO=(s:string|null)=>s?new Date(s).toLocaleString("es-CO",{dateStyle:"full",timeStyle:"short",timeZone:"America/Bogota"}):"Sin fecha";
export default async function Calendario(){
 const user=await requireEditor();
 const items=await itemsList();
 const scheduled=items.filter(x=>x.state==="scheduled"&&!visibleNow(x)).sort((a,b)=>String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
 const plannedSocial=items.filter(m=>m.kind==="mensaje"&&m.state==="scheduled"&&m.social_scheduled_at&&new Date(m.social_scheduled_at).getTime()>Date.now()).sort((a,b)=>String(a.social_scheduled_at).localeCompare(String(b.social_scheduled_at)));
 const awaitingMeta=items.filter(m=>m.kind==="mensaje"&&m.state==="scheduled"&&!m.social_scheduled_at&&m.scheduled_at).sort((a,b)=>String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
 const metaTarget=(webTime:string|null)=>webTime?new Date(new Date(webTime).getTime()+300000).toISOString():null;
 return <Shell section="Calendario" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">TIEMPOS Y PUBLICACIONES</p><h1>Un tiempo <em>para cada palabra.</em></h1><p>Agenda de la revista web y registro independiente de la programación de redes sociales. Todas las horas se muestran en Colombia.</p></div>
  <div className="dual-grid"><section className="section-card"><div className="section-card-header"><div><p className="kicker">REVISTA WEB</p><h2>Próximas publicaciones</h2></div><span className="section-count">{scheduled.length}</span></div>
   {scheduled.length?scheduled.map(p=><div className="calendar-item" key={p.id}><span className="calendar-day">{p.scheduled_at?new Date(p.scheduled_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",timeZone:"America/Bogota"}):"—"}</span><div><span className="item-code">{p.code}</span><h3>{p.title}</h3><p>{dateCO(p.scheduled_at)}</p></div></div>):<div className="empty-list">No hay publicaciones web programadas. Abre la ficha de una publicación y elige “Programado” para añadirla.</div>}
  </section><section className="section-card"><div className="section-card-header"><div><p className="kicker">FACEBOOK · INSTAGRAM</p><h2>Planificación de mensajes</h2></div><span className="section-count">{plannedSocial.length+awaitingMeta.length}</span></div>
    {plannedSocial.map(m=><div className="calendar-item" key={m.code}><span className="calendar-day">{m.social_scheduled_at?new Date(m.social_scheduled_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",timeZone:"America/Bogota"}):"—"}</span><div><span className="item-code">{m.code}</span><h3>{m.title}</h3><p>{dateCO(m.social_scheduled_at)} · Programación externa registrada</p></div></div>)}
    {awaitingMeta.map(m=><div className="calendar-item" key={m.code}><span className="calendar-day">{metaTarget(m.scheduled_at)?new Date(metaTarget(m.scheduled_at)!).toLocaleDateString("es-CO",{day:"2-digit",month:"short",timeZone:"America/Bogota"}):"—"}</span><div><span className="item-code">{m.code}</span><h3>{m.title}</h3><p>{dateCO(metaTarget(m.scheduled_at))} · Fecha objetivo; <strong>todavía no programado en Meta</strong></p><p>Historia prevista: 15 minutos después de la publicación principal.</p></div></div>)}
    <div className="source-note">Las fechas objetivo de los mensajes pendientes en Meta son una referencia editorial; no se han enviado ni programado en Facebook e Instagram. La revista ya tiene su propia publicación automática fijada cinco minutos antes.</div>
  </section></div>
  <MetaReconciliation planned={plannedSocial.map(m=>({code:m.code,title:m.title,socialAt:m.social_scheduled_at!,socialState:m.social_state}))}/>
 </Shell>;
}
