import {NextRequest,NextResponse} from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const noStore={"Cache-Control":"no-store, private, max-age=0","X-Robots-Tag":"noindex, nofollow"};

/**
 * Reserva estable para la vuelta de Meta.
 * Hasta que se incorpore un flujo OAuth completo (state firmado, intercambio
 * servidor a servidor y almacén cifrado), NO procesa ni conserva códigos/tokens.
 */
export async function GET(request:NextRequest){
 const query=request.nextUrl.searchParams;
 if(query.has("code")||query.has("state")||query.has("error")||query.has("access_token")){
  return NextResponse.json({
   ready:false,
   message:"La autorización todavía no está habilitada. No se ha procesado ningún código ni token."
  },{status:503,headers:noStore});
 }
 return NextResponse.json({
  service:"Palabras que despiertan — Centro Editorial",
  endpoint:"Retorno reservado para la autorización oficial de Meta",
  redirectUri:"https://c-edi-palabras-que-despiertan.vercel.app/api/meta/callback",
  oauthEnabled:false,
  publishingEnabled:false
 },{status:200,headers:noStore});
}
