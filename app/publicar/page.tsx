import "./publicar.css";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {MetaComposer} from "@/components/MetaComposer";
import {metaVaultStatus} from "@/lib/meta-oauth";
export const dynamic="force-dynamic";
export default async function Publicar({searchParams}:{searchParams:Promise<{test?:string}>}){
 const user=await requireEditor();
 const access=await metaVaultStatus();
 const autoOpenTest=(await searchParams).test==="1";
 return <Shell section="Publicar en redes" email={user.email||"Dirección"}>
  <div className="page-heading">
   <p className="kicker">CENTRO DE PUBLICACIÓN · FACEBOOK E INSTAGRAM</p>
   <h1>Una idea. <em>Cuatro destinos.</em></h1>
   <p>Prepara el feed y las historias de cada red por separado: texto, imagen, revisión y fecha objetivo. Los borradores se almacenan de manera privada. El envío real de TEST-001 está disponible únicamente con aprobación registrada y doble confirmación por red. Las historias solo admiten pruebas manuales cuando su imagen y autorización estén verificadas. La programación automática continúa desactivada.</p>
  </div>
  <MetaComposer instagramAccountType={access.instagramAccountType||null} autoOpenTest={autoOpenTest}/>
 </Shell>;
}
