import Link from "next/link";
import {CheckCircle2,AlertCircle,ShieldCheck,LockKeyhole,ArrowLeft,RefreshCw} from "lucide-react";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {metaIntegrationStatus,verifyMetaAppCredentials} from "@/lib/meta-connection";
import {metaVaultStatus} from "@/lib/meta-oauth";

export const dynamic="force-dynamic";
export default async function SimulacionMeta(){
 const editor=await requireEditor();
 const [credential,access]=await Promise.all([verifyMetaAppCredentials(),metaVaultStatus()]);
 const app=metaIntegrationStatus();
 const required=["instagram_basic","instagram_content_publish","pages_show_list","pages_read_engagement","pages_manage_posts"];
 const missing=required.filter(scope=>!access.scopes.includes(scope));
 const checks=[
  {title:"Credenciales oficiales",ok:credential==="verified"&&app.idsMatch,
   detail:credential==="verified"?"Aplicación Meta validada desde el servidor":"Credenciales sin validar"},
  {title:"Autorización cifrada",ok:access.connected===true,
   detail:access.connected?"Token almacenado de forma privada":"No se confirmó el almacenamiento"},
  {title:"Cinco permisos orgánicos",ok:missing.length===0,
   detail:missing.length?"Pendientes: "+missing.join(", "):"Los cinco permisos han sido concedidos"},
  {title:"Identidad de Instagram",ok:access.verifiedAccount===true&&access.username==="palabrasquedespiertan",
   detail:access.verifiedAccount?"@"+access.username+" identificada por Meta":"Identidad no confirmada"},
  {title:"Página oficial de Facebook",ok:access.facebookPageVerified===true,
   detail:access.facebookPageVerified?(access.facebookPageName||"Fanpage")+" · "+(access.facebookPageId||"ID no disponible"):"Fanpage sin identificar"},
  {title:"Capacidad de crear contenido en Facebook",ok:access.facebookPageVerified===true&&access.facebookCanCreateContent===true,
   detail:access.facebookCanCreateContent?"Rol y token de página reconocidos":"Rol de publicación no confirmado"},
  {title:"Vigencia del token",ok:!!access.expiresAt&&access.expiresAt*1000>Date.now(),
   detail:access.expiresAt?"Vence "+new Intl.DateTimeFormat("es-CO",{dateStyle:"long",timeZone:"America/Bogota"}).format(new Date(access.expiresAt*1000)):"Sin vencimiento comprobado"}
 ];
 const count=checks.filter(c=>c.ok).length;
 return <Shell email={editor.email||"Dirección"} section="Integraciones">
  <div className="page-heading">
   <p className="kicker">SIMULACIÓN DE SOLO LECTURA · SIN PUBLICACIONES</p>
   <h1>Ensayo <em>técnico</em> de Meta</h1>
   <p>Comprobamos los requisitos de conexión de Instagram y Facebook. Esta página no crea publicaciones, contenedores, historias ni programaciones.</p>
  </div>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
    <p className="kicker">PRUEBA DE PREPARACIÓN</p>
    <h2>{count} de {checks.length} requisitos comprobados</h2>
    <p>Resultado de la lectura actual del servidor; no equivale a publicar correctamente una imagen.</p>
   </div><span className="meta-connect-pending"><LockKeyhole size={15}/> Envío inactivo</span></div>
   <div className="meta-connect-redirect">
    {checks.map((c,i)=><div key={c.title} style={{padding:"12px 0",borderBottom:i===checks.length-1?"none":"1px solid #4b3924"}}>
     <p style={{display:"flex",alignItems:"center",gap:10}}>{c.ok?<CheckCircle2 size={17}/>:<AlertCircle size={17}/>}<strong>{c.title} — {c.ok?"Correcto":"Pendiente"}</strong></p>
     <p>{c.detail}</p>
    </div>)}
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
    <p className="kicker">ETAPA SIGUIENTE · APROBACIÓN EXPRESA</p>
    <h2>Prueba real controlada</h2>
    <p>La autorización de Meta no garantiza que una publicación concreta sea aceptada.</p>
   </div></div>
   <div className="meta-connect-redirect">
    <p>Antes de enviar, todavía hace falta escoger un contenido de prueba autorizado, verificar sus imágenes y textos, incorporar protección contra duplicados y comprobar los identificadores reales que devuelva cada red.</p>
    <p><strong>No se enviará ningún contenido sin tu aprobación.</strong> Las fechas editoriales y las publicaciones programadas no se modifican.</p>
   </div>
  </section>
  <div className="meta-connect-warning"><ShieldCheck size={19}/><p><strong>Simulación sin envíos.</strong> {count===checks.length?"Los requisitos de conexión están preparados; falta probar el contenido y su entrega real.":"Hay requisitos pendientes que deben resolverse antes de una publicación real."}</p></div>
  <p className="meta-connect-links"><Link href="/integraciones"><ArrowLeft size={15}/> Regresar a Integraciones</Link>
   <Link href="/integraciones/simulacion"><RefreshCw size={15}/> Repetir diagnóstico</Link></p>
 </Shell>;
}
