"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {AlertTriangle,CheckCircle2,Clock3,RefreshCcw,ShieldCheck,ExternalLink} from "lucide-react";
type Planned={code:string;title:string;socialAt:string;socialState:string};
type Scheduled={id:string;code:string|null;scheduledAt:string|null;excerpt:string};
type Snapshot={status:"ok"|"unavailable";checkedAt:string;truncated:boolean;reason:string|null;posts:Scheduled[]};
const timeCO=(v:string|null)=>v?new Date(v).toLocaleString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium",timeStyle:"short"}):"Sin hora verificable";
const diff=(a:string,b:string|null)=>b?Math.abs(Date.parse(a)-Date.parse(b)):Infinity;
const testId="8077d038-98eb-4729-abe5-425a26267460";
function classify(item:Planned,rows:Scheduled[]){
 const byCode=rows.filter(x=>x.code===item.code);
 if(byCode.length===1)return diff(item.socialAt,byCode[0].scheduledAt)<=90000
  ?{label:"Código y hora coinciden",kind:"match",post:byCode[0]}
  :{label:"CONFLICTO: mismo código, horario diferente",kind:"conflict",post:byCode[0]};
 if(byCode.length>1)return {label:"CONFLICTO: código repetido en Meta",kind:"conflict",post:byCode[0]};
 const byTime=rows.filter(x=>diff(item.socialAt,x.scheduledAt)<=60000);
 if(byTime.length===1)return {label:"Hora coincide; contenido por verificar",kind:"partial",post:byTime[0]};
 return {label:"No localizado en esta consulta de Meta",kind:"unknown",post:null};
}
export function MetaReconciliation({planned}:{planned:Planned[]}){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const [working,setWorking]=useState(false);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  setWorking(true);setError("");
  try{
   const response=await fetch("/api/meta/publicar?id="+testId+"&scheduled=1",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok||!data.schedule)throw Error("No se pudo leer el calendario externo desde Meta");
   setSnapshot(data.schedule as Snapshot);
  }catch(e){setSnapshot(null);setError(e instanceof Error?e.message:"Consulta no disponible")}
  finally{setWorking(false)}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const compared=useMemo(()=>planned.map(x=>({item:x,status:snapshot?.status==="ok"?classify(x,snapshot.posts):null})),[planned,snapshot]);
 const confirmed=compared.filter(x=>x.status?.kind==="match").length;
 const conflicts=compared.filter(x=>x.status?.kind==="conflict").length;
 return <section className="section-card">
  <div className="section-card-header"><div>
   <p className="kicker">AUDITORÍA EXTERNA · SOLO LECTURA</p>
   <h2>Conciliación con Meta Business Suite</h2>
   <p>Se consultan las publicaciones futuras de la página de Facebook. No crea, modifica ni cancela envíos.</p>
  </div></div>
  <div style={{padding:"18px 24px"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
    <p><ShieldCheck size={16} style={{verticalAlign:"middle",marginRight:6}}/> {snapshot?.status==="ok"
     ?"Facebook Graph: "+snapshot.posts.length+" publicaciones programadas encontradas"
     :working?"Consultando Meta…":"Consulta de Facebook no confirmada"}</p>
    <button className="muted-button" onClick={()=>void refresh()} disabled={working}>
     <RefreshCcw size={16}/>{working?"Consultando…":"Actualizar consulta"}
    </button>
   </div>
   {snapshot?.status==="ok"&&<p style={{fontSize:14}}>
    <CheckCircle2 size={15} style={{verticalAlign:"middle",marginRight:6}}/>{confirmed} coincidencias exactas
    {conflicts>0&&<> · <AlertTriangle size={15} style={{verticalAlign:"middle",marginRight:5}}/>{conflicts} conflicto(s) de horario o código</>}
    {" · "}Actualizado: {timeCO(snapshot.checkedAt)}
   </p>}
   {snapshot?.truncated&&<p className="source-note">Meta devolvió más páginas de resultados. Esta consulta es parcial: no autoriza asumir que faltan publicaciones.</p>}
   {(error||snapshot?.status==="unavailable")&&<p className="source-note">No se pudo verificar la programación en Facebook: {error||snapshot?.reason||"permisos o lectura de Meta no disponibles"}. Las fechas del Centro siguen siendo registros editoriales, no comprobantes externos.</p>}
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",textAlign:"left",fontSize:14}}>
     <thead><tr><th style={{padding:"10px 8px"}}>Mensaje</th><th style={{padding:"10px 8px"}}>Hora Meta declarada</th><th style={{padding:"10px 8px"}}>Comprobación de Facebook</th></tr></thead>
     <tbody>{compared.map(({item,status})=><tr key={item.code} style={{borderTop:"1px solid rgba(177,145,94,.25)"}}>
      <td style={{padding:"10px 8px"}}><strong>{item.code}</strong><div>{item.title}</div></td>
      <td style={{padding:"10px 8px"}}>{timeCO(item.socialAt)}</td>
      <td style={{padding:"10px 8px"}}>{status?<><strong>{status.label}</strong>
       {status.post?.scheduledAt&&<div>Meta: {timeCO(status.post.scheduledAt)}</div>}
       {status.post?.excerpt&&<small>{status.post.excerpt}</small>}
      </>:<span>Sin verificación externa</span>}</td>
     </tr>)}</tbody>
    </table>
   </div>
   {planned.length===0&&<p>No hay mensajes futuros con fecha social registrada.</p>}
   <p className="source-note"><Clock3 size={15} style={{verticalAlign:"middle",marginRight:5}}/>
    Instagram: Meta Graph no ofrece en esta conexión una lista equivalente de las publicaciones programadas en Business Suite.
    La programación de Instagram y las historias debe conciliarse manualmente antes de activar envíos automáticos.
    Una coincidencia por hora no equivale a identidad verificada.</p>
   <p><a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">
    Abrir Meta Business Suite <ExternalLink size={14} style={{verticalAlign:"middle"}}/></a></p>
  </div>
 </section>;
}
