import {NextRequest,NextResponse} from "next/server";
import {verifyEditor} from "@/lib/supabase";
import {draftBridge} from "@/lib/meta-drafts-bridge";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const h={"Cache-Control":"private,no-store","X-Robots-Tag":"noindex,nofollow","X-Content-Type-Options":"nosniff"};
const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:h});
const idCheck=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function query(req:NextRequest){
 const id=req.nextUrl.searchParams.get("id")||"",slot=req.nextUrl.searchParams.get("slot")||"";
 if(!idCheck.test(id)||!["feed","story"].includes(slot))return null;
 return new URLSearchParams({id,slot});
}
export async function GET(req:NextRequest){
 if(!await verifyEditor())return reply({error:"Acceso denegado"},403);
 const q=query(req);
 if(!q)return reply({error:"Referencia inválida"},400);
 try{
  const up=await draftBridge("GET",true,q);
  if(!up.ok)return reply({error:"Imagen no disponible"},up.status);
  const mime=up.headers.get("content-type")||"";
  if(!["image/png","image/jpeg"].includes(mime))return reply({error:"Formato inesperado"},502);
  return new NextResponse(new Uint8Array(await up.arrayBuffer()),{headers:{...h,"Content-Type":mime,"Content-Disposition":"inline"}});
 }catch{return reply({error:"No se pudo leer la imagen"},503);}
}
export async function PUT(req:NextRequest){
 if(!await verifyEditor())return reply({error:"Acceso denegado"},403);
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return reply({error:"Origen denegado"},403);
 const q=query(req);
 if(!q)return reply({error:"Destino inválido"},400);
 const mime=req.headers.get("content-type")||"";
 if(!["image/png","image/jpeg"].includes(mime))return reply({error:"Se requiere PNG o JPEG"},415);
 if(Number(req.headers.get("content-length")||0)>3_500_000)return reply({error:"La imagen supera el límite de 3,5 MB"},413);
 const revision=req.headers.get("x-pqd-expected-revision")||"";
 if(!/^\d{4}-\d\d-\d\dT.+Z$/.test(revision))return reply({error:"Versión no indicada"},400);
 try{
  const body=await req.arrayBuffer();
  if(body.byteLength>3_500_000)return reply({error:"Imagen demasiado grande"},413);
  const up=await draftBridge("PUT",true,q,body,mime,revision);
  return reply(await up.json(),up.status);
 }catch{return reply({error:"No se pudo subir la imagen"},503);}
}
