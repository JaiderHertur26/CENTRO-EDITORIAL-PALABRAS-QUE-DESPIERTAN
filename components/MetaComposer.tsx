"use client";
import {useEffect,useRef,useState} from "react";
import {Facebook,Instagram,Image as ImageIcon,CalendarDays,Save,Plus,ShieldCheck,LockKeyhole,CheckCircle2,AlertCircle,FileImage,Clock3} from "lucide-react";

type ChannelName="facebook_feed"|"instagram_feed"|"facebook_story"|"instagram_story";
type Slot="feed"|"story";
type Channel={enabled:boolean;copy:string;mode:"manual"|"target";scheduledAt:string|null};
type MediaInfo={slot:Slot;mime:string;width:number;height:number;size:number;sha256:string;uploadedAt:string};
type Draft={
 version:1;id:string;title:string;reference:string;createdAt:string;updatedAt:string;
 contentApproved:boolean;approvalAt:string|null;
 storyApproved?:boolean;storyApprovalAt?:string|null;
 channels:Record<ChannelName,Channel>;
 media:{feed:MediaInfo|null;story:MediaInfo|null};
};
type ResponseDraft={draft?:Draft;drafts?:Draft[];error?:string;ok?:boolean;limited?:boolean};
type DeliveryRecord={status:"reserved"|"media_prepared"|"publishing"|"published"|"rejected"|"needs_review";
 channel:ChannelName;updatedAt:string;metaPostId:string|null;permalink:string|null;reason:string|null;};
type Deliveries=Partial<Record<ChannelName,DeliveryRecord|null>>;
type ReadinessResult={ready:boolean;reason:string;instagramAccountType?:string|null};
type PublishReadiness={revision:string;channels:Partial<Record<ChannelName,ReadinessResult>>;
 storyAccounts?:{instagram:{type:string|null;status:string;canPublishStories:boolean};
 facebook:{pageReady:boolean;hasBusinessManagementScope:boolean;canAttemptStories:boolean}}}|null;
const readableReason=(code:string)=>{
 const names:Record<string,string>={
  READY:"La conexión permite intentar una publicación real.",
  CONTENT_NOT_APPROVED:"Falta aprobar y guardar esta pieza.",
  STORY_NOT_APPROVED:"La imagen vertical está preparada; falta aprobar expresamente las historias.",
  CHANNEL_NOT_SELECTED:"Activa y guarda primero este destino de publicación.",
  INSTAGRAM_NOT_VERIFIED:"La cuenta de Instagram no ha superado la verificación.",
  INSTAGRAM_SCOPES_MISSING:"Faltan permisos de Instagram.",
  FACEBOOK_SCOPES_MISSING:"Faltan permisos de publicación en Facebook.",
  FACEBOOK_PAGE_TOKEN_NOT_FOUND:"Meta no entrega el token operativo de la página.",
  FACEBOOK_PAGE_NOT_VERIFIED:"La página de Facebook aún no está verificada.",
  FACEBOOK_PUBLISH_PERMISSION_MISSING:"Meta no reconoce el rol para publicar en Facebook.",
  DELIVERY_ALREADY_RESERVED:"Ya existe un intento registrado; se bloquea para evitar duplicados.",
  META_PREFLIGHT_UNAVAILABLE:"No se pudo comprobar ahora la conexión con Meta.",
  APPROVED_JPEG_REQUIRED:"La imagen debe estar guardada en formato JPG.",
  IMAGE_MISSING:"No está disponible la imagen aprobada.",
  IMAGE_NOT_REACHABLE:"Meta no puede recuperar la imagen temporal.",
  META_AUTHORIZATION_INVALID:"El token de Meta ha vencido o no es válido.",
  META_AUTHORIZATION_MISSING:"No hay autorización guardada.",
  NOT_APPROVED_TEST:"Solo puede enviarse el borrador oficial TEST-001 aprobado.",
  FACEBOOK_STORY_BUSINESS_PERMISSION_REQUIRED:"Meta exige autorización de negocio para historias de Facebook con token de usuario del sistema.",
  INSTAGRAM_STORIES_BUSINESS_REQUIRED:"Meta no ha confirmado que Instagram sea una cuenta Business; las historias no pueden enviarse.",
  SCHEDULED_ITEM_NOT_ELIGIBLE:"Esta prueba no permite programaciones; utiliza el modo manual."
 };
 return names[code]||"Comprobación no completada ("+code+").";
};
const channels:{key:ChannelName;label:string;platform:"fb"|"ig";slot:Slot;hint:string}[]=[
 {key:"facebook_feed",label:"Publicación de Facebook",platform:"fb",slot:"feed",hint:"Texto y fotografía en la fanpage"},
 {key:"instagram_feed",label:"Publicación de Instagram",platform:"ig",slot:"feed",hint:"Fotografía y leyenda del perfil"},
 {key:"facebook_story",label:"Historia de Facebook",platform:"fb",slot:"story",hint:"Imagen vertical 9:16; enlaces interactivos no asegurados por API"},
 {key:"instagram_story",label:"Historia de Instagram",platform:"ig",slot:"story",hint:"Solo cuentas Business; texto sobrepuesto debe formar parte de la imagen"}
];
const fbApproved=`Palabras que despiertan es un espacio para mirar la vida a la luz de la fe.

Aquí la Sagrada Escritura dialoga con nuestras preguntas, experiencias y esperanzas. Compartimos reflexiones y artículos que invitan a detenernos, pensar y vivir con mayor profundidad.

Conoce la revista y sus publicaciones:
https://www.palabrasquedespiertan.online

P. Jaider Herrera Turizo

#PalabrasQueDespiertan #FeYVida #ReflexiónCatólica`;
const igApproved=`Palabras que despiertan. ✨

Un espacio para mirar la vida a la luz de la fe.

La Sagrada Escritura, las preguntas de cada día y la esperanza se encuentran en reflexiones y artículos que invitan a detenernos y volver a lo esencial.

Encuentra la revista en el enlace de nuestro perfil:
www.palabrasquedespiertan.online

P. Jaider Herrera Turizo

#PalabrasQueDespiertan #FeYVida #ReflexiónCatólica #Esperanza`;

function fresh():Draft{
 const date=new Date().toISOString();
 const make=(enabled:boolean,copy=""):Channel=>({enabled,copy,mode:"manual",scheduledAt:null});
 return {id:crypto.randomUUID(),version:1,title:"",reference:"",
  createdAt:date,updatedAt:"",contentApproved:false,approvalAt:null,storyApproved:false,storyApprovalAt:null,
  channels:{
   facebook_feed:make(true),instagram_feed:make(true),
   facebook_story:make(false),instagram_story:make(false)
  },media:{feed:null,story:null}};
}
const toCO=(iso:string|null)=>{
 if(!iso)return "";
 const formatter=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
 return formatter.format(new Date(iso)).replace(" ","T");
};
const fromCO=(input:string)=>input?new Date(input+":00-05:00").toISOString():null;
const dateCO=(iso:string|null)=>iso?new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",dateStyle:"medium",timeStyle:"short"}).format(new Date(iso)):"Sin fecha objetivo";
const imgUrl=(d:Draft,slot:Slot)=>d.media[slot]?"/api/meta/borradores/media?id="+encodeURIComponent(d.id)+"&slot="+slot+"&v="+encodeURIComponent(d.media[slot]!.sha256.slice(0,12)):"";
const activeSlots=(d:Draft)=>new Set(channels.filter(c=>d.channels[c.key].enabled).map(c=>c.slot));

export function MetaComposer({instagramAccountType,autoOpenTest=false}:{instagramAccountType:string|null;autoOpenTest?:boolean}){
 const didOpenLinkedTest=useRef(false);
 const [draft,setDraft]=useState<Draft|null>(null);
 const [revision,setRevision]=useState<string|null>(null);
 const [savedBaseline,setSavedBaseline]=useState<Draft|null>(null);
 const [drafts,setDrafts]=useState<Draft[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [publishing,setPublishing]=useState<ChannelName|null>(null);
 const [liveConsent,setLiveConsent]=useState(false);
 const [deliveries,setDeliveries]=useState<Deliveries>({});
 const [readiness,setReadiness]=useState<PublishReadiness>(null);
 const [checking,setChecking]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [files,setFiles]=useState<{feed:File|null;story:File|null}>({feed:null,story:null});
 const [preview,setPreview]=useState<{feed:string;story:string}>({feed:"",story:""});
 useEffect(()=>{setDraft(fresh());void reload();},[]);
 useEffect(()=>{
  if(!draft?.id||!revision){setDeliveries({});setReadiness(null);return}
  let cancelled=false;
  const test=draft.id==="8077d038-98eb-4729-abe5-425a26267460";
  if(test)setChecking(true);
  setReadiness(null);
  fetch("/api/meta/publicar?id="+encodeURIComponent(draft.id)+(test?"&preflight=1":""),{cache:"no-store"})
   .then(async r=>r.ok?await r.json():null)
   .then(data=>{if(!cancelled){
    setDeliveries(data?.deliveries||{});
    setReadiness(data?.readiness?.revision===revision?data.readiness:null);
   }})
   .catch(()=>{if(!cancelled){setDeliveries({});setReadiness(null)}})
   .finally(()=>{if(!cancelled)setChecking(false)});
  return ()=>{cancelled=true};
 },[draft?.id,revision]);
 useEffect(()=>{
  const feed=files.feed?URL.createObjectURL(files.feed):"";
  const story=files.story?URL.createObjectURL(files.story):"";
  setPreview({feed,story});
  return ()=>{if(feed)URL.revokeObjectURL(feed);if(story)URL.revokeObjectURL(story)};
 },[files]);
 async function reload(){
  try{
   const res=await fetch("/api/meta/borradores",{cache:"no-store"});
   const body=await res.json() as ResponseDraft;
   if(!res.ok)throw Error(body.error||"Error al consultar");
   setDrafts(body.drafts||[]);
   if(autoOpenTest&&!didOpenLinkedTest.current){
    const test=(body.drafts||[]).find(x=>x.id==="8077d038-98eb-4729-abe5-425a26267460"&&x.reference==="TEST-001");
    if(test){didOpenLinkedTest.current=true;openExisting(test);}
   }
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron cargar borradores privados")}
  finally{setLoading(false)}
 }
 function openExisting(x:Draft){
  setDraft(x);setRevision(x.updatedAt);setSavedBaseline(x);setFiles({feed:null,story:null});setMessage("");setError("");setLiveConsent(false);
 }
 function newOne(){
  setDraft(fresh());setRevision(null);setSavedBaseline(null);setFiles({feed:null,story:null});setMessage("");setError("");setLiveConsent(false);
 }
 function loadTest(){
  const exists=drafts.find(x=>x.reference==="TEST-001");
  if(exists){openExisting(exists);return}
  const d=fresh();
  d.title="Presentación institucional — TEST-001";
  d.reference="TEST-001";
  d.channels.facebook_feed.copy=fbApproved;
  d.channels.instagram_feed.copy=igApproved;
  setDraft(d);setRevision(null);setSavedBaseline(null);setFiles({feed:null,story:null});setMessage("Se cargaron los dos textos aprobados. Adjunta la imagen TEST-001 desde el paquete entregado y revisa la pieza antes de aprobarla.");setError("");
 }
 function change(update:(d:Draft)=>Draft,invalidatesApproval=false){
  setDraft(old=>{
   if(!old)return old;
   const next=update(old);
   return invalidatesApproval?{...next,contentApproved:false,approvalAt:null,storyApproved:false,storyApprovalAt:null}:next;
  });
  setMessage("");setLiveConsent(false);
 }
 function changeChannel(key:ChannelName,patch:Partial<Channel>,invalidate=false){
  change(d=>({
   ...d,channels:{...d.channels,[key]:{...d.channels[key],...patch}},
   ...(invalidate&&key.endsWith("_story")
     ?{storyApproved:false,storyApprovalAt:null}
     :invalidate?{contentApproved:false,approvalAt:null}:{})
  }));
 }
 async function chooseFile(slot:Slot,file:File|null){
  setError("");setMessage("");
  if(!file){setFiles(old=>({...old,[slot]:null}));return}
  if(!["image/jpeg","image/png"].includes(file.type)){setError("Selecciona una imagen JPG o PNG");return}
  if(file.size>3_500_000){setError("La imagen no puede superar 3,5 MB");return}
  try{
   const bitmap=await createImageBitmap(file);
   const w=bitmap.width,h=bitmap.height;bitmap.close();
   if(w<320||h<320||w>4096||h>4096||w*h>16_000_000)throw Error("Dimensiones no admitidas");
   if(slot==="story"&&(w<720||h<1280||Math.abs(w/h-9/16)>0.025))throw Error("Las historias requieren imagen vertical 9:16 (ideal 1080 × 1920). No se recortará la imagen original.");
   if(slot==="feed"&&(w/h<0.8||w/h>1.91))throw Error("El feed requiere una relación de imagen entre 4:5 y 1,91:1");
   setFiles(old=>({...old,[slot]:file}));
   change(d=>slot==="story"
    ?{...d,storyApproved:false,storyApprovalAt:null}
    :{...d,contentApproved:false,approvalAt:null});
  }catch(e){setError(e instanceof Error?e.message:"No se pudo leer la imagen")}
 }
 async function save(){
  if(!draft||busy)return;
  setError("");setMessage("");
  if(draft.title.trim().length<3){setError("Escribe un título descriptivo");return}
  if(!channels.some(c=>draft.channels[c.key].enabled)){setError("Selecciona al menos un destino");return}
  for(const c of channels){
   const item=draft.channels[c.key];
   if(item.enabled&&c.slot==="feed"&&!item.copy.trim()){setError("Falta texto para "+c.label);return}
   if(item.mode==="target"&&!item.scheduledAt){setError("Falta la fecha objetivo de "+c.label);return}
  }
  setBusy(true);
  try{
   const response=await fetch("/api/meta/borradores",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({draft,expectedUpdatedAt:revision})
   });
   const body=await response.json() as ResponseDraft;
   if(!response.ok||!body.draft)throw Error(body.error||"Error al guardar");
   let current=body.draft;
   setDraft(current);setRevision(current.updatedAt);
   for(const slot of ["feed","story"] as const){
    const file=files[slot];
    if(!file)continue;
    const url="/api/meta/borradores/media?id="+encodeURIComponent(current.id)+"&slot="+slot;
    const res=await fetch(url,{method:"PUT",headers:{"Content-Type":file.type,"X-PQD-Expected-Revision":current.updatedAt},body:file});
    const result=await res.json() as ResponseDraft;
    if(!res.ok||!result.draft)throw Error((result.error||"No se guardó la imagen")+" ("+slot+"). Los demás cambios sí se guardaron.");
    current=result.draft;setDraft(current);setRevision(current.updatedAt);
    setFiles(old=>({...old,[slot]:null}));
   }
   setSavedBaseline(current);
   setMessage("Borrador guardado de forma privada. No se ha publicado ni programado en Meta.");
   await reload();
  }catch(e){setError(e instanceof Error?e.message:"Error al guardar el borrador")}
  finally{setBusy(false)}
 }
 async function publishTest(channel:ChannelName){
  if(!draft||!revision||!liveConsent||publishing||busy)return;
  if(draft.reference!=="TEST-001"||!(channel.endsWith("_story")?draft.storyApproved:draft.contentApproved)||draft.channels[channel].mode!=="manual")return;
  const target=(channel.startsWith("facebook_")?"Facebook":"Instagram")+(channel.endsWith("_story")?" (historia)":" (feed)");
  if(!window.confirm("ESTO PUBLICARÁ REALMENTE TEST-001 en "+target+". Se registrará un envío irreversible y no se podrá repetir. ¿Confirmas el envío?"))return;
  setPublishing(channel);setError("");setMessage("");
  try{
   const response=await fetch("/api/meta/publicar",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:draft.id,channel,revision,confirm:"PUBLICAR_TEST001_UNA_VEZ"})
   });
   const data=await response.json() as {receipt?:DeliveryRecord;error?:string;duplicatePrevented?:boolean};
   if(data.receipt){
    setDeliveries(old=>({...old,[channel]:data.receipt}));
    if(data.receipt.status==="published"){
     setMessage("Publicación confirmada por Meta en "+(channel.startsWith("facebook_")?"Facebook":"Instagram")+(channel.endsWith("_story")?" (historia)":" (feed)")+". Identificador registrado.");
    }else{
     setError("El intento quedó registrado como "+data.receipt.status+". No repitas el envío; comprueba su estado antes de continuar.");
    }
   }else throw Error(data.error||"Meta no confirmó el envío. No vuelvas a pulsar sin revisar el registro.");
  }catch(e){setError(e instanceof Error?e.message:"Fallo al publicar; revisa los registros antes de repetir");}
  finally{setPublishing(null);setLiveConsent(false);}
 }
 async function refreshReadiness(){
  if(!draft||!revision||draft.id!=="8077d038-98eb-4729-abe5-425a26267460")return;
  setChecking(true);setError("");
  try{
   const response=await fetch("/api/meta/publicar?id="+encodeURIComponent(draft.id)+"&preflight=1",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"No se pudo verificar Meta");
   setDeliveries(data.deliveries||{});
   setReadiness(data.readiness?.revision===revision?data.readiness:null);
  }catch(e){setReadiness(null);setError(e instanceof Error?e.message:"Falló la comprobación de permisos");}
  finally{setChecking(false);}
 }
 function exportDraft(){
  if(!draft)return;
  const withoutMedia={...draft,media:{feed:draft.media.feed?{...draft.media.feed}:null,story:draft.media.story?{...draft.media.story}:null}};
  const blob=new Blob([JSON.stringify(withoutMedia,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=(draft.reference||"borrador")+"-meta.json";a.click();
  URL.revokeObjectURL(url);
 }
 if(!draft)return <p>Preparando editor de redes…</p>;
 const active=activeSlots(draft);
 const imagesReady=[...active].every(slot=>!!draft.media[slot]&&!files[slot]);
 const hasStory=draft.channels.facebook_story.enabled||draft.channels.instagram_story.enabled;
 const hasFeed=draft.channels.facebook_feed.enabled||draft.channels.instagram_feed.enabled;
 const feedReady=hasFeed&&!!draft.media.feed&&!files.feed;
 const storySavedAndUnchanged=!!savedBaseline&&draft.title===savedBaseline.title&&draft.reference===savedBaseline.reference&&
  (["facebook_story","instagram_story"] as const).every(key=>
   JSON.stringify(draft.channels[key])===JSON.stringify(savedBaseline.channels[key]));
 const storyReady=hasStory&&!!draft.media.story&&!files.story&&storySavedAndUnchanged;
 const storyApprovalStored=draft.storyApproved===true&&savedBaseline?.storyApproved===true&&!!savedBaseline.storyApprovalAt&&storySavedAndUnchanged;
 const feedApprovalStored=draft.contentApproved===true&&savedBaseline?.contentApproved===true&&!!savedBaseline.approvalAt;
 return <div className="meta-publisher">
  {draft.id==="8077d038-98eb-4729-abe5-425a26267460"&&<section className="section-card meta-publisher-quickstart">
   <div className="section-card-header"><div>
    <p className="kicker">TEST-001 · CONTINUACIÓN DIRECTA</p><h2>Terminar las dos historias</h2>
    <p>El feed de ambas redes ya tiene recibos; no debe volver a enviarse. La imagen vertical está guardada. Las historias necesitan aprobación propia y verificación de permisos antes de cualquier envío.</p>
   </div></div>
   <div className="meta-publisher-pad">
    <p>Imagen vertical: {draft.media.story?.width===1080&&draft.media.story?.height===1920?"1080 × 1920 guardada":"revisar archivo"} · Aprobación: {storyApprovalStored?"guardada":draft.storyApproved?"marcada SIN guardar":"pendiente"} · Publicación automática: desactivada</p>
    <div className="meta-publisher-actions">
     <button type="button" onClick={()=>document.getElementById("meta-story-approval")?.scrollIntoView({behavior:"smooth",block:"center"})}>Ir a aprobación de historias</button>
     <button type="button" disabled={!revision||checking} onClick={()=>void refreshReadiness()}>{checking?"Comprobando…":"Comprobar permisos sin publicar"}</button>
    </div>
   </div>
  </section>}
  <section className="meta-publisher-alert"><ShieldCheck size={20}/><div>
   <strong>Preparación editorial · envío real solo con confirmación expresa</strong>
   <p>Guardar un borrador o indicar una fecha no crea publicaciones ni historias en Meta. Solo TEST-001 podrá enviarse manualmente tras una segunda confirmación por cada red. La programación automática permanece desactivada.</p>
  </div></section>
  <div className="meta-publisher-actions">
   <button type="button" onClick={newOne}><Plus size={16}/> Nuevo borrador</button>
   <button type="button" onClick={loadTest}><FileImage size={16}/> Cargar TEST-001 aprobado</button>
   <button type="button" onClick={exportDraft}>Exportar ficha JSON</button>
  </div>
  <div className="meta-publisher-layout">
   <div className="meta-publisher-main">
    <section className="section-card">
     <div className="section-card-header"><div><p className="kicker">IDENTIDAD DE LA PIEZA</p><h2>Datos del borrador</h2></div><span className="meta-publisher-status"><LockKeyhole size={14}/> Privado</span></div>
     <div className="meta-publisher-pad">
      <label>Nombre interno<input value={draft.title} onChange={e=>change(d=>({...d,title:e.target.value}),true)} placeholder="Ej. Testimonio de esperanza · serie 03" maxLength={120}/></label>
      <label>Código o referencia (opcional)<input value={draft.reference} onChange={e=>change(d=>({...d,reference:e.target.value}),true)} placeholder="TEST-001, PD-014, ART-013…" maxLength={60}/></label>
      <p className="meta-publisher-help">Una referencia no publica ni modifica el contenido original de la revista. TEST-001 se mantiene independiente.</p>
     </div>
    </section>
    <section className="section-card">
     <div className="section-card-header"><div><p className="kicker">MATERIAL GRÁFICO</p><h2>Imágenes privadas</h2><p>Dos formatos separados, sin alterar los originales. JPEG o PNG, máximo 3,5 MB por imagen.</p></div></div>
     <div className="meta-publisher-pad meta-publisher-filegrid">
      {(["feed","story"] as const).map(slot=><div key={slot} className="meta-publisher-file">
       <div className="meta-publisher-file-preview">
        {(preview[slot]||imgUrl(draft,slot))?<img src={preview[slot]||imgUrl(draft,slot)} alt={"Vista previa del material "+slot}/>:<ImageIcon size={34}/>}
       </div>
       <strong>{slot==="feed"?"Feed · formato 1:1 o 4:5":"Historias · vertical 9:16"}</strong>
       <p>{slot==="feed"?"Imagen principal de Facebook e Instagram":"Imagen vertical propia; se recomienda 1080 × 1920"}</p>
       <input type="file" accept="image/jpeg,image/png" onChange={e=>void chooseFile(slot,e.target.files?.[0]||null)} aria-label={"Seleccionar imagen para "+slot}/>
       {files[slot]&&<small>Sin guardar: {files[slot]!.name}</small>}
       {draft.media[slot]&&!files[slot]&&<small>Guardado: {draft.media[slot]!.width} × {draft.media[slot]!.height}</small>}
      </div>)}
     </div>
    </section>
    <section className="section-card">
     <div className="section-card-header"><div><p className="kicker">SELECCIÓN INDEPENDIENTE</p><h2>Destinos de publicación</h2><p>Configura textos y fechas diferentes. Por ahora las fechas no activan un envío automático.</p></div></div>
     <div className="meta-publisher-channels">
      {channels.map(c=>{
       const current=draft.channels[c.key],isStory=c.slot==="story";
       return <article className={"meta-publisher-channel "+(current.enabled?"enabled":"")} key={c.key}>
        <label className="meta-publisher-toggle"><input type="checkbox" checked={current.enabled} onChange={e=>changeChannel(c.key,{enabled:e.target.checked},true)}/>
         {c.platform==="fb"?<Facebook size={21}/>:<Instagram size={21}/>}
         <strong>{c.label}</strong><span>{current.enabled?"Preparar":"Omitir"}</span></label>
        {current.enabled&&<>
         <p className="meta-publisher-help">{c.hint}</p>
         <label>{isStory?"Texto de referencia para la historia (no se sobreimprime por API)":"Texto que acompañará la publicación"}
          <textarea rows={isStory?3:6} value={current.copy} maxLength={2200} placeholder={isStory?"Notas o texto que debe estar incorporado en la imagen…":"Escribe la descripción aprobada…"} onChange={e=>changeChannel(c.key,{copy:e.target.value},true)}/></label>
         <div className="meta-publisher-schedule">
          <label><Clock3 size={15}/> Modo
           <select value={current.mode} onChange={e=>changeChannel(c.key,{mode:e.target.value as Channel["mode"],scheduledAt:null})}>
            <option value="manual">Sin fecha (manual)</option>
            <option value="target">Fecha objetivo</option>
           </select></label>
          {current.mode==="target"&&<label><CalendarDays size={15}/> Hora Colombia (UTC−5)
           <input type="datetime-local" value={toCO(current.scheduledAt)} onChange={e=>{
            try{changeChannel(c.key,{scheduledAt:fromCO(e.target.value)})}
            catch{setError("Fecha objetivo inválida")}
           }}/></label>}
         </div>
         {isStory&&<p className="meta-publisher-help">{c.platform==="ig"?(instagramAccountType==="BUSINESS"?"Cuenta Instagram Business confirmada para evaluar historias.":instagramAccountType?"Meta informa tipo "+instagramAccountType+"; las historias por API requieren Business.":"Tipo de cuenta Instagram aún sin comprobar: las historias por API solo funcionan con cuentas Business."):"La imagen debe llevar su propio texto. Enlaces interactivos y stickers no están garantizados por la API."} La música y los stickers no se añadirán automáticamente.</p>}
        </>}
       </article>;
      })}
     </div>
    </section>
    <section className="section-card" id="meta-story-approval">
     <div className="section-card-header"><div><p className="kicker">REVISIÓN AUTORAL</p><h2>Control de aprobación</h2></div></div>
     <div className="meta-publisher-pad">
      <label className="meta-publisher-approval"><input type="checkbox" checked={draft.contentApproved} disabled={!feedReady||!revision||busy} onChange={e=>change(d=>({...d,contentApproved:e.target.checked}))}/>
       <span><strong>Aprobar publicaciones del feed (Facebook e Instagram)</strong><small>Es independiente de la aprobación de historias. Los feeds de TEST-001 publicados conservarán sus identificadores y su bloqueo contra duplicados.</small></span></label>
      {!feedReady&&hasFeed&&<p className="meta-publisher-help">Guarda primero la imagen del feed para aprobar las publicaciones.</p>}
      {draft.approvalAt&&<p className="meta-publisher-help">Feed aprobado: {dateCO(draft.approvalAt)}.</p>}
      <label className="meta-publisher-approval"><input type="checkbox" checked={draft.storyApproved===true} disabled={!storyReady||!revision||busy} onChange={e=>change(d=>({...d,storyApproved:e.target.checked}))}/>
       <span><strong>Aprobar específicamente la imagen vertical y las historias</strong><small>La imagen 9:16 debe revisarse para Facebook e Instagram; esta aprobación no autoriza enviarlas y no modifica la aprobación del feed.</small></span></label>
      {!storyReady&&<p className="meta-publisher-help">Para aprobar historias: activa los destinos deseados, guarda el borrador y confirma la imagen 9:16. Solo después de guardar los cambios se habilitará la aprobación.</p>}
      {draft.storyApproved&&!storyApprovalStored&&<p className="meta-publisher-error" role="status"><AlertCircle size={16}/>La casilla está marcada, pero todavía NO has guardado la aprobación. Pulsa «Guardar borrador privado» para registrarla.</p>}
      {storyApprovalStored&&draft.storyApprovalAt&&<p className="meta-publisher-help">Historias aprobadas y guardadas: {dateCO(draft.storyApprovalAt)}.</p>}
      <div className="meta-publisher-save">
       <button disabled={busy} className="gold-button" onClick={()=>void save()}><Save size={16}/>{busy?"Guardando…":"Guardar borrador privado"}</button>
       <span>Guardar no publica <LockKeyhole size={14}/></span>
      </div>
      {message&&<p className="meta-publisher-success" role="status"><CheckCircle2 size={16}/>{message}</p>}
      {error&&<p className="meta-publisher-error" role="alert"><AlertCircle size={16}/>{error}</p>}
     </div>
    </section>
    {draft.reference==="TEST-001"&&<section className="section-card">
     <div className="section-card-header"><div>
      <p className="kicker">PRUEBA REAL · DOBLE CONFIRMACIÓN</p><h2>Enviar TEST-001 a Meta</h2>
      <p>Publicaciones de feed e historias de TEST-001 independientes. Las historias requieren imagen vertical y aprobación específica; Instagram debe ser Business y Facebook requiere los permisos adecuados. La programación automática continúa desactivada.</p>
     </div></div>
     <div className="meta-publisher-pad">
      <p className="meta-publisher-help">Feed: {feedApprovalStored?"aprobado y guardado":"pendiente"}. Historias: {storyApprovalStored?"aprobadas y guardadas":draft.storyApproved?"marcadas, falta GUARDAR":"pendientes de aprobación propia"}. Ninguno de estos estados implica autorización para enviar; la publicación será visible públicamente en la red elegida.</p>
      <div className="meta-publisher-actions">
       <button type="button" disabled={checking||busy||!!publishing} onClick={()=>void refreshReadiness()}>
        <ShieldCheck size={16}/>{checking?"Comprobando permisos de Meta…":"Volver a comprobar permisos sin publicar"}
       </button>
      </div>
      {readiness?.storyAccounts&&<div className="meta-publisher-diagnostics">
       <strong>Diagnóstico oficial de historias · consulta sin publicaciones</strong>
       <p>Instagram: {readiness.storyAccounts.instagram.canPublishStories
        ?"Cuenta Business confirmada por Meta"
        :readiness.storyAccounts.instagram.type
         ?"Meta identifica la cuenta como "+readiness.storyAccounts.instagram.type+"; revisa su categoría"
         :"Meta aún no devuelve el tipo Business. Confírmalo desde la configuración profesional de Instagram antes de publicar historias."}</p>
       <p>Facebook: {readiness.storyAccounts.facebook.canAttemptStories
        ?"Página identificada y rol válido; la entrega de historias requiere una prueba real"
        :"La página o sus permisos no se pudieron comprobar para historias."}
        {!readiness.storyAccounts.facebook.hasBusinessManagementScope
         ?" El permiso adicional de administración comercial no consta en el token; Meta podría exigirlo según el tipo de acceso.":""}</p>
      </div>}
      <label className="meta-publisher-approval"><input type="checkbox" checked={liveConsent} disabled={!(draft.contentApproved||draft.storyApproved)||busy||!!publishing} onChange={e=>setLiveConsent(e.target.checked)}/>
       <span><strong>Autorizo el envío real e inmediato de la prueba TEST-001</strong><small>Cada envío requiere además una confirmación explícita. No altera ART, PD ni publicaciones previamente programadas.</small></span></label>
      <div className="meta-publisher-actions">
       {(["facebook_feed","instagram_feed","facebook_story","instagram_story"] as const).map(channel=>{
        const record=deliveries[channel];
        const platform=(channel.startsWith("facebook_")?"Facebook":"Instagram")+(channel.endsWith("_story")?" · Historia":" · Feed");
        return <div key={channel} className="meta-publisher-delivery">
         <strong>{platform}</strong>
         {record?<p>Registro: {record.status==="published"?"Publicado":record.status==="needs_review"?"Necesita revisión":record.status} · {dateCO(record.updatedAt)}</p>:<p>Sin envío registrado</p>}
         {!record&&<p className="meta-publisher-readiness">{channel.endsWith("_story")&&draft.storyApproved&&!storyApprovalStored?"Aprobación sin guardar: pulsa «Guardar borrador privado» antes de comprobar permisos.":checking?"Comprobando permisos…":
          readiness?.channels[channel]?.ready?"Verificación previa: lista":
          readableReason(readiness?.channels[channel]?.reason||"META_PREFLIGHT_UNAVAILABLE")}</p>}
         {record?.metaPostId&&<small>Meta ID: {record.metaPostId}</small>}
         {record?.permalink&&/^https:\/\//.test(record.permalink)&&<a href={record.permalink} target="_blank" rel="noreferrer">Ver publicación real</a>}
         {record?.reason&&<small>Código técnico: {record.reason}</small>}
         <button type="button" className="gold-button"
          disabled={!!record||checking||!readiness?.channels[channel]?.ready||readiness.revision!==revision||!(channel.endsWith("_story")?storyApprovalStored:feedApprovalStored)||!liveConsent||busy||!!publishing||!draft.channels[channel].enabled||draft.channels[channel].mode!=="manual"||!revision}
          onClick={()=>void publishTest(channel)}>{publishing===channel?"Enviando…":record?"Envío bloqueado contra duplicación":"Publicar TEST-001 en "+platform}</button>
        </div>;
       })}
      </div>
      <p className="meta-publisher-help">Si un intento queda en revisión, no repitas el envío: puede haber llegado a Meta aunque no se haya recibido su respuesta. El registro queda bloqueado para impedir duplicados.</p>
     </div>
    </section>}
   </div>
   <aside className="meta-publisher-side">
    <section className="section-card">
     <div className="section-card-header"><div><p className="kicker">VISTA PREVIA</p><h2>Cuatro destinos</h2></div></div>
     <div className="meta-publisher-preview-grid">
      {channels.map(c=>{
       const slot=c.slot;
       const src=preview[slot]||imgUrl(draft,slot);
       const item=draft.channels[c.key];
       return <div className={"meta-publisher-preview "+(slot==="story"?"story":"feed")} key={c.key}>
        <strong>{c.platform==="fb"?"Facebook":"Instagram"} · {slot==="story"?"Historia":"Feed"}</strong>
        <div className="meta-publisher-frame">{src?<img src={src} alt={"Vista previa de "+c.label}/>:<span><ImageIcon size={22}/> Sin imagen</span>}</div>
        <p>{item.enabled?(item.copy||"Sin texto adicional").slice(0,130):"Destino no seleccionado"}</p>
        {item.enabled&&item.mode==="target"&&<small>Objetivo: {dateCO(item.scheduledAt)}</small>}
        {item.enabled&&item.mode==="manual"&&<small>Sin fecha objetivo</small>}
        {!item.enabled&&<small>Omitido</small>}
       </div>;
      })}
     </div>
    </section>
    <section className="section-card">
     <div className="section-card-header"><div><p className="kicker">EXPEDIENTES GUARDADOS</p><h2>Borradores privados</h2></div></div>
     <div className="meta-publisher-saved">
      {loading?<p>Cargando borradores…</p>:drafts.length===0?<p>No hay borradores guardados todavía.</p>:
       drafts.map(x=><button key={x.id} type="button" onClick={()=>openExisting(x)} className={draft.id===x.id?"selected":""}>
        <strong>{x.title}</strong><small>{x.reference||"Sin código"} · {dateCO(x.updatedAt)}</small><small>Feed: {x.contentApproved?"aprobado":"pendiente"} · Historias: {x.storyApproved?"aprobadas":"pendientes"} · Consulta el registro de envíos</small>
       </button>)}
      <p>Los borradores se almacenan de forma privada. No crean publicaciones ni modifican los calendarios de la revista.</p>
     </div>
    </section>
   </aside>
  </div>
 </div>;
}
