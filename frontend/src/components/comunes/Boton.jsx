import { Link } from 'react-router-dom';
import { clasesDeBoton } from '../../utils/estilos.js';

function Contenido({ icono: Icono, tamano, children }) {
  return (
    <>
      {Icono && <Icono className={`shrink-0 ${tamano === 'chico' ? 'size-4' : 'size-5'}`} aria-hidden="true" />}
      {children}
    </>
  );
}

/**
 * Botón de la app. `variante`: primario, exito, secundario, suave, peligro o
 * fantasma. `icono` es un componente de lucide-react que va antes del texto.
 */
export default function Boton({ variante, tamano, ancho, icono, className, children, type = 'button', ...resto }) {
  return (
    <button type={type} className={clasesDeBoton({ variante, tamano, ancho, className })} {...resto}>
      <Contenido icono={icono} tamano={tamano}>{children}</Contenido>
    </button>
  );
}

/** Un enlace de navegación con aspecto de botón. */
export function BotonEnlace({ variante, tamano, ancho, icono, className, children, ...resto }) {
  return (
    <Link className={clasesDeBoton({ variante, tamano, ancho, className })} {...resto}>
      <Contenido icono={icono} tamano={tamano}>{children}</Contenido>
    </Link>
  );
}
