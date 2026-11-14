import "server-only";
import {sessionClient} from "@/lib/supabase";

const origin="https://www.palabrasquedespiertan.online/api/editorial/meta/drafts";
type Method="GET"|"POST"|"PUT";
export async function draftBridge(method:Method,media:boolean,query:URLSearchParams,body?:string|ArrayBuffer,contentType?:string,revision?:string){
 const bridge=process.env.META_BRIDGE_KEY||"";
 if(!/^[a-f0-9]{64}$/i.test(bridge))throw Error("Sin conexión segura al almacén de borradores");
 const client=await sessionClient();
 if(!client)throw Error("Sesión no disponible");
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.access_token)throw Error("Sesión editorial caducada");
 const url=new URL(origin+(media?"/media":""));
 url.search=query.toString();
 return fetch(url,{method,cache:"no-store",signal:AbortSignal.timeout(25000),
  headers:{
   "Authorization":"Bearer "+session.access_token,
   "X-PQD-Meta-Bridge":bridge,
   ...(contentType?{"Content-Type":contentType}:{}),
   ...(revision?{"X-PQD-Expected-Revision":revision}:{})
  },
  ...(body!==undefined?{body}:{})
 });
}
