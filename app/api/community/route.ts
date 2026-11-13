import {NextRequest,NextResponse} from "next/server";
import {verifyEditor,editorialAdmin} from "@/lib/supabase";
export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req:NextRequest){
 const user=await verifyEditor();
 if(!user)return NextResponse.json({error:"Acceso restringido"},{status:403});
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origen no válido"},{status:403});
 let payload:{id?:string;type?:string;note?:string};
 try{payload=await req.json();}catch{return NextResponse.json({error:"Datos incorrectos"},{status:400});}
 if(!payload.id||!UUID.test(payload.id))return NextResponse.json({error:"ID incorrecto"},{status:400});
 const note=String(payload.note??"").slice(0,500);
 const admin=editorialAdmin();
 if(payload.type==="hide"){
  const r=await admin.from("discussion_entries").update({
   status:"hidden",reviewed_by:user.id,moderation_note:note||"Retirada por la dirección editorial"
  }).eq("id",payload.id).eq("status","approved").select("id");
  if(r.error||!r.data?.length)return NextResponse.json({error:"No se pudo ocultar; tal vez ya estaba oculto"},{status:409});
 }else if(payload.type==="resolve"){
  const r=await admin.from("discussion_reports").update({resolved:true,resolved_by:user.id,resolved_at:new Date().toISOString(),resolution_note:note||"Atendido"}).eq("id",payload.id).eq("resolved",false).select("id");
  if(r.error||!r.data?.length)return NextResponse.json({error:"Reporte inexistente o ya resuelto"},{status:409});
 }else return NextResponse.json({error:"Acción no permitida"},{status:400});
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
