import "server-only";
import {cookies} from "next/headers";
import {createClient} from "@supabase/supabase-js";
import {createServerClient} from "@supabase/ssr";
export const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"";
const secret=process.env.SUPABASE_SECRET_KEY||"";
if(process.env.NODE_ENV==="production"&&!projectUrl.includes("lwuzkjvolxwkxdyafcjv"))console.error("Centro editorial: configure Supabase dedicado");
export function editorialAdmin(){
 if(projectUrl!=="https://lwuzkjvolxwkxdyafcjv.supabase.co"||!secret.startsWith("sb_secret_"))throw Error("Configuración segura de Supabase no disponible");
 return createClient(projectUrl,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function sessionClient(){
 if(projectUrl!=="https://lwuzkjvolxwkxdyafcjv.supabase.co"||!publishable.startsWith("sb_publishable_"))return null;
 const cookieStore=await cookies();
 return createServerClient(projectUrl,publishable,{cookies:{
  getAll(){return cookieStore.getAll();},
  setAll(values){try{values.forEach(({name,value,options})=>cookieStore.set(name,value,options));}catch{/* SSR read-only */}}
 }});
}
export async function verifyEditor(){
 const client=await sessionClient();
 if(!client)return null;
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user||!user.email_confirmed_at||user.is_anonymous||user.email?.toLowerCase()!=="pquedespiertan@gmail.com")return null;
 const admin=editorialAdmin();
 const {data,error:roleError}=await admin.from("discussion_moderators").select("user_id").eq("user_id",user.id).maybeSingle();
 return !roleError&&data?user:null;
}
