import NavegacionInferior from './NavegacionInferior.jsx';

/**
 * Estructura común de las pantallas: fondo, encabezado fijo arriba, contenido
 * centrado a lo ancho de un celular y, en las secciones principales, la barra
 * de navegación abajo.
 */
export default function Pantalla({ encabezado, conNavegacion = false, children }) {
  return (
    <div className={`min-h-screen bg-[#f8fafc] text-slate-800 antialiased ${conNavegacion ? 'pb-24' : 'pb-16'}`}>
      {encabezado}
      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">{children}</main>
      {conNavegacion && <NavegacionInferior />}
    </div>
  );
}
