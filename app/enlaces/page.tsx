import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
import {metaPublications} from "@/lib/meta";
import {MetaPack} from "@/components/MetaPack";
export const dynamic="force-dynamic";
export default async function Enlaces(){
 const user=await requireEditor();
 const items=await metaPublications();
 return <Shell section="Enlaces para redes" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">FACEBOOK · INSTAGRAM · REVISTA</p>
   <h1>Una publicación. <em>Un enlace original.</em></h1>
   <p>Cada mensaje tiene su dirección permanente. Puedes copiar el enlace o el texto completo para actualizar la publicación programada en Meta Business Suite. La revista activará el enlace cinco minutos antes de las 19:00.</p>
  </div>
  <MetaPack items={items}/>
 </Shell>;
}
