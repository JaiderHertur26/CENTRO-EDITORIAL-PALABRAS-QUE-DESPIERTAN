import {NextRequest,NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get("code");
 const response=NextResponse.redirect(new URL("/acceso?error=enlace",request.url),{status:303});
 response.headers.set("Cache-Control","private,no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"";
 if(!code||url!=="https://lwuzkjvolxwkxdyafcjv.supabase.co"||!key)return response;
 const auth=createServerClient(url,key,{cookies:{
  getAll(){return request.cookies.getAll();},
  setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
 }});
 const exchanged=await auth.auth.exchangeCodeForSession(code);
 if(exchanged.error)return response;
 const {data:{user},error}=await auth.auth.getUser();
 if(error||!user?.email_confirmed_at)return response;
 const secret=process.env.SUPABASE_SECRET_KEY||"";
 if(!secret.startsWith("sb_secret_"))return response;
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data}=await admin.from("discussion_moderators").select("user_id").eq("user_id",user.id).maybeSingle();
 response.headers.set("Location",new URL(data?"/":"/acceso?error=permisos",request.url).toString());
 return response;
}
