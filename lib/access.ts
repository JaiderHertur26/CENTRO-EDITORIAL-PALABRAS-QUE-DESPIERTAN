import "server-only";
import {redirect} from "next/navigation";
import {verifyEditor} from "./supabase";
export async function requireEditor(){
 const user=await verifyEditor();
 if(!user)redirect("/acceso");
 return user;
}
