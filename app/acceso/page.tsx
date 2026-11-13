import {Login} from "@/components/Login";
import Image from "next/image";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Acceso privado"};
export default function Acceso(){
 return <main className="login-root"><div className="login-left"><div className="login-brand"><span>✝</span> PALABRAS <em>QUE</em> DESPIERTAN</div>
  <div className="login-message"><p className="kicker">CENTRO EDITORIAL · ACCESO RESTRINGIDO</p>
   <h1>La palabra se cuida <em>antes de despertar.</em></h1>
   <p>Un lugar para preparar, publicar y acompañar con responsabilidad todo aquello que ofrecemos a nuestros lectores.</p>
  </div><Image src="/portada-oficial.png" width={270} height={405} alt="Portada oficial con brote dorado" className="login-cover"/>
  <div className="login-foot">Dirección editorial · Palabras que despiertan</div></div>
  <div className="login-right"><div className="login-box"><span className="login-cross">✝</span><p className="kicker">IDENTIFICACIÓN SEGURA</p><h2>Bienvenido al<br/>Centro Editorial.</h2><p>Accede con el correo autorizado de dirección. Recibirás un enlace personal de un solo uso; no necesitas contraseña.</p><Login/></div></div>
 </main>
}
