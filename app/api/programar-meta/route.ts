import {NextRequest,NextResponse} from "next/server";
import {verifyEditor,sessionClient} from "@/lib/supabase";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private,no-store"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req:NextRequest){
 const user=await verifyEditor();
 if(!user)return NextResponse.json({error:"No tienes permiso editorial"},{status:403,headers:noStore});
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origen no permitido"},{status:403,headers:noStore});
 if(!req.headers.get("content-type")?.includes("application/json"))return NextResponse.json({error:"Se requiere JSON"},{status:415,headers:noStore});
 let data:{id?:unknown;metaAt?:unknown;updatedAt?:unknown};
 try{data=await req.json();}catch{return NextResponse.json({error:"Datos inválidos"},{status:400,headers:noStore});}
 if(typeof data.id!=="string"||!UUID.test(data.id)||typeof data.metaAt!=="string"||!Number.isFinite(Date.parse(data.metaAt))||
 typeof data.updatedAt!=="string"||!Number.isFinite(Date.parse(data.updatedAt)))
 return NextResponse.json({error:"ID, fecha de Meta o versión inválidos"},{status:400,headers:noStore});
 const client=await sessionClient();
 if(!client)return NextResponse.json({error:"Sesión cerrada"},{status:403,headers:noStore});
 const {data:result,error}=await client.rpc("editorial_schedule_from_meta",{
  p_id:data.id,p_meta_at:data.metaAt,p_expected_updated_at:data.updatedAt
 });
 if(error||!result)return NextResponse.json({error:error?.message||"No se pudo confirmar la programación"},{status:409,headers:noStore});
 return NextResponse.json({ok:true,item:result},{headers:noStore});
}
