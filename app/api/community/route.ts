import {NextRequest,NextResponse} from "next/server";
import {verifyEditor,sessionClient} from "@/lib/supabase";
export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req:NextRequest){
 const user=await verifyEditor();
 if(!user)return NextResponse.json({error:"Acceso restringido"},{status:403});
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origen no válido"},{status:403});
 let payload:{id?:string;type?:string;note?:string};
 try{payload=await req.json();}catch{return NextResponse.json({error:"Datos incorrectos"},{status:400});}
 if(!payload.id||!UUID.test(payload.id))return NextResponse.json({error:"ID incorrecto"},{status:400});
 const note=String(payload.note??"").slice(0,500);
 if(payload.type!=="hide"&&payload.type!=="resolve")
  return NextResponse.json({error:"Acción no permitida"},{status:400});
 const client=await sessionClient();
 if(!client)return NextResponse.json({error:"Sesión no disponible"},{status:403});
 const {data,error}=await client.rpc("editorial_moderate",{p_action:payload.type,p_id:payload.id,p_note:note});
 if(error||data!==true)return NextResponse.json({error:"No se pudo completar la decisión editorial."},{status:409});
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
