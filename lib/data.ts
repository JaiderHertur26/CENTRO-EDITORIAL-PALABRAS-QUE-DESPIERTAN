import "server-only";
import {sessionClient} from "./supabase";
export type EditorialItem={
 id:string;kind:"articulo"|"mensaje"|"tema";code:string;slug:string;title:string;subtitle:string;
 summary:string;body?:string;state:"pending"|"scheduled"|"published";scheduled_at:string|null;
 published_at:string|null;approved_by_author:boolean;social_state:string;season:string|null;
 series:string|null;social_scheduled_at:string|null;cover_url:string|null;featured:boolean;position:number;updated_at:string;
 bible_reference:string;source_url:string|null;
};
async function editorialRead(resource:"items"|"community"|"counts"|"audit",id?:string){
 const client=await sessionClient();
 if(!client)throw Error("Inicia sesión para consultar la dirección editorial");
 const {data,error}=await client.rpc("editorial_read",{p_resource:resource,p_id:id||null});
 if(error)throw Error("No se pudo consultar el Centro Editorial: "+(error.code||"acceso"));
 return data;
}
export async function itemsList():Promise<EditorialItem[]>{
 return await editorialRead("items") as EditorialItem[];
}
export async function communityData(){
 return await editorialRead("community") as {
  comments:Array<{id:string;subject_type:string;subject_id:string;parent_id:string|null;display_name:string;body:string;created_at:string;status:string;author_id:string;reviewed_at:string|null}>;
  reports:Array<{id:string;entry_id:string;reporter_id:string;motive:string;details:string|null;created_at:string;resolved:boolean}>;
  audit:Array<{id:number;item_id:string;actor_id:string|null;action:string;old_state:string|null;new_state:string|null;change_note:string|null;changed_at:string}>;
  people:Array<{id:string;email:string;verified:boolean;joined:string;lastLogin:string|null}>;
 };
}
export function visibleNow(item:EditorialItem){
 return item.state==="published"||(item.state==="scheduled"&&!!item.scheduled_at&&new Date(item.scheduled_at).getTime()<=Date.now());
}
export async function communityStats(){
 return await editorialRead("counts") as {commentCount:number;reportCount:number};
}
export async function auditHistory(){
 return await editorialRead("audit") as Array<{
  id:number;item_id:string;actor_id:string|null;action:string;old_state:string|null;new_state:string|null;
  change_note:string|null;changed_at:string;
 }>;
}
