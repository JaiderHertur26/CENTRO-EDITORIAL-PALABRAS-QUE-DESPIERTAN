import "server-only";
import {cookies} from "next/headers";
import {createServerClient} from "@supabase/ssr";

export const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"";
const expected="https://lwuzkjvolxwkxdyafcjv.supabase.co";

/** Sesión del propietario. Nunca se utiliza service_role en Vercel. */
export async function sessionClient(){
 if(projectUrl!==expected||!publishable.startsWith("sb_publishable_"))return null;
 const cookieStore=await cookies();
 return createServerClient(projectUrl,publishable,{cookies:{
  getAll(){return cookieStore.getAll();},
  setAll(values){try{values.forEach(({name,value,options})=>cookieStore.set(name,value,options));}
    catch{/* Las rutas de servidor son de solo lectura; proxy renueva cookies. */}}
 }});
}
export async function verifyEditor(){
 const client=await sessionClient();
 if(!client)return null;
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user||!user.email_confirmed_at||user.is_anonymous||
    user.email?.toLowerCase()!=="pquedespiertan@gmail.com")return null;
 // Función SECURITY DEFINER: Supabase verifica el usuario desde el JWT
 // y su membresía en discussion_moderators. La clave pública no eleva permisos.
 const {data:permitted,error:authError}=await client.rpc("editorial_is_authorized");
 return !authError&&permitted===true?user:null;
}
