import {NextResponse,type NextRequest} from "next/server";
import {createServerClient} from "@supabase/ssr";
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
 if(url!=="https://lwuzkjvolxwkxdyafcjv.supabase.co"||!key.startsWith("sb_publishable_"))return response;
 const client=createServerClient(url,key,{cookies:{
  getAll(){return request.cookies.getAll();},
  setAll(values){
   values.forEach(({name,value})=>request.cookies.set(name,value));
   response=NextResponse.next({request});
   values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  }
 }});
 await client.auth.getUser();
 response.headers.set("Cache-Control","private, no-store");
 return response;
}
export const config={matcher:["/","/publicaciones/:path*","/comunidad/:path*","/calendario/:path*","/auditoria/:path*","/api/:path*","/acceso"]};
