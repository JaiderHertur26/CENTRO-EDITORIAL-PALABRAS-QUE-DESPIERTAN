import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {auditHistory,itemsList} from "@/lib/data";
export const dynamic="force-dynamic";
export default async function Auditoria(){
 const user=await requireEditor();
 const [audit,items]=await Promise.all([auditHistory(),itemsList()]);
 const index=new Map(items.map(i=>[i.id,i]));
 return <Shell section="Auditoría" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">MEMORIA INSTITUCIONAL</p><h1>Cada decisión <em>deja huella.</em></h1><p>Historial de cambios de visibilidad, textos y decisiones editoriales. Las operaciones se registran en Supabase.</p></div>
  <section className="section-card audit-list"><div className="section-card-header"><div><p className="kicker">REGISTRO CRONOLÓGICO</p><h2>Bitácora de publicaciones</h2></div><span className="section-count">{audit.length} eventos recientes</span></div>
  {audit.map(e=><div className="audit-event" key={e.id}><span className="audit-marker">✦</span><div><span className="item-code">{index.get(e.item_id)?.code||"REGISTRO"}</span><h3>{index.get(e.item_id)?.title||"Registro editorial"}</h3><p>{e.old_state?e.old_state+" → ":""}{e.new_state||"Cambio"} · {e.change_note||"Actualización"}</p></div><time>{new Date(e.changed_at).toLocaleString("es-CO",{timeZone:"America/Bogota"})}</time></div>)}
  {!audit.length&&<div className="empty-list">La bitácora se irá completando conforme se registren las decisiones.</div>}</section>
 </Shell>;
}
