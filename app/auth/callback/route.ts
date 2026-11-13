import {NextRequest,NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
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
  setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));
                 values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
 }});
 const exchanged=await auth.auth.exchangeCodeForSession(code);
 if(exchanged.error)return response;
 const {data:{user},error}=await auth.auth.getUser();
 if(error||!user?.email_confirmed_at||user.email?.toLowerCase()!=="pquedespiertan@gmail.com")return response;
 const role=await auth.rpc("editorial_is_authorized");
 response.headers.set("Location",new URL(!role.error&&role.data===true?"/":"/acceso?error=permisos",request.url).toString());
 return response;
}
