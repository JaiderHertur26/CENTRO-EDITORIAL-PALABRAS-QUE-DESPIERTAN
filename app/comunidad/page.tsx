import {Shell} from "@/components/Shell";
import {CommunityPanel} from "@/components/CommunityPanel";
import {requireEditor} from "@/lib/access";
import {communityData} from "@/lib/data";
export const dynamic="force-dynamic";
export default async function Comunidad(){
 const user=await requireEditor();
 const data=await communityData();
 return <Shell section="Comunidad" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">COMUNIDAD DE LECTORES</p><h1>Escuchar, acompañar, <em>cuidar.</em></h1><p>Comentarios, respuestas, testimonios y reportes, reunidos en un mismo espacio. Los datos personales solo son visibles para la dirección autorizada.</p></div>
  <CommunityPanel initial={data}/>
 </Shell>;
}
