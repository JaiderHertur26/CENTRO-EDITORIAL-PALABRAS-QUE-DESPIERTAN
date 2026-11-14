import "server-only";
import {sessionClient} from "@/lib/supabase";

export const META_CALLBACK="https://c-edi-palabras-que-despiertan.vercel.app/api/meta/callback";
const vault="https://www.palabrasquedespiertan.online/api/editorial/meta/vault";
const metaBase="https://graph.facebook.com/v26.0";

export function metaOauthReady(){
 return process.env.META_APP_ID==="2572239026621118"&&
  process.env.META_CONFIG_ID==="983608407667644"&&
  /^[a-f0-9]{32}$/i.test(process.env.META_APP_SECRET||"")&&
  /^[a-f0-9]{64}$/i.test(process.env.META_BRIDGE_KEY||"");
}
export function metaLoginUrl(state:string){
 if(!metaOauthReady()||!/^[a-f0-9]{64}$/.test(state))throw Error("Login not configured");
 const url=new URL("https://www.facebook.com/v26.0/dialog/oauth");
 url.searchParams.set("client_id",process.env.META_APP_ID!);
 url.searchParams.set("config_id",process.env.META_CONFIG_ID!);
 url.searchParams.set("redirect_uri",META_CALLBACK);
 url.searchParams.set("state",state);
 url.searchParams.set("response_type","code");
 url.searchParams.set("override_default_response_type","true");
 url.searchParams.set("display","page");
 // En las apps nuevas el config_id reemplaza scope.
 return url;
}
async function editorToken(){
 const client=await sessionClient();
 if(!client)throw Error("Editor session unavailable");
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Editor session unavailable");
 return session.access_token;
}
async function vaultRequest(method:"GET"|"POST",body?:unknown){
 const bridge=process.env.META_BRIDGE_KEY||"";
 if(!/^[a-f0-9]{64}$/i.test(bridge))throw Error("Meta Vault not configured");
 const jwt=await editorToken();
 const response=await fetch(vault,{method,cache:"no-store",signal:AbortSignal.timeout(23000),
  headers:{"Authorization":"Bearer "+jwt,"X-PQD-Meta-Bridge":bridge,
   ...(method==="GET"&&metaOauthReady()?{"X-PQD-Meta-App-Authorization":process.env.META_APP_ID+"|"+process.env.META_APP_SECRET}:{}),
   ...(method==="POST"?{"Content-Type":"application/json"}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)})});
 if(!response.ok)throw Error("Meta Vault unavailable");
 return response.json() as Promise<Record<string,unknown>>;
}
export type MetaVaultStatus={ready:boolean;connected:boolean;scopes:string[];at:string|null;verifiedAccount:boolean;username?:string|null;expiresAt?:number|null;verificationState?:string;lastVerifiedAt?:string|null;unavailable?:boolean};
export async function metaVaultStatus():Promise<MetaVaultStatus>{
 try{
  if(!metaOauthReady())return {ready:false,connected:false,scopes:[],at:null,verifiedAccount:false};
  const status=await vaultRequest("GET");
  return {
   ready:true,
   connected:status.connected===true,
   scopes:Array.isArray(status.scopes)?status.scopes.filter((x):x is string=>typeof x==="string"):[],
   at:typeof status.at==="string"?status.at:null,
   verifiedAccount:status.verifiedAccount===true,
   username:typeof status.username==="string"?status.username:null,
   verificationState:typeof status.verificationState==="string"?status.verificationState:"unverified",
   expiresAt:typeof status.expiresAt==="number"?status.expiresAt:null,
   lastVerifiedAt:typeof status.lastVerifiedAt==="string"?status.lastVerifiedAt:null
  };
 }catch{return {ready:metaOauthReady(),connected:false,scopes:[],at:null,verifiedAccount:false,unavailable:true};}
}
export async function exchangeMetaCode(code:string){
 if(!metaOauthReady()||!/^[A-Za-z0-9._-]{5,2048}$/.test(code))throw Error("Invalid Meta code");
 const url=new URL(metaBase+"/oauth/access_token");
 url.searchParams.set("client_id",process.env.META_APP_ID!);
 url.searchParams.set("client_secret",process.env.META_APP_SECRET!);
 url.searchParams.set("redirect_uri",META_CALLBACK);
 url.searchParams.set("code",code);
 const response=await fetch(url,{method:"GET",cache:"no-store",signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error("Meta exchange failed");
 const raw=await response.json() as {access_token?:unknown;expires_in?:unknown};
 const token=raw.access_token;
 if(typeof token!=="string"||token.length<20)throw Error("Meta token unavailable");
 const debug=new URL(metaBase+"/debug_token");
 debug.searchParams.set("input_token",token);
 debug.searchParams.set("access_token",process.env.META_APP_ID+"|"+process.env.META_APP_SECRET);
 const audit=await fetch(debug,{cache:"no-store",signal:AbortSignal.timeout(12000)});
 if(!audit.ok)throw Error("Meta token check failed");
 const rawDebug=await audit.json() as {data?:{is_valid?:boolean;app_id?:string|number;scopes?:string[];expires_at?:number}};
 const data=rawDebug.data;
 if(!data?.is_valid||String(data.app_id)!==process.env.META_APP_ID)throw Error("Meta token not issued to this application");
 const scopes=data.scopes||[];
 if(!scopes.includes("instagram_basic")||!scopes.includes("instagram_content_publish"))throw Error("Meta publishing permissions missing");
 await vaultRequest("POST",{
  token,appId:process.env.META_APP_ID,scopes,
  expiresAt:Number.isFinite(data.expires_at)?data.expires_at:null,
  verifiedAccount:false
 });
 return {stored:true,scopes};
}
