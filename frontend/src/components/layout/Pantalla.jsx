import NavegacionInferior from './NavegacionInferior.jsx';

/**
 * Estructura común de las pantallas: encabezado fijo arriba, contenido al
 * ancho de un celular y, en las secciones principales, la barra de navegación
 * abajo. El margen inferior deja lugar a la barra y a los botones flotantes.
 */
export default function Pantalla({ encabezado, conNavegacion = false, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {encabezado}
      <main className={`max-w-md mx-auto px-4 pt-4 space-y-4 ${conNavegacion ? 'pb-32' : 'pb-24'}`}>{children}</main>
      {conNavegacion && <NavegacionInferior />}
    </div>
  );
}
