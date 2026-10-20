import { NavLink } from 'react-router-dom';

const SECCIONES = [
  { ruta: '/', icono: '🗓️', texto: 'Calendario' },
  { ruta: '/reservas-anteriores', icono: '📚', texto: 'Historial' },
  { ruta: '/estadisticas', icono: '📊', texto: 'Informes' },
];

/** Barra de navegación fija de abajo, con la sección actual resaltada. */
export default function NavegacionInferior() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 flex justify-around items-center z-30 shadow-lg">
      {SECCIONES.map(({ ruta, icono, texto }) => (
        <NavLink
          key={ruta}
          to={ruta}
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`
          }
        >
          <span className="text-lg">{icono}</span>
          <span className="text-[9px] font-bold tracking-tight">{texto}</span>
        </NavLink>
      ))}
    </nav>
  );
}
