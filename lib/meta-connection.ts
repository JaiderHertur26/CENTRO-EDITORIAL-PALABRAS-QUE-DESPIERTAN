import "server-only";

/** Estado exclusivamente del servidor: nunca se devuelven credenciales Meta al navegador. */
const expectedAppId="2572239026621118";
const expectedConfigurationId="983608407667644";

export function metaIntegrationStatus(){
 const appId=(process.env.META_APP_ID||"").trim();
 const configId=(process.env.META_CONFIG_ID||"").trim();
 const secret=(process.env.META_APP_SECRET||"").trim();
 const present=[appId,configId,secret].filter(Boolean).length;
 const idsMatch=appId===expectedAppId&&configId===expectedConfigurationId;
 const secretLooksValid=/^[a-fA-F0-9]{32}$/.test(secret);
 const formatValid=idsMatch&&secretLooksValid;
 return {
  developerConfigured:present===3&&formatValid,
  configuredCount:present,
  idsMatch:present>=2&&idsMatch,
  formatValid,
  permissionsVerified:false,
  pageConnected:false,
  instagramConnected:false,
  automaticPublishingEnabled:false,
  facebookPage:"PalabrasQueDespiertan01",
  instagramAccount:"palabrasquedespiertan",
  reason:present<3
   ?"Faltan variables de configuración de Meta en este despliegue."
   :!formatValid
   ?"Las variables están presentes, pero una no corresponde a los identificadores oficiales o al formato esperado. Revísalas en Vercel."
   :"Las tres variables corresponden a esta aplicación; falta validar Meta y autorizar las cuentas.",
 };
}
export async function verifyMetaAppCredentials():Promise<"verified"|"missing"|"invalid"|"unavailable">{
 const state=metaIntegrationStatus();
 if(!state.developerConfigured)return state.configuredCount===3?"invalid":"missing";
 const form=new URLSearchParams({
  client_id:process.env.META_APP_ID!,
  client_secret:process.env.META_APP_SECRET!,
  grant_type:"client_credentials",
 });
 try{
  const response=await fetch("https://graph.facebook.com/v26.0/oauth/access_token?"+form.toString(),{
   method:"GET",cache:"no-store",signal:AbortSignal.timeout(9000),
  });
  if(!response.ok)return response.status>=500?"unavailable":"invalid";
  const body=await response.json() as {access_token?:unknown;token_type?:unknown};
  // El token devuelto nunca se registra, almacena, devuelve ni comparte.
  return typeof body.access_token==="string"&&body.access_token.length>20?"verified":"invalid";
 }catch{return "unavailable";}
}
