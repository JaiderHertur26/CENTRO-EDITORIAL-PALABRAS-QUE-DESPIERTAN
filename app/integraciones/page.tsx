import Link from "next/link";
import {Cable,ShieldCheck,Instagram,Facebook,ExternalLink,LockKeyhole,CalendarClock,AlertCircle} from "lucide-react";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {metaIntegrationStatus} from "@/lib/meta-connection";

export const dynamic="force-dynamic";

export default async function Integraciones(){
 const user=await requireEditor();
 const state=metaIntegrationStatus();
 return <Shell email={user.email||"Dirección"} section="Integraciones">
  <div className="page-heading">
   <p className="kicker">CONECTORES OFICIALES · META GRAPH API</p>
   <h1>Una revista. <em>Dos redes sociales.</em></h1>
   <p>Panel de preparación y seguridad para publicar desde el Centro Editorial en Facebook e Instagram. Ninguna publicación se enviará hasta autorizar las cuentas y superar una prueba de conexión.</p>
  </div>
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
