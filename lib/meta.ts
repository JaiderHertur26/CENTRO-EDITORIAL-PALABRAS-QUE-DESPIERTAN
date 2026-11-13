import "server-only";
import {sessionClient} from "./supabase";
export type MetaPublication={
 code:string;title:string;body:string;bible_reference:string;
 canonical_url:string;state:"published"|"pending"|"scheduled";
 scheduled_at:string|null;social_scheduled_at:string|null;
 social_state:string;source_url:string|null;
};
export async function metaPublications():Promise<MetaPublication[]>{
 const client=await sessionClient();
 if(!client)throw Error("Acceso editorial no identificado");
 const {data,error}=await client.rpc("editorial_meta_export");
 if(error||!Array.isArray(data))throw Error("No se pudo preparar la carpeta de difusión");
 return data as MetaPublication[];
}
export function captionForMeta(item:MetaPublication):string{
 const body=item.body.trim();
 return [item.code+" · "+item.title,"",body,"",
  item.bible_reference?"Fundamento bíblico: "+item.bible_reference:"",
  "P. Jaider Herrera Turizo","",
  "LEE Y COMENTA EN LA REVISTA:",item.canonical_url,"",
  "#PalabrasQueDespiertan #FeCatólica #Oración"
 ].filter(x=>x!==undefined).join("\n").trim();
}
