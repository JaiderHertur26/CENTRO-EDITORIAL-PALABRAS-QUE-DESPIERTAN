import "server-only";
import {editorialAdmin} from "./supabase";
export type EditorialItem={
 id:string;kind:"articulo"|"mensaje"|"tema";code:string;slug:string;title:string;subtitle:string;
 summary:string;body?:string;state:"pending"|"scheduled"|"published";scheduled_at:string|null;
 published_at:string|null;approved_by_author:boolean;social_state:string;season:string|null;
 series:string|null;social_scheduled_at:string|null;cover_url:string|null;featured:boolean;position:number;updated_at:string;
 bible_reference:string;source_url:string|null;
};
export async function itemsList():Promise<EditorialItem[]>{
 const client=editorialAdmin();
 const {data,error}=await client.from("editorial_items").select(
  "id,kind,code,slug,title,subtitle,summary,state,scheduled_at,published_at,approved_by_author,social_state,season,series,social_scheduled_at,cover_url,featured,position,updated_at,bible_reference,source_url"
 ).order("kind",{ascending:true}).order("position",{ascending:true});
 if(error)throw Error("No fue posible cargar el catálogo editorial: "+error.code);
 return data as EditorialItem[];
}
export async function communityData(){
 const admin=editorialAdmin();
 const [comments,reports,audit,users]=await Promise.all([
  admin.from("discussion_entries").select("id,subject_type,subject_id,parent_id,display_name,body,created_at,status,author_id,reviewed_at").order("created_at",{ascending:false}).limit(100),
  admin.from("discussion_reports").select("id,entry_id,reporter_id,motive,details,created_at,resolved").order("created_at",{ascending:false}).limit(100),
  admin.from("editorial_audit").select("id,item_id,actor_id,action,old_state,new_state,change_note,changed_at").order("changed_at",{ascending:false}).limit(100),
  admin.auth.admin.listUsers({page:1,perPage:200})
 ]);
 if(comments.error||reports.error||audit.error||users.error)throw Error("No se pudieron consultar los datos de la comunidad");
 const people=(users.data.users??[]).map(u=>({id:u.id,email:u.email??"",verified:!!u.email_confirmed_at,joined:u.created_at,lastLogin:u.last_sign_in_at??null}));
 return {comments:comments.data??[],reports:reports.data??[],audit:audit.data??[],people};
}
export function visibleNow(item:EditorialItem){
 return item.state==="published"||(item.state==="scheduled"&&!!item.scheduled_at&&new Date(item.scheduled_at).getTime()<=Date.now());
}

export async function communityStats(){
 const admin=editorialAdmin();
 const [comments,reports]=await Promise.all([
  admin.from("discussion_entries").select("id",{head:true,count:"exact"}),
  admin.from("discussion_reports").select("id",{head:true,count:"exact"}).eq("resolved",false)
 ]);
 if(comments.error||reports.error)throw Error("No se pudieron cargar las métricas de comunidad");
 return {commentCount:comments.count??0,reportCount:reports.count??0};
}
export async function auditHistory(){
 const admin=editorialAdmin();
 const {data,error}=await admin.from("editorial_audit")
  .select("id,item_id,actor_id,action,old_state,new_state,change_note,changed_at")
  .order("changed_at",{ascending:false}).limit(100);
 if(error)throw Error("No fue posible consultar la auditoría editorial");
 return data??[];
}
