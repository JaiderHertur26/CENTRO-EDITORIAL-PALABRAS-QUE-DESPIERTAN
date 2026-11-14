import Link from "next/link";
import {Cable,ShieldCheck,Instagram,Facebook,ExternalLink,LockKeyhole,CalendarClock,AlertCircle} from "lucide-react";
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
 return <Shell email={user.email||"Dirección"} section="Integraciones">
  <div className="page-heading">
   <p className="kicker">CONECTORES OFICIALES · META GRAPH API</p>
   <h1>Una revista. <em>Dos redes sociales.</em></h1>
   <p>Panel de preparación y seguridad para publicar desde el Centro Editorial en Facebook e Instagram. Ninguna publicación se enviará hasta autorizar las cuentas y superar una prueba de conexión.</p>
  </div>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
     <p className="kicker">COMPROBACIÓN EN SERVIDOR · PRODUCCIÓN</p>
     <h2>Credenciales oficiales</h2>
     <p>Las claves se verifican sin mostrarlas ni enviarlas al navegador. Esta revisión no autoriza cuentas y no publica contenido.</p>
   </div></div>
   <div className="meta-connect-redirect">
     <p><strong>Variables de Meta:</strong> {state.configuredCount} de 3 registradas en este despliegue.</p>
     <p><strong>Identificadores oficiales:</strong> {state.idsMatch?"Coinciden con la aplicación y la configuración de Instagram":"Pendientes de corrección"}.</p>
     <p><strong>Credenciales de aplicación:</strong> {credentials==="verified"?"Validadas por Meta":credentials==="unavailable"?"No fue posible contactar Meta; se podrá reintentar":credentials==="missing"?"Faltan variables":"No se pudieron validar; revisar valores en Vercel"}.</p>
     <p><strong>Permisos de publicación:</strong> pendientes de autorización en Facebook e Instagram.</p>
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div>
     <p className="kicker">META · INICIO DE SESIÓN UNIFICADO</p>
     <h2>URL de redireccionamiento</h2>
     <p>Ruta estable reservada para registrar en Meta for Developers. La autorización de cuentas y el intercambio seguro de tokens aún no están habilitados.</p>
   </div><span className="meta-connect-pending"><LockKeyhole size={15}/> Autorización pendiente</span></div>
   <div className="meta-connect-redirect">
     <code>https://c-edi-palabras-que-despiertan.vercel.app/api/meta/callback</code>
     <p>La dirección de retorno ya está registrada en Meta. El botón siguiente abrirá el inicio de sesión oficial y permitirá seleccionar la cuenta de Instagram autorizada.</p>
     {result==="autorizacion-recibida"&&<p><strong>Autorización recibida y guardada cifrada.</strong> Falta validar que la cuenta autorizada sea @palabrasquedespiertan; todavía no se pueden publicar contenidos.</p>}
     {result==="cancelado"&&<p><strong>Autorización cancelada.</strong> No hemos modificado las publicaciones ni los calendarios.</p>}
     {result==="error"&&<p><strong>No se completó la autorización.</strong> Revisa la cuenta seleccionada en Meta y los permisos. No se guardó una conexión incompleta.</p>}
     <p><strong>Estado de acceso:</strong> {authorization.connected
      ?authorization.verifiedAccount?"Instagram autorizado y verificado":"Token protegido recibido; verificación de la cuenta aún pendiente"
      :authorization.unavailable?"No se pudo consultar el almacén privado":"Instagram todavía sin autorizar"}.</p>
     {authorization.ready&&credentials==="verified"&&!authorization.connected&&<form method="POST" action="/api/meta/connect">
       <button type="submit" className="gold-button">Autorizar Instagram con Meta</button>
     </form>}
     {authorization.connected&&<p>Permisos concedidos: {authorization.scopes.includes("instagram_content_publish")?"Publicación de contenido · ":""}{authorization.scopes.includes("instagram_basic")?"Acceso básico":""}.</p>}
     <p>No selecciones cuentas publicitarias si Meta permite omitirlas. Este procedimiento no publica ningún mensaje, artículo ni historia.</p>
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header">
    <div><p className="kicker">ESTADO DE CONEXIÓN</p><h2>Facebook e Instagram</h2>
     <p>{state.reason}</p></div>
    <span className="meta-connect-pending"><LockKeyhole size={15}/> Publicación automática inactiva</span>
   </div>
   <div className="meta-connect-accounts">
    <div><Facebook size={24}/><div><strong>Facebook · Fanpage</strong>
      <a href="https://www.facebook.com/PalabrasQueDespiertan01" target="_blank" rel="noopener noreferrer">@{state.facebookPage} <ExternalLink size={13}/></a>
      <small>Referencia registrada en la revista; propiedad y permisos aún por verificar con Meta.</small></div>
     <span className="meta-connect-state"><AlertCircle size={15}/> Sin autorización</span></div>
    <div><Instagram size={24}/><div><strong>Instagram · Perfil oficial</strong>
      <a href="https://www.instagram.com/palabrasquedespiertan/" target="_blank" rel="noopener noreferrer">@{state.instagramAccount} <ExternalLink size={13}/></a>
      <small>Debe ser una cuenta profesional vinculada a la página de Facebook.</small></div>
     <span className="meta-connect-state"><AlertCircle size={15}/> Sin autorización</span></div>
   </div>
  </section>
  <section className="section-card meta-connect-section">
   <div className="section-card-header"><div><p className="kicker">IMPLEMENTACIÓN SEGURA</p><h2>Etapas de la integración</h2>
    <p>Se realizarán en este orden, comprobando cada etapa antes de continuar.</p></div></div>
   <ol className="meta-connect-steps">
    <li><span>01</span><div><strong>Verificar las cuentas oficiales y sus permisos</strong>
     <p>Comprobar en Meta Business Suite que administras la fanpage con permiso para crear contenido y que Instagram está en modo profesional y enlazado a esa página.</p>
     <div className="meta-connect-links"><a href="https://business.facebook.com/settings/" target="_blank" rel="noopener noreferrer">Configuración del negocio <ExternalLink size={13}/></a>
      <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">Meta Business Suite <ExternalLink size={13}/></a></div></div>
     <span className="meta-connect-state">Por verificar</span></li>
    <li><span>02</span><div><strong>Crear una aplicación oficial Meta</strong>
     <p>Elegir la integración compatible con Facebook Pages e Instagram API with Facebook Login. Configurar correctamente la URL de autorización y los permisos; las credenciales privadas se guardarán solo en el servidor.</p>
     <div className="meta-connect-links"><a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">Meta for Developers <ExternalLink size={13}/></a></div></div>
     <span className="meta-connect-state">{state.developerConfigured?"Credenciales presentes; sin validar":"Por configurar"}</span></li>
    <li><span>03</span><div><strong>Autorizar Facebook e Instagram</strong>
     <p>Conectar mediante el inicio de sesión oficial de Meta y verificar los identificadores de página, cuenta profesional y permisos efectivos. No compartir contraseñas ni pegar tokens en el chat.</p></div>
     <span className="meta-connect-state">Bloqueado</span></li>
    <li><span>04</span><div><strong>Prueba controlada y calendario</strong>
     <p>Preparar una publicación de prueba expresamente autorizada, comprobar su identificador real en Meta y el registro del resultado. Después habilitaremos la programación futura, sin duplicar publicaciones existentes.</p></div>
     <span className="meta-connect-state">Bloqueado</span></li>
   </ol>
  </section>
  <div className="meta-connect-warning"><ShieldCheck size={19}/>
   <p><strong>Regla de seguridad:</strong> este panel no modifica los calendarios existentes, no crea publicaciones en redes y no presume que una fecha editorial equivale a una publicación confirmada en Meta. Facebook e Instagram continuarán gestionándose como hasta ahora hasta finalizar la conexión.</p></div>
  <p className="meta-connect-links"><Link href="/calendario"><CalendarClock size={15}/> Ver el calendario actual</Link>
   <Link href="/enlaces"><Cable size={15}/> Consultar enlaces para redes</Link></p>
 </Shell>;
}
