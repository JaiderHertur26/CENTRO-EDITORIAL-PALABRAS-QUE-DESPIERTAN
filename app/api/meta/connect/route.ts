import {NextRequest,NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {verifyEditor} from "@/lib/supabase";
import {metaLoginUrl,metaOauthReady} from "@/lib/meta-oauth";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private,no-store"};
export async function POST(request:NextRequest){
 if(!await verifyEditor())return NextResponse.json({error:"No autorizado"},{status:403,headers:noStore});
 if(request.headers.get("origin")!=="https://c-edi-palabras-que-despiertan.vercel.app")
  return NextResponse.json({error:"Origen no permitido"},{status:403,headers:noStore});
 if(!metaOauthReady())return NextResponse.json({error:"La conexión de Meta no está configurada"},{status:503,headers:noStore});
 const state=randomBytes(32).toString("hex");
 const result=NextResponse.redirect(metaLoginUrl(state),303);
 result.headers.set("Cache-Control","private, no-store");
 result.headers.set("Referrer-Policy","no-referrer");
 result.cookies.set("pqd_meta_oauth_state",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/api/meta",maxAge:600});
 return result;
}
