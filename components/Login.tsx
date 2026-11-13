"use client";
import {useState} from "react";
import {browserAuth} from "@/lib/browser";
import {Mail,ArrowRight} from "lucide-react";
export function Login(){
 const [email,setEmail]=useState("pquedespiertan@gmail.com");
 const [sending,setSending]=useState(false);
 const [message,setMessage]=useState("");
 async function onSubmit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setSending(true);setMessage("");
  try{
   const {error}=await browserAuth().auth.signInWithOtp({email:email.trim(),
    options:{emailRedirectTo:window.location.origin+"/auth/callback",shouldCreateUser:false}});
   if(!error)setMessage("Enlace enviado. Revisa tu correo y utiliza el enlace más reciente desde este mismo navegador.");
   else if(error.status===429)setMessage("Se alcanzó el límite temporal de envíos. Comprueba tu correo antes de solicitar otro enlace.");
   else setMessage("No se pudo enviar el enlace. Comprueba la dirección o consulta con la dirección editorial.");
  }catch{setMessage("No se pudo contactar con el servicio de acceso.");}
  finally{setSending(false);}
 }
 return <form className="login-form" onSubmit={onSubmit}><label htmlFor="editor-email">Correo editorial autorizado</label><div className="input-icon"><Mail size={18}/><input id="editor-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div><button className="gold-button" disabled={sending} type="submit">{sending?"Enviando…":"Recibir mi acceso"}<ArrowRight size={17}/></button>{message&&<p className="form-message" role="status">{message}</p>}<small>Acceso exclusivo del equipo editorial autorizado. Las sesiones se verifican en Supabase.</small></form>;
}
