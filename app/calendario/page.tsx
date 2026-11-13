import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {itemsList,visibleNow} from "@/lib/data";

export const dynamic="force-dynamic";
const dateCO=(s:string|null)=>s?new Date(s).toLocaleString("es-CO",{dateStyle:"full",timeStyle:"short",timeZone:"America/Bogota"}):"Sin fecha";
export default async function Calendario(){
 const user=await requireEditor();
 const items=await itemsList();
 const scheduled=items.filter(x=>x.state==="scheduled"&&!visibleNow(x)).sort((a,b)=>String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
 const plannedSocial=items.filter(m=>m.kind==="mensaje"&&m.social_scheduled_at&&m.social_state.includes("PROGRAMADO")).sort((a,b)=>String(a.social_scheduled_at).localeCompare(String(b.social_scheduled_at)));
 return <Shell section="Calendario" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">TIEMPOS Y PUBLICACIONES</p><h1>Un tiempo <em>para cada palabra.</em></h1><p>Agenda de la revista web y registro independiente de la programación de redes sociales. Todas las horas se muestran en Colombia.</p></div>
  <div className="dual-grid"><section className="section-card"><div className="section-card-header"><div><p className="kicker">REVISTA WEB</p><h2>Próximas publicaciones</h2></div><span className="section-count">{scheduled.length}</span></div>
   {scheduled.length?scheduled.map(p=><div className="calendar-item" key={p.id}><span className="calendar-day">{p.scheduled_at?new Date(p.scheduled_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",timeZone:"America/Bogota"}):"—"}</span><div><span className="item-code">{p.code}</span><h3>{p.title}</h3><p>{dateCO(p.scheduled_at)}</p></div></div>):<div className="empty-list">No hay publicaciones web programadas. Abre la ficha de una publicación y elige “Programado” para añadirla.</div>}
  </section><section className="section-card"><div className="section-card-header"><div><p className="kicker">FACEBOOK · INSTAGRAM</p><h2>Planificación de mensajes</h2></div><span className="section-count">{plannedSocial.length}</span></div>
    {plannedSocial.map(m=><div className="calendar-item" key={m.code}><span className="calendar-day">{m.social_scheduled_at?new Date(m.social_scheduled_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",timeZone:"America/Bogota"}):"—"}</span><div><span className="item-code">{m.code}</span><h3>{m.title}</h3><p>{dateCO(m.social_scheduled_at)} · Programación externa registrada</p></div></div>)}
    <div className="source-note">Registro importado del catálogo oficial de mensajes. La programación en Meta no implica automáticamente publicación visible en la revista y debe verificarse desde sus plataformas.</div>
  </section></div>
 </Shell>;
}
