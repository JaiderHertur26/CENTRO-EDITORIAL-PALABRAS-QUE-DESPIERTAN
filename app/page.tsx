import {Shell} from "@/components/Shell";
import {Board} from "@/components/Board";
import {requireEditor} from "@/lib/access";
import {itemsList,communityData,visibleNow} from "@/lib/data";
export const dynamic="force-dynamic";
export default async function Home(){
 const user=await requireEditor();
 const [items,community]=await Promise.all([itemsList(),communityData()]);
 const published=items.filter(visibleNow);
 const pending=items.filter(x=>x.state==="pending");
 const upcoming=items.filter(x=>x.state==="scheduled"&&!visibleNow(x)).length;
 const reports=community.reports.filter(x=>!x.resolved);
 const articles=items.filter(x=>x.kind==="articulo");
 return <Shell email={user.email||"Dirección"} section="Centro de mando">
  <div className="eyebrow-strip"><span className="tiny-diamond">◆</span> GESTIÓN PRIVADA DE LA REVISTA <span className="eyebrow-date">13 · NOV · 2026</span></div>
  <section className="welcome"><div><p className="kicker">DIRECCIÓN EDITORIAL</p>
    <h1>Una revista. <em>Una sola voz.</em><br/>Todo bajo tu mirada.</h1>
    <p>Organiza las publicaciones, decide qué aparece en la revista y acompaña la conversación con los lectores. Los originales y la aprobación del autor permanecen protegidos.</p></div>
    <div className="welcome-art"><img src="/portada-oficial.png" alt="Identidad editorial con brote iluminado"/></div>
  </section>
  <section className="stats" aria-label="Estado del proyecto">
   <div className="stat"><span>VISIBLES EN LA WEB</span><strong>{published.length}</strong><small>Contenidos abiertos al lector</small></div>
   <div className="stat"><span>EN PENDIENTES</span><strong>{pending.length}</strong><small>Listos para gestionar</small></div>
   <div className="stat"><span>PROGRAMADOS</span><strong>{upcoming}</strong><small>Se harán visibles en su fecha</small></div>
   <div className="stat"><span>PARTICIPACIONES</span><strong>{community.comments.length}</strong><small>Últimas conversaciones registradas</small></div>
   <div className="stat"><span>REPORTES ABIERTOS</span><strong>{reports.length}</strong><small>Requieren atención</small></div>
  </section>
  <section className="section-card" id="publicaciones"><div className="section-card-header"><div><p className="kicker">CONTROL DE VISIBILIDAD</p><h2>Publicaciones de la revista</h2><p>Los artículos aprobados pueden permanecer pendientes: tú decides cuándo pasan a la vista pública.</p></div><div className="live-indicator"><span/> CONECTADO A SUPABASE</div></div>
   <Board initial={items}/>
  </section>
  <section className="bottom-grid"><article className="notice-card"><BookIcon/><div><h3>Dos estados diferentes</h3><p>Un artículo puede estar <strong>aprobado por el autor</strong> y a la vez <strong>pendiente de mostrar</strong> en Internet. El Centro Editorial nunca borra esa aprobación al ocultarlo.</p></div></article>
   <article className="notice-card"><CalendarIcon/><div><h3>Calendario automático</h3><p>Programa una publicación en horario de Colombia. La web la mostrará desde el momento indicado, sin tener que iniciar otro despliegue.</p></div></article></section>
 </Shell>;
}
function BookIcon(){return <span className="notice-icon">✦</span>}
function CalendarIcon(){return <span className="notice-icon">◷</span>}
