import {NextRequest,NextResponse} from "next/server";
import {verifyEditor,editorialAdmin} from "@/lib/supabase";
import {kindOk,slugOk,stateOk,validateItem} from "@/lib/validation";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private,no-store"};
const err=(message:string,status=400)=>NextResponse.json({error:message},{status,headers:noStore});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function originSafe(request:NextRequest){
 const origin=request.headers.get("origin");
 return !origin||origin===request.nextUrl.origin;
}
function pick(data:Record<string,unknown>){
 const allowed=["title","subtitle","summary","body","cover_url","bible_reference","state","scheduled_at","featured","social_state","change_note"];
 return Object.fromEntries(allowed.filter(k=>data[k]!==undefined).map(k=>[k,data[k]]));
}
export async function GET(req:NextRequest){
 const user=await verifyEditor();
 if(!user)return err("Acceso editorial restringido.",403);
 const id=req.nextUrl.searchParams.get("id");
 if(!id||!UUID.test(id))return err("Identificador no válido");
 const admin=editorialAdmin();
 const {data,error}=await admin.from("editorial_items").select("*").eq("id",id).maybeSingle();
 if(error||!data)return err("Publicación no encontrada",404);
 return NextResponse.json({item:data},{headers:noStore});
}
export async function PATCH(req:NextRequest){
 const user=await verifyEditor();
 if(!user)return err("Acceso editorial restringido.",403);
 if(!originSafe(req))return err("Origen no autorizado",403);
 if(!req.headers.get("content-type")?.includes("application/json"))return err("Formato no admitido",415);
 const raw=await req.text();
 if(raw.length>250000)return err("Texto demasiado largo",413);
 let data:Record<string,unknown>;
 try{data=JSON.parse(raw);}catch{return err("JSON incorrecto");}
 const id=data.id;
 if(typeof id!=="string"||!UUID.test(id))return err("Publicación no válida");
 const admin=editorialAdmin();
 const original=await admin.from("editorial_items").select("*").eq("id",id).maybeSingle();
 if(original.error||!original.data)return err("Publicación no encontrada",404);
 const current=original.data;
 if(data.updated_at!==current.updated_at)return err("Esta publicación cambió en otra sesión. Actualiza la ficha para evitar sobrescribirla.",409);
 const patch=pick(data);
 const approving=data.confirmApproval===true&&current.approved_by_author===false;
 if(approving){
  if(String(patch.body??current.body??"").trim().length<20)return err("Completa el contenido antes de confirmar su aprobación.");
  patch.approved_by_author=true;
  patch.change_note="Aprobación autoral explícita desde la dirección editorial";
 }
 const state=(patch.state??current.state) as string;
 if(!current.approved_by_author&&!approving&&state!=="pending")return err("Esta obra necesita aprobación del autor antes de programarse o publicarse.");
 if(patch.cover_url!==undefined&&patch.cover_url!==null&&(typeof patch.cover_url!=="string"||!/^https:\/\/[\w.-]+\//.test(patch.cover_url)&&!/^\/(identidad|mensajes)\//.test(patch.cover_url)))return err("La imagen debe ser una URL HTTPS o un recurso oficial.");
 const merged={...current,...patch};
 const problem=validateItem(patch,merged);
 if(problem)return err(problem);
 if(state==="published"&&!current.published_at)patch.published_at=new Date().toISOString();
 if(state!=="scheduled")patch.scheduled_at=null;
 patch.updated_by=user.id;
 const {data:saved,error}=await admin.from("editorial_items").update(patch)
  .eq("id",id).eq("updated_at",current.updated_at).select("id,state,updated_at").maybeSingle();
 if(error)return err("La base rechazó la modificación: "+(error.code||"verificar"),422);
 if(!saved)return err("La publicación cambió. Recarga su ficha.",409);
 return NextResponse.json({ok:true,item:saved},{headers:noStore});
}
export async function POST(req:NextRequest){
 const user=await verifyEditor();
 if(!user)return err("Acceso editorial restringido.",403);
 if(!originSafe(req))return err("Origen no autorizado",403);
 if(!req.headers.get("content-type")?.includes("application/json"))return err("Formato no admitido",415);
 let data:Record<string,unknown>;
 try{data=await req.json();}catch{return err("Datos no válidos");}
 if(!kindOk(data.kind)||!slugOk(data.slug)||typeof data.code!=="string"||!/^(ART-\d{3}|PD-\d{3}|TEMA-\d{2,3})$/.test(data.code)||typeof data.title!=="string"||data.title.trim().length<2||data.title.length>240)return err("Tipo, número, slug o título inválidos.");
 const isDirector=user.email?.toLowerCase()==="pquedespiertan@gmail.com";
 const approved=data.confirmApproval===true&&isDirector;
 if(data.confirmApproval===true&&!isDirector)return err("Solo la dirección editorial puede aprobar documentos del autor.",403);
 const body=typeof data.body==="string"?data.body.slice(0,200000):"";
 const record={
  kind:data.kind,code:data.code,slug:data.slug,title:data.title.trim(),
  subtitle:typeof data.subtitle==="string"?data.subtitle.slice(0,1000):"",
  summary:typeof data.summary==="string"?data.summary.slice(0,5000):"",
  body,approved_by_author:approved,
  state:"pending",updated_by:user.id,
  change_note:"Alta desde el Centro Editorial (pendiente hasta publicación explícita)"
 };
 const admin=editorialAdmin();
 const {data:item,error}=await admin.from("editorial_items").insert(record).select("id,slug").single();
 if(error)return err(error.code==="23505"?"Ya existe un elemento con ese código o identificador.":"No se pudo crear la publicación: "+error.code,409);
 return NextResponse.json({ok:true,item},{status:201,headers:noStore});
}
