import {NextRequest,NextResponse} from "next/server";
import {verifyEditor} from "@/lib/supabase";
import {metaPublishBridge} from "@/lib/meta-drafts-bridge";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
const h={"Cache-Control":"private,no-store,max-age=0","X-Robots-Tag":"noindex,nofollow"};
const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:h});
export async function GET(req:NextRequest){
 if(!await verifyEditor())return reply({error:"Sin autorización editorial"},403);
 const id=req.nextUrl.searchParams.get("id")||"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return reply({error:"ID inválido"},400);
 const args=new URLSearchParams({id});
 if(req.nextUrl.searchParams.get("preflight")==="1")args.set("preflight","1");
 try{
  const upstream=await metaPublishBridge("GET",args);
  return reply(await upstream.json(),upstream.status);
 }catch{return reply({error:"No se pudo consultar el registro de envíos"},503)}
}
export async function POST(req:NextRequest){
 if(!await verifyEditor())return reply({error:"Sin autorización editorial"},403);
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return reply({error:"Origen denegado"},403);
 if(req.headers.get("content-type")?.split(";")[0]!=="application/json")return reply({error:"JSON requerido"},415);
 if(Number(req.headers.get("content-length")||0)>1024)return reply({error:"Solicitud demasiado extensa"},413);
 try{
  const body=await req.text();if(body.length>1024)return reply({error:"Solicitud demasiado extensa"},413);
  const upstream=await metaPublishBridge("POST",new URLSearchParams(),body);
  return reply(await upstream.json(),upstream.status);
 }catch{return reply({error:"No se pudo completar el envío. Consulta el registro antes de repetir"},503)}
}
