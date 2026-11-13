export const slugOk=(v:unknown)=>typeof v==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)&&v.length<=150;
export const stateOk=(v:unknown)=>v==="pending"||v==="published"||v==="scheduled";
export const kindOk=(v:unknown)=>v==="mensaje"||v==="articulo"||v==="tema";
export function validateItem(payload:Record<string,unknown>,current?:Record<string,unknown>):string|null {
 if(payload.state!==undefined&&!stateOk(payload.state))return "Estado editorial desconocido.";
 if(payload.title!==undefined&&(typeof payload.title!=="string"||payload.title.trim().length<2||payload.title.length>240))return "El título debe tener de 2 a 240 caracteres.";
 for(const k of ["subtitle","summary","body","bible_reference","social_state"]){
  if(payload[k]!==undefined&&(typeof payload[k]!=="string"||String(payload[k]).length>200000))return "El campo "+k+" no es válido.";
 }
 if(payload.featured!==undefined&&typeof payload.featured!=="boolean")return "El destacado no es válido.";
 const state=payload.state??current?.state;
 if(state==="scheduled"){
  if(typeof payload.scheduled_at!=="string"||!Number.isFinite(Date.parse(payload.scheduled_at)))return "Selecciona una fecha y hora de programación válidas.";
 }
 if(state==="published"||state==="scheduled"){
  const body=String(payload.body??current?.body??"").trim();
  if(body.length<20)return "Completa el contenido antes de publicar o programar.";
 }
 return null;
}
