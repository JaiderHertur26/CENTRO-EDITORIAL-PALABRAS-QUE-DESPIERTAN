import "./publicar.css";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {MetaComposer} from "@/components/MetaComposer";
import {metaVaultStatus} from "@/lib/meta-oauth";
export const dynamic="force-dynamic";
export default async function Publicar(){
 const user=await requireEditor();
 const access=await metaVaultStatus();
 return <Shell section="Publicar en redes" email={user.email||"Dirección"}>
  <div className="page-heading">
   <p className="kicker">CENTRO DE PUBLICACIÓN · FACEBOOK E INSTAGRAM</p>
   <h1>Una idea. <em>Cuatro destinos.</em></h1>
   <p>Prepara el feed y las historias de cada red por separado: texto, imagen, revisión y fecha objetivo. Los borradores se almacenan de manera privada. Los envíos reales permanecen desactivados hasta las pruebas y autorizaciones finales.</p>
  </div>
  <MetaComposer instagramAccountType={access.instagramAccountType||null}/>
 </Shell>;
}
