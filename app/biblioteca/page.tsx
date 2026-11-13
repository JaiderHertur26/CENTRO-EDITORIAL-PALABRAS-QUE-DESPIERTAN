import Image from "next/image";
import {Shell} from "@/components/Shell";
import {requireEditor} from "@/lib/access";
export const dynamic="force-dynamic";
const assets=[
 {name:"Fondo oficial — Cruz dorada",file:"/cruz-fondo.png",hash:"3ceb3342f306e0872cca6cb0edcffe661f498f35d5f10da0e296748bf6b2029b",detail:"Original 1 / Identidad institucional"},
 {name:"Portada oficial — Brote iluminado",file:"/portada-oficial.png",hash:"259001b1803576f4c4cf7b7b5a0aa7a05c192b1a782468fe78501062f6d646d8",detail:"Original 2 / Identidad institucional"}
];
export default async function Biblioteca(){
 const user=await requireEditor();
 return <Shell section="Biblioteca gráfica" email={user.email||"Dirección"}>
  <div className="page-heading"><p className="kicker">IDENTIDAD Y MEMORIA VISUAL</p><h1>Las imágenes que <em>nos identifican.</em></h1><p>Protegemos los dos originales de la marca. Las tarjetas de cada pensamiento son publicaciones, no identidades nuevas.</p></div>
  <div className="asset-grid">{assets.map(a=><article className="asset-card" key={a.file}>
   <div className="asset-visual"><Image src={a.file} alt={a.name} width={1024} height={1536}/></div>
   <div className="asset-description"><p className="kicker">{a.detail}</p><h2>{a.name}</h2><p>Integridad SHA256 verificada. Uso editorial aprobado; no sustituir ni regenerar el original.</p><code>{a.hash}</code></div>
  </article>)}</div>
  <div className="notice-card" style={{marginTop:23}}><span className="notice-icon">✝</span><div><h3>La tarjeta PD-001 tiene una función distinta</h3><p>Es una publicación del autor, no un tercer original de identidad. Su integridad se conserva en la revista.</p></div></div>
 </Shell>;
}
