import "server-only";

/** Diagnóstico sin exponer credenciales ni inferir una autorización inexistente. */
export function metaIntegrationStatus(){
 const appId=process.env.META_APP_ID||"";
 const appSecret=process.env.META_APP_SECRET||"";
 const ready=appId.length>0&&appSecret.length>0;
 return {
  developerConfigured:ready,
  permissionsVerified:false,
  pageConnected:false,
  instagramConnected:false,
  automaticPublishingEnabled:false,
  facebookPage:"PalabrasQueDespiertan01",
  instagramAccount:"palabrasquedespiertan",
  reason:ready
   ?"Aplicación Meta configurada; falta verificar la autorización oficial de las cuentas."
   :"Aún no se ha configurado una aplicación Meta ni autorizado la conexión.",
 };
}
