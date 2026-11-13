import Link from "next/link";
import {BarChart3,Eye,CalendarDays,BookOpen,MessageSquareQuote,Users,ShieldCheck} from "lucide-react";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {readVisitStats,type VisitStats,type VisitKind} from "@/lib/visits";

export const dynamic="force-dynamic";
const num=new Intl.NumberFormat("es-CO");
const formatDay=(s:string)=>new Date(s+"T12:00:00Z").toLocaleDateString("es-CO",{day:"2-digit",month:"short",timeZone:"UTC"});
const names:Record<"articulo"|"mensaje"|"testimonio",string>={articulo:"Artículos",mensaje:"Mensajes",testimonio:"Testimonios"};
export default async function Estadisticas({searchParams}:{searchParams:Promise<{dias?:string}>}){
 const user=await requireEditor();
 const q=(await searchParams).dias;
 const days:7|30|90=q==="7"?7:q==="90"?90:30;
 let result:VisitStats|null=null;
 let unavailable=false;
 try{result=await readVisitStats(days);}catch{unavailable=true;}
 return <Shell section="Estadísticas" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">OBSERVATORIO EDITORIAL</p><h1>Lecturas que <em>dejan huella.</em></h1>
   <p>Consulta qué secciones, artículos, mensajes y testimonios reciben más visitas. Cifras anónimas de páginas vistas, no de personas identificadas.</p>
  </div>
  <div className="traffic-filters" aria-label="Periodo de estadísticas">
   {([7,30,90] as const).map(n=><Link key={n} href={"/estadisticas?dias="+n} aria-current={days===n?"page":undefined} className={days===n?"selected":""}>{n} días</Link>)}
  </div>
  {unavailable?<section className="section-card traffic-empty"><ShieldCheck size={27}/><h2>Estadísticas no disponibles en este momento</h2>
    <p>La revista continúa funcionando. El Centro no muestra números inventados cuando la lectura de datos no está disponible.</p></section>:result&&<>
   <section className="traffic-metrics" aria-label="Resumen de visitas">
    <article><Eye size={18}/><span>Vistas en el período</span><strong>{num.format(result.views)}</strong><small>Del {formatDay(result.from)} al {formatDay(result.to)}</small></article>
    <article><BarChart3 size={18}/><span>Desde que inició el registro</span><strong>{num.format(result.allTime)}</strong><small>{result.firstDate?("Desde "+formatDay(result.firstDate)):"Sin registros aún"}</small></article>
    <article><CalendarDays size={18}/><span>Hoy · Colombia</span><strong>{num.format(result.today)}</strong><small>Páginas consultadas hoy</small></article>
    <article><Eye size={18}/><span>Últimos 7 días</span><strong>{num.format(result.last7)}</strong><small>Vistas, incluidas las de hoy</small></article>
   </section>
   <section className="section-card traffic-block">
    <div className="section-card-header"><div><p className="kicker">EVOLUCIÓN</p><h2>Visitas por día</h2><p>Se suman las páginas vistas en cada fecha, según la hora de Colombia.</p></div><span className="section-count">{days} días</span></div>
    <div className="traffic-bars" role="img" aria-label={"Distribución diaria de "+result.views+" páginas vistas en el período"}>
     {result.daily.slice(-30).map(x=>{const max=Math.max(1,...result!.daily.slice(-30).map(d=>d.views));return <div className="traffic-bar-item" key={x.date} title={x.date+": "+x.views+" vistas"}>
       <div className="traffic-bar-count">{x.views||""}</div><div className="traffic-bar-track"><div style={{height:(x.views?Math.max(4,Math.round(x.views/max*100)):0)+"%"}}/></div>
       <span>{formatDay(x.date)}</span></div>;})}
    </div>
   </section>
   <section className="section-card traffic-block">
    <div className="section-card-header"><div><p className="kicker">INTERÉS DE LOS LECTORES</p><h2>Qué están leyendo</h2><p>Visitas clasificadas por las áreas de la revista.</p></div></div>
    <div className="traffic-categories">{result.categories.map(c=><div key={c.kind}>
      <span>{c.label}</span><strong>{num.format(c.views)}</strong>
      <div className="traffic-category-track"><div style={{width:(result!.views?Math.round(c.views/result!.views*100):0)+"%"}}/></div>
     </div>)}</div>
   </section>
   <div className="traffic-content-grid">
    {(["articulo","mensaje","testimonio"] as const).map(kind=><section className="section-card traffic-ranking" key={kind}>
      <div className="section-card-header"><div><p className="kicker">{kind==="articulo"?"INVESTIGACIÓN":kind==="mensaje"?"REFLEXIÓN BREVE":"COMUNIDAD"}</p><h2>{names[kind]} más vistos</h2></div></div>
      <ol>{result!.top.filter(x=>x.kind===kind).slice(0,12).map((x,i)=><li key={x.code}><span className="traffic-rank">{String(i+1).padStart(2,"0")}</span>
         <div><small>{x.code}</small><a href={"https://www.palabrasquedespiertan.online"+x.href} target="_blank" rel="noopener noreferrer">{x.title}</a></div>
         <strong>{num.format(x.views)}</strong></li>)}
       {!result!.top.some(x=>x.kind===kind)&&<li className="traffic-no-data">Todavía no hay visitas registradas en esta sección.</li>}
      </ol>
    </section>)}
   </div>
   <section className="section-card traffic-ranking traffic-block">
    <div className="section-card-header"><div><p className="kicker">NAVEGACIÓN</p><h2>Otras páginas consultadas</h2></div></div>
    <ol>{result.sections.slice(0,15).map((x,i)=><li key={x.href}><span className="traffic-rank">{String(i+1).padStart(2,"0")}</span>
      <div><a href={"https://www.palabrasquedespiertan.online"+x.href} target="_blank" rel="noopener noreferrer">{x.title}</a></div><strong>{num.format(x.views)}</strong></li>)}
     {!result.sections.length&&<li className="traffic-no-data">Todavía no hay visitas registradas.</li>}
    </ol>
   </section>
   <p className="traffic-disclaimer"><ShieldCheck size={17}/> Conteo anónimo, sin cookies analíticas ni identificación de personas. Se registra cada carga o navegación de página compatible con JavaScript; las visitas pueden incluir recargas y no equivalen a visitantes únicos. Los datos comienzan desde la activación del contador; no incluyen tráfico anterior.</p>
  </>}
 </Shell>;
}
