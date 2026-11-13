import "server-only";
import {sessionClient} from "./supabase";

export type VisitKind="inicio"|"seccion"|"articulo"|"mensaje"|"testimonio";
export type VisitStats={
 periodDays:number;views:number;allTime:number;today:number;last7:number;
 from:string;to:string;firstDate:string|null;
 daily:{date:string;views:number}[];
 categories:{kind:VisitKind;label:string;views:number}[];
 top:{kind:VisitKind;code:string;title:string;href:string;views:number}[];
 sections:{title:string;href:string;views:number}[];
};
export async function readVisitStats(days:7|30|90=30):Promise<VisitStats>{
 const supabase=await sessionClient();
 if(!supabase)throw Error("Necesitas iniciar sesión en el Centro Editorial");
 const {data:{session},error}=await supabase.auth.getSession();
 if(error||!session?.access_token)throw Error("La sesión editorial no está disponible");
 const response=await fetch("https://www.palabrasquedespiertan.online/api/visitas?dias="+days,{
  headers:{"Authorization":"Bearer "+session.access_token},cache:"no-store"
 });
 if(!response.ok)throw Error("No se pudieron consultar las estadísticas ("+response.status+")");
 const report=await response.json() as VisitStats;
 if(typeof report.views!=="number"||!Array.isArray(report.categories)||!Array.isArray(report.daily))
  throw Error("Respuesta de estadísticas inválida");
 return report;
}
