import Link from "next/link";
import Image from "next/image";
import {LayoutDashboard,BookOpen,MessageSquareQuote,CalendarDays,Users,History,Link2,ExternalLink,ShieldCheck,Library,Settings,SunMoon,BarChart3,PlugZap} from "lucide-react";
const links=[
 {href:"/",label:"Centro de mando",Icon:LayoutDashboard},
 {href:"/#publicaciones",label:"Publicaciones",Icon:Library},
 {href:"/estructura",label:"Temporadas y series",Icon:BookOpen},
 {href:"/biblioteca",label:"Biblioteca gráfica",Icon:SunMoon},
 {href:"/comunidad",label:"Comunidad",Icon:Users},
 {href:"/calendario",label:"Calendario",Icon:CalendarDays},
 {href:"/estadisticas",label:"Estadísticas",Icon:BarChart3},
 {href:"/enlaces",label:"Enlaces para redes",Icon:Link2},
 {href:"/integraciones",label:"Integraciones",Icon:PlugZap},
 {href:"/auditoria",label:"Auditoría",Icon:History}
];
export function Shell({children,email,section}:{children:React.ReactNode;email:string;section:string}){
 return <div className="layout">
  <aside className="sidebar">
   <Link href="/" className="identity">
    <span className="identity-symbol">✝</span><span><strong>PALABRAS <i>QUE</i><br/>DESPIERTAN</strong><small>CENTRO EDITORIAL</small></span>
   </Link>
   <div className="sidebar-rule"/>
   <div className="sidebar-caption">DIRECCIÓN Y PUBLICACIÓN</div>
   <nav className="nav" aria-label="Navegación principal">{links.map(({href,label,Icon})=><Link className={section===label?"active":""} href={href} key={href}><Icon size={19}/><span>{label}</span></Link>)}</nav>
   <div className="sidebar-bottom"><Image src="/portada-oficial.png" width={82} height={120} alt="Portada editorial oficial" className="sidebar-cover"/>
    <p><strong>La fe que se piensa<br/>y se hace vida.</strong><br/><span>Una sola línea editorial.</span></p>
    <a href="https://www.palabrasquedespiertan.online" target="_blank" rel="noopener noreferrer" className="site-shortcut">Abrir la revista <ExternalLink size={14}/></a>
   </div>
  </aside>
  <div className="content-column">
   <header className="topbar"><div><span className="topbar-eyebrow">PALABRAS QUE DESPIERTAN</span><span className="topbar-slash">/</span><span className="topbar-current">{section}</span></div>
    <div className="user-chip"><ShieldCheck size={16}/><span>{email}</span><span className="user-avatar">JE</span></div>
   </header>
   <main className="workspace">{children}</main>
   <footer className="workspace-footer">PALABRAS QUE DESPIERTAN <span>·</span> Dirección editorial — P. Jaider Herrera Turizo <span>·</span> América/Bogotá</footer>
  </div>
 </div>;
}
