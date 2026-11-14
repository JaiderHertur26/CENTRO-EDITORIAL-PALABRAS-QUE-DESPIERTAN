import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {verifyEditor} from "@/lib/supabase";
import {exchangeMetaCode,metaOauthReady,META_CALLBACK} from "@/lib/meta-oauth";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private,no-store,max-age=0","X-Robots-Tag":"noindex,nofollow"};
function equalState(a:string,b:string){
 if(!/^[a-f0-9]{64}$/.test(a)||!/^[a-f0-9]{64}$/.test(b))return false;
 return timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex"));
}
function finish(request:NextRequest,result:string){
 const response=NextResponse.redirect(new URL("/integraciones?meta="+encodeURIComponent(result),request.url),303);
 response.headers.set("Cache-Control","private,no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 response.cookies.set("pqd_meta_oauth_state","",{httpOnly:true,secure:true,sameSite:"lax",path:"/api/meta",maxAge:0});
 return response;
}
export async function GET(request:NextRequest){
 const query=request.nextUrl.searchParams;
 if(!query.has("code")&&!query.has("state")&&!query.has("error")&&!query.has("access_token")){
  return NextResponse.json({
   service:"Palabras que despiertan",
   endpoint:META_CALLBACK,
   oauthReady:metaOauthReady(),
   publishingEnabled:false
  },{headers:noStore});
 }
 // Nunca se permite que Meta devuelva tokens mediante fragmentos o parámetros de URL.
 if(query.has("access_token"))return NextResponse.json({error:"Tipo de respuesta no permitido"},{status:403,headers:noStore});
 if(!await verifyEditor())return NextResponse.json({error:"Debes iniciar sesión para autorizar Meta"},{status:403,headers:noStore});
 const expected=request.cookies.get("pqd_meta_oauth_state")?.value||"";
 const received=query.get("state")||"";
 if(!equalState(expected,received))return NextResponse.json({error:"Estado de autorización inválido"},{status:403,headers:noStore});
 if(query.has("error"))return finish(request,"cancelado");
 const code=query.get("code")||"";
 if(!metaOauthReady()||!/^[A-Za-z0-9._-]{5,2048}$/.test(code))return finish(request,"error");
 try{
  await exchangeMetaCode(code);
  return finish(request,"autorizacion-recibida");
 }catch{
  return finish(request,"error");
 }
}
