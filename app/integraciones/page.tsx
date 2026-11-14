import Link from "next/link";
import {Cable,ShieldCheck,Instagram,Facebook,ExternalLink,LockKeyhole,CalendarClock,AlertCircle,CheckCircle2} from "lucide-react";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {metaIntegrationStatus,verifyMetaAppCredentials} from "@/lib/meta-connection";
import {metaVaultStatus} from "@/lib/meta-oauth";

export const dynamic="force-dynamic";
export default async function Integraciones({searchParams}:{searchParams:Promise<{meta?:string}>}){
 const user=await requireEditor();
 const state=metaIntegrationStatus();
 const [credentials,authorization]=await Promise.all([verifyMetaAppCredentials(),metaVaultStatus()]);
 const result=(await searchParams).meta;
 const hasAccess=authorization.connected&&authorization.scopes.includes("instagram_basic")&&authorization.scopes.includes("instagram_content_publish");
 const confirmed=hasAccess&&authorization.verifiedAccount&&authorization.username==="palabrasquedespiertan";
 const expired=authorization.verificationState==="expired";
 const accessDescription=!authorization.connected
  ?authorization.unavailable?"El almacén privado no respondió. Vuelve a consultar.":"Instagram todavía sin autorizar."
  :expired?"El token registrado ya no es válido; será necesario renovar la autorización."
  :confirmed?"Cuenta @palabrasquedespiertan identificada y confirmada con la API de Meta."
  :authorization.verificationState==="meta_unavailable"
   ?"La autorización está cifrada, pero Meta no respondió a la verificación de identidad."
   :authorization.verificationState==="awaiting_account_permission"
    ?"El token es válido, pero con los permisos actuales Meta no devolvió la identidad del perfil. La cuenta sigue pendiente de comprobación."
    :"Autorización cifrada recibida; comprobación de identidad pendiente.";
 return <Shell email={user.email||"Dirección"} section="Integraciones">
  <div className="page-heading">
   <p className="kicker">CONECTORES OFICIALES · META GRAPH API</p>
   <h1>Una revista. <em>Dos redes sociales.</em></h1>
   <p>Conexión oficial de Instagram y Facebook, con autorización individual y publicación automática desactivada hasta completar todas las verificaciones.</p>
  </div>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
     <p className="kicker">COMPROBACIÓN EN SERVIDOR · PRODUCCIÓN</p>
     <h2>Credenciales oficiales</h2>
     <p>Las claves se verifican sin mostrarlas ni enviarlas al navegador.</p>
   </div></div>
   <div className="meta-connect-redirect">
     <p><strong>Variables de Meta:</strong> {state.configuredCount} de 3 registradas en este despliegue.</p>
     <p><strong>Identificadores oficiales:</strong> {state.idsMatch?"Coinciden con la aplicación y la configuración orgánica de Instagram":"Pendientes de corrección"}.</p>
     <p><strong>Credenciales de aplicación:</strong> {credentials==="verified"?"Validadas por Meta":credentials==="unavailable"?"No fue posible contactar Meta":credentials==="missing"?"Faltan variables":"No se pudieron validar"}.</p>
     <p><strong>Permisos de publicación:</strong> {hasAccess?"Instagram: acceso básico y publicación orgánica concedidos; Facebook: pendiente.":"Instagram y Facebook: pendientes de autorización."}</p>
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
     <p className="kicker">META · INICIO DE SESIÓN UNIFICADO</p>
     <h2>Autorización de Instagram</h2>
     <p>El retorno oficial de Meta y el almacenamiento privado cifrado se encuentran configurados. El estado siguiente procede del registro real de autorización.</p>
   </div><span className="meta-connect-pending"><LockKeyhole size={15}/> {confirmed?"Identidad confirmada":hasAccess?"Autorizada · identidad por verificar":"Autorización pendiente"}</span></div>
   <div className="meta-connect-redirect">
     <code>https://c-edi-palabras-que-despiertan.vercel.app/api/meta/callback</code>
     {result==="autorizacion-recibida"&&<p><strong>Meta confirmó el consentimiento.</strong> La autorización se guardó cifrada. La identidad se comprueba por separado y ninguna publicación se envía durante este proceso.</p>}
     {result==="cancelado"&&<p><strong>Autorización cancelada.</strong> No se modificaron publicaciones ni calendarios.</p>}
     {result==="error"&&<p><strong>No se pudo completar el inicio de sesión.</strong> La autorización anterior, si existía, se conserva.</p>}
     <p><strong>Estado de acceso:</strong> {accessDescription}</p>
     {hasAccess&&<p><strong>Permisos concedidos:</strong> instagram_basic · instagram_content_publish.</p>}
     {authorization.connected&&authorization.expiresAt&&authorization.expiresAt>0&&<p><strong>Vencimiento registrado:</strong> {new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",dateStyle:"long"}).format(new Date(authorization.expiresAt*1000))}.</p>}
     {confirmed&&<p><strong>Cuenta confirmada:</strong> @{authorization.username}. El siguiente paso será integrar Facebook; todavía no se pueden publicar contenidos.</p>}
     {authorization.ready&&credentials==="verified"&&(!authorization.connected||expired)&&<form method="POST" action="/api/meta/connect">
       <button type="submit" className="gold-button">{expired?"Renovar autorización de Instagram":"Autorizar Instagram con Meta"}</button>
     </form>}
     <p>No selecciones cuentas publicitarias. Este procedimiento no publica ningún mensaje, artículo ni historia.</p>
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header">
    <div><p className="kicker">ESTADO DE CONEXIÓN</p><h2>Facebook e Instagram</h2>
     <p>{credentials==="verified"?"Aplicación validada por Meta. La autorización de cada red se verifica por separado.":state.reason}</p></div>
    <span className="meta-connect-pending"><LockKeyhole size={15}/> Publicación automática inactiva</span>
   </div>
   <div className="meta-connect-accounts">
    <div><Facebook size={24}/><div><strong>Facebook · Fanpage</strong>
      <a href="https://www.facebook.com/PalabrasQueDespiertan01" target="_blank" rel="noopener noreferrer">@{state.facebookPage} <ExternalLink size={13}/></a>
      <small>La página aparece vinculada en Meta Business Suite. Falta obtener y verificar el permiso de publicación de Facebook.</small></div>
     <span className="meta-connect-state"><AlertCircle size={15}/> Pendiente de autorización</span></div>
    <div><Instagram size={24}/><div><strong>Instagram · Perfil oficial</strong>
      <a href="https://www.instagram.com/palabrasquedespiertan/" target="_blank" rel="noopener noreferrer">@{state.instagramAccount} <ExternalLink size={13}/></a>
      <small>{accessDescription}</small></div>
     <span className="meta-connect-state">{confirmed?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>} {confirmed?"Identidad verificada":hasAccess?"Autorizada · verificación pendiente":"Sin autorización"}</span></div>
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div><p className="kicker">IMPLEMENTACIÓN SEGURA</p><h2>Etapas de la integración</h2>
    <p>Seguimiento real de avances, sin dar por completado ningún permiso no verificado.</p></div></div>
   <ol className="meta-connect-steps">
    <li><span>01</span><div><strong>Identificar las cuentas oficiales</strong>
     <p>Meta Business Suite mostró la fanpage y @palabrasquedespiertan dentro del portafolio P Jaider HerTur. La vinculación está observada; falta comprobar permisos de API de la fanpage.</p>
     <div className="meta-connect-links"><a href="https://business.facebook.com/settings/" target="_blank" rel="noopener noreferrer">Configuración del negocio <ExternalLink size={13}/></a>
      <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">Meta Business Suite <ExternalLink size={13}/></a></div></div>
     <span className="meta-connect-state">Cuentas identificadas</span></li>
    <li><span>02</span><div><strong>Crear y validar la aplicación oficial Meta</strong>
     <p>Aplicación creada con configuración «PQD Instagram Organico» y sin permisos publicitarios. Las credenciales se comprueban en el servidor.</p>
     <div className="meta-connect-links"><a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">Meta for Developers <ExternalLink size={13}/></a></div></div>
     <span className="meta-connect-state">{credentials==="verified"?"Credenciales verificadas":"Validación pendiente"}</span></li>
    <li><span>03</span><div><strong>Autorizar y verificar Instagram y Facebook</strong>
     <p>{hasAccess?"Consentimiento de Instagram recibido y cifrado. "+(confirmed?"Su identidad ha sido confirmada.":"Falta confirmar su identidad mediante Meta.")+" Facebook sigue pendiente.":"Pendiente del consentimiento de Instagram y Facebook."}</p></div>
     <span className="meta-connect-state">{confirmed?"Instagram verificada · Facebook pendiente":hasAccess?"Instagram autorizada · en comprobación":"Pendiente"}</span></li>
    <li><span>04</span><div><strong>Prueba controlada y calendario</strong>
     <p>Antes de habilitar envíos: confirmar la fanpage, aprobar una prueba de publicación, verificar el identificador real y evitar duplicaciones con las publicaciones ya programadas.</p></div>
     <span className="meta-connect-state">Pendiente</span></li>
   </ol>
  </section>
  <div className="meta-connect-warning"><ShieldCheck size={19}/>
   <p><strong>Regla de seguridad:</strong> este panel no modifica los calendarios existentes, no crea publicaciones en redes y no presume que una fecha editorial equivale a una publicación confirmada en Meta. Facebook e Instagram continuarán gestionándose como hasta ahora hasta finalizar la conexión.</p></div>
  <p className="meta-connect-links"><Link href="/calendario"><CalendarClock size={15}/> Ver el calendario actual</Link>
   <Link href="/enlaces"><Cable size={15}/> Consultar enlaces para redes</Link></p>
 </Shell>;
}
