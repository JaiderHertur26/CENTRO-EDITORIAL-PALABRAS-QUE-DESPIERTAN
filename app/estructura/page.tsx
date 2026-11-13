import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {itemsList,visibleNow} from "@/lib/data";
import snapshot from "@/data/site-content.json";
export const dynamic="force-dynamic";
export default async function Estructura(){
 const user=await requireEditor();const all=await itemsList();const msgs=all.filter(x=>x.kind==="mensaje");
 return <Shell section="Temporadas y series" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">PLAN EDITORIAL MAESTRO</p><h1>Doce temporadas. <em>Un camino.</em></h1><p>El plan de 36 series organiza publicaciones existentes y futuras. No confunde una serie planificada con una ya publicada.</p></div>
  <div className="season-grid">{snapshot.temporadas.map(t=><article className="season-card" key={t.id}>
    <div className="season-header"><span className="season-big-number">{String(t.numero).padStart(2,"0")}</span><div><span className="item-code">{t.id}</span><h2>{t.titulo}</h2><p>{msgs.filter(m=>m.season===t.id&&visibleNow(m)).length} mensajes visibles</p></div></div>
    <div className="series-grid">{t.series.map(s=><div className="series-row" key={s.id}><span className="item-code">{s.id}</span><strong>{s.titulo}</strong><small>{msgs.filter(m=>m.series===s.id).length} preparados · {msgs.filter(m=>m.series===s.id&&visibleNow(m)).length} publicados</small></div>)}</div>
   </article>)}</div>
 </Shell>;
}
