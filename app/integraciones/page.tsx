import Link from "next/link";
import {Cable,ShieldCheck,Instagram,Facebook,ExternalLink,LockKeyhole,CalendarClock,AlertCircle,CheckCircle2} from "lucide-react";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {metaIntegrationStatus,verifyMetaAppCredentials} from "@/lib/meta-connection";
import {metaVaultStatus} from "@/lib/meta-oauth";
import {metaPublishBridge} from "@/lib/meta-drafts-bridge";
type MetaReceiptResponse={deliveries?:Record<string,{status?:string;metaPostId?:string|null;permalink?:string|null}|null>};

function safeSocialUrl(value:string|undefined|null,host:"facebook.com"|"instagram.com"){
 if(!value)return null;
 try{const url=new URL(value);return url.protocol==="https:"&&
  (url.hostname===host||url.hostname==="www."+host)?url.toString():null;}
 catch{return null}
}
export const dynamic="force-dynamic";
export default async function Integraciones({searchParams}:{searchParams:Promise<{meta?:string}>}){
 const user=await requireEditor();
 const state=metaIntegrationStatus();
 const [credentials,authorization]=await Promise.all([verifyMetaAppCredentials(),metaVaultStatus()]);
 const result=(await searchParams).meta;
 const testReceipts=await metaPublishBridge("GET",
  new URLSearchParams({id:"8077d038-98eb-4729-abe5-425a26267460"}))
  .then(async r=>r.ok?await r.json() as MetaReceiptResponse:null)
  .catch(()=>null);
 const facebookTestPublished=testReceipts?.deliveries?.facebook_feed?.status==="published";
 const instagramTestPublished=testReceipts?.deliveries?.instagram_feed?.status==="published";
 const bothFeedsPublished=facebookTestPublished&&instagramTestPublished;
 const facebookStoryPublished=testReceipts?.deliveries?.facebook_story?.status==="published";
 const instagramStoryPublished=testReceipts?.deliveries?.instagram_story?.status==="published";
 const bothStoriesPublished=facebookStoryPublished&&instagramStoryPublished;
 const allTestPublished=bothFeedsPublished&&bothStoriesPublished;
 const facebookPostLink=safeSocialUrl(testReceipts?.deliveries?.facebook_feed?.permalink,"facebook.com");
 const instagramPostLink=safeSocialUrl(testReceipts?.deliveries?.instagram_feed?.permalink,"instagram.com");
 const facebookStoryLink=safeSocialUrl(testReceipts?.deliveries?.facebook_story?.permalink,"facebook.com");
 const instagramStoryLink=safeSocialUrl(testReceipts?.deliveries?.instagram_story?.permalink,"instagram.com");
 const hasAccess=authorization.connected&&authorization.scopes.includes("instagram_basic")&&authorization.scopes.includes("instagram_content_publish");
 const facebookScopes=["pages_show_list","pages_read_engagement","pages_manage_posts"] as const;
 const facebookGranted=authorization.connected&&facebookScopes.every(scope=>authorization.scopes.includes(scope));
 const facebookMissing=facebookScopes.filter(scope=>!authorization.scopes.includes(scope));
 const facebookVerified=facebookGranted&&authorization.facebookPageVerified===true;
 const facebookCanPost=facebookVerified&&authorization.facebookCanCreateContent===true;
 const facebookDescription=!facebookGranted?"La página aparece en Meta Business Suite. Faltan los permisos en el token vigente."
  :facebookVerified?facebookCanPost
    ?facebookTestPublished?"Página oficial identificada; TEST-001 Feed ya publicado y confirmado por Meta.":"Página oficial identificada con la API de Meta; dispone de rol para crear contenido. Falta la prueba controlada antes de publicar."
    :"Página oficial identificada mediante la API de Meta; no se han confirmado todavía el rol y token de página necesarios para publicar."
   :authorization.facebookVerificationState==="meta_unavailable"
     ?"No fue posible completar la consulta de páginas con Meta. La autorización anterior se conserva."
     :authorization.facebookVerificationState==="no_page"
      ?"El token tiene los tres permisos, pero Meta no ha devuelto una página que coincida de forma verificable con nuestra fanpage."
      :"Los tres permisos están concedidos. La identificación de la fanpage sigue pendiente de comprobación.";
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
     <p><strong>Permisos de publicación:</strong> {allTestPublished?"Instagram y Facebook: TEST-001 confirmado en ambos feeds y ambas historias.":bothFeedsPublished?"Instagram y Facebook: TEST-001 publicado en ambos feeds; historias en comprobación.":hasAccess?facebookGranted?facebookVerified?"Instagram y Facebook: permisos concedidos y cuentas identificadas; consulta de envío o prueba pendiente.":"Instagram: concedidos; Facebook: tres permisos concedidos, falta verificar la página.":"Instagram: concedidos; Facebook: autorización de permisos pendiente.":"Instagram y Facebook: pendientes de autorización."}</p>
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
     {hasAccess&&<p><strong>Permisos concedidos:</strong> instagram_basic · instagram_content_publish{facebookGranted?" · pages_show_list · pages_read_engagement · pages_manage_posts":""}.</p>}
     {hasAccess&&!facebookGranted&&<p><strong>Permisos de Facebook por incorporar al token:</strong> {facebookMissing.join(" · ")}. Ya se añadieron a la configuración de Meta, pero necesitas renovar el consentimiento para concederlos.</p>}
     {facebookGranted&&<p><strong>Facebook:</strong> {facebookDescription}{facebookVerified&&authorization.facebookPageId&&" Identificador verificado: "+authorization.facebookPageId+"."}</p>}
     {authorization.connected&&authorization.expiresAt&&authorization.expiresAt>0&&<p><strong>Vencimiento registrado:</strong> {new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",dateStyle:"long"}).format(new Date(authorization.expiresAt*1000))}.</p>}
     {confirmed&&<p><strong>Cuenta confirmada:</strong> @{authorization.username}. {facebookCanPost?allTestPublished?"Los cuatro destinos de TEST-001 están publicados y confirmados por Meta. La programación automática requiere una activación y conciliación independientes.":bothFeedsPublished?"Los dos feeds de TEST-001 están publicados y confirmados en Meta. Las historias se comprueban por separado.":"Facebook también está identificado y autorizado para crear contenido. El siguiente paso es comprobar el resultado real de cada canal en el registro privado.":facebookVerified?"La fanpage está identificada; faltan comprobar todas sus capacidades de publicación.":"La identidad y capacidad de la fanpage todavía deben comprobarse."}</p>}
     {authorization.ready&&credentials==="verified"&&(!authorization.connected||expired||(hasAccess&&!facebookGranted))&&<form method="POST" action="/api/meta/connect">
       <button type="submit" className="gold-button">{expired?"Renovar autorización de Meta":hasAccess?"Actualizar permisos de Instagram y Facebook":"Autorizar Instagram con Meta"}</button>
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
      <small>{facebookDescription}</small></div>
     <span className="meta-connect-state"><AlertCircle size={15}/> {facebookStoryPublished&&facebookTestPublished?"Feed e historia de prueba publicados":facebookTestPublished?"Feed de prueba publicado":facebookVerified?facebookCanPost?"Página identificada · prueba pendiente":"Página identificada · rol pendiente":facebookGranted?"Permisos recibidos · página por verificar":"Permisos pendientes"}</span></div>
    <div><Instagram size={24}/><div><strong>Instagram · Perfil oficial</strong>
      <a href="https://www.instagram.com/palabrasquedespiertan/" target="_blank" rel="noopener noreferrer">@{state.instagramAccount} <ExternalLink size={13}/></a>
      <small>{accessDescription}</small></div>
     <span className="meta-connect-state">{confirmed?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>} {instagramStoryPublished&&instagramTestPublished?"Feed e historia de prueba publicados":instagramTestPublished?"Feed de prueba publicado":confirmed?"Identidad verificada":hasAccess?"Autorizada · verificación pendiente":"Sin autorización"}</span></div>
   </div>
  </section>
  {bothFeedsPublished&&<section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
    <p className="kicker">PRUEBA REAL COMPLETADA · META</p>
    <h2>{allTestPublished?"TEST-001: cuatro destinos publicados":"TEST-001 publicado en las dos redes"}</h2>
    <p>Resultado del registro privado del servidor, no de una simulación.</p>
   </div><span className="meta-connect-state"><CheckCircle2 size={15}/> {allTestPublished?"4 de 4 confirmados":"Feeds confirmados"}</span></div>
   <div className="meta-connect-redirect">
    {facebookPostLink&&<p><strong>Facebook:</strong> <a href={facebookPostLink} target="_blank" rel="noopener noreferrer">Ver publicación confirmada <ExternalLink size={13}/></a></p>}
    {instagramPostLink&&<p><strong>Instagram:</strong> <a href={instagramPostLink} target="_blank" rel="noopener noreferrer">Ver publicación confirmada <ExternalLink size={13}/></a></p>}
    <p><strong>Facebook · Historia:</strong> {facebookStoryPublished?"Publicada y confirmada por Meta.":"Pendiente de comprobación."} {facebookStoryPublished&&testReceipts?.deliveries?.facebook_story?.metaPostId&&"ID: "+testReceipts.deliveries.facebook_story.metaPostId} {facebookStoryLink&&<a href={facebookStoryLink} target="_blank" rel="noopener noreferrer">Ver historia <ExternalLink size={13}/></a>}</p>
    <p><strong>Instagram · Historia:</strong> {instagramStoryPublished?"Publicada y confirmada por Meta.":"Pendiente de comprobación."} {instagramStoryPublished&&testReceipts?.deliveries?.instagram_story?.metaPostId&&"ID: "+testReceipts.deliveries.instagram_story.metaPostId} {instagramStoryLink&&<a href={instagramStoryLink} target="_blank" rel="noopener noreferrer">Ver historia <ExternalLink size={13}/></a>}</p>
    <p><strong>Programación automática:</strong> desactivada para prevenir duplicaciones con Meta Business Suite.</p>
    <p><Link href="/publicar?test=1" className="gold-button">{allTestPublished?"Ver los cuatro recibos de TEST-001":"Revisar historias y permisos"}</Link></p>
   </div>
  </section>}
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div><p className="kicker">IMPLEMENTACIÓN SEGURA</p><h2>Etapas de la integración</h2>
    <p>Seguimiento real de avances, sin dar por completado ningún permiso no verificado.</p></div></div>
   <ol className="meta-connect-steps">
    <li><span>01</span><div><strong>Identificar las cuentas oficiales</strong>
     <p>{facebookVerified?"Meta ha identificado la fanpage oficial "+(authorization.facebookPageName||"Palabras que despiertan")+" mediante la API. Instagram también está vinculado al proyecto.":"Meta Business Suite mostró la fanpage y @palabrasquedespiertan dentro del portafolio P Jaider HerTur. Falta comprobar en la API la identidad de la fanpage."}</p>
     <div className="meta-connect-links"><a href="https://business.facebook.com/settings/" target="_blank" rel="noopener noreferrer">Configuración del negocio <ExternalLink size={13}/></a>
      <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">Meta Business Suite <ExternalLink size={13}/></a></div></div>
     <span className="meta-connect-state">{facebookVerified?"Cuentas verificadas":"Cuentas identificadas · fanpage pendiente"}</span></li>
    <li><span>02</span><div><strong>Crear y validar la aplicación oficial Meta</strong>
     <p>Aplicación creada con configuración «PQD Instagram Organico» y sin permisos publicitarios. Las credenciales se comprueban en el servidor.</p>
     <div className="meta-connect-links"><a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">Meta for Developers <ExternalLink size={13}/></a></div></div>
     <span className="meta-connect-state">{credentials==="verified"?"Credenciales verificadas":"Validación pendiente"}</span></li>
    <li><span>03</span><div><strong>Autorizar y verificar Instagram y Facebook</strong>
     <p>{hasAccess?"Consentimiento de Instagram recibido y cifrado. "+(confirmed?"Su identidad ha sido confirmada.":"Falta confirmar su identidad mediante Meta.")+" "+(facebookVerified?facebookTestPublished?"La fanpage oficial está identificada y TEST-001 Feed ya está publicado.":"La fanpage oficial también quedó identificada. Falta la prueba de publicación.":facebookGranted?"Los permisos de Facebook ya fueron concedidos; su identidad está por verificar.":"Facebook todavía no concedió todos sus permisos."):"Pendiente del consentimiento de Instagram y Facebook."}</p></div>
     <span className="meta-connect-state">{allTestPublished?"4 de 4 destinos publicados":bothFeedsPublished?"Ambos feeds publicados · historias por comprobar":confirmed?facebookVerified?"Ambas cuentas identificadas · prueba pendiente":facebookGranted?"Instagram verificada · página pendiente":"Instagram verificada · Facebook pendiente":hasAccess?facebookGranted?"Permisos de ambas redes · cuentas por verificar":"Instagram autorizada · permisos de Facebook pendientes":"Pendiente"}</span></li>
    <li><span>04</span><div><strong>Prueba controlada y calendario</strong>
     <p>{allTestPublished?"TEST-001 publicó los cuatro destinos con identificadores oficiales y bloqueo de duplicados. La siguiente etapa independiente es conciliar la programación ya existente antes de habilitar automatizaciones.":bothFeedsPublished?"Los feeds de TEST-001 están confirmados. Las historias deben verificarse de forma independiente antes de programar contenidos adicionales.":"Antes de habilitar envíos adicionales: verificar ambas identidades y roles, aprobar una prueba de publicación, comprobar su identificador real y evitar duplicaciones con las publicaciones programadas."}</p></div>
     <span className="meta-connect-state">{allTestPublished?"Prueba 4/4 completada · programación pendiente":bothFeedsPublished?"Feeds completados · historias por comprobar":facebookCanPost&&confirmed?"Preparada · aprobación de prueba pendiente":"Pendiente"}</span></li>
   </ol>
  </section>
  <div className="meta-connect-warning"><ShieldCheck size={19}/>
   <p><strong>Regla de seguridad:</strong> este panel no modifica los calendarios existentes, no crea publicaciones en redes y no presume que una fecha editorial equivale a una publicación confirmada en Meta. Facebook e Instagram continuarán gestionándose como hasta ahora hasta finalizar la conexión.</p></div>
  {confirmed&&facebookCanPost&&<section className="section-card meta-connect-section"><div className="section-card-header"><div><p className="kicker">SIGUIENTE ETAPA · SIN ENVÍO REAL</p><h2>Simulación técnica de publicación</h2><p>Comprueba permisos, identidades, roles y vigencia de ambos canales. No publica contenido ni modifica la agenda.</p></div></div><div className="meta-connect-redirect"><p><Link href="/integraciones/simulacion" className="gold-button">Ejecutar simulación segura</Link></p></div></section>}
  <p className="meta-connect-links"><Link href="/calendario"><CalendarClock size={15}/> Ver el calendario actual</Link>
   <Link href="/enlaces"><Cable size={15}/> Consultar enlaces para redes</Link></p>
 </Shell>;
}
