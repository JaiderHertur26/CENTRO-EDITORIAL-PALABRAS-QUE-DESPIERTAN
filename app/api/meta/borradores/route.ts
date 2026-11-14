import {NextRequest,NextResponse} from "next/server";
import {verifyEditor} from "@/lib/supabase";
import {draftBridge} from "@/lib/meta-drafts-bridge";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private,no-store","X-Robots-Tag":"noindex,nofollow"};
const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers});
export async function GET(req:NextRequest){
 if(!await verifyEditor())return reply({error:"Sin autorización editorial"},403);
 try{
  const q=new URLSearchParams();
  const id=req.nextUrl.searchParams.get("id");
  if(id)q.set("id",id);
  const data=await draftBridge("GET",false,q);
  return reply(await data.json(),data.status);
 }catch{return reply({error:"No se pudieron consultar los borradores"},503);}
}
export async function POST(req:NextRequest){
 if(!await verifyEditor())return reply({error:"Sin autorización editorial"},403);
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return reply({error:"Origen denegado"},403);
 if(req.headers.get("content-type")?.split(";")[0]!=="application/json")return reply({error:"Se requiere JSON"},415);
 if(Number(req.headers.get("content-length")||0)>40000)return reply({error:"Borrador demasiado extenso"},413);
 try{
  const body=await req.text();
  if(body.length>40000)return reply({error:"Borrador demasiado extenso"},413);
  const data=await draftBridge("POST",false,new URLSearchParams(),body,"application/json");
  return reply(await data.json(),data.status);
 }catch{return reply({error:"No se pudo guardar el borrador"},503);}
}
