import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={
 title:{default:"Centro Editorial · Palabras que despiertan",template:"%s · Centro Editorial"},
 description:"Gestión privada de publicaciones, investigación teológica, testimonios y comunidad.",
 robots:{index:false,follow:false,nocache:true},
 icons:{icon:"/cruz-fondo.png"}
};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="es-CO"><body>{children}</body></html>;
}
