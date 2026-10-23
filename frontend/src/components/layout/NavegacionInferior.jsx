import { NavLink } from 'react-router-dom';
import { CalendarDays, ChartColumn, History } from 'lucide-react';

const SECCIONES = [
  { ruta: '/', Icono: CalendarDays, texto: 'Calendario' },
  { ruta: '/reservas-anteriores', Icono: History, texto: 'Historial' },
  { ruta: '/estadisticas', Icono: ChartColumn, texto: 'Informes' },
];

/** Barra de navegación fija de abajo, con la sección actual resaltada. */
export default function NavegacionInferior() {
  return (
    <nav aria-label="Secciones" className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-seguro">
      <div className="max-w-md mx-auto grid grid-cols-3 px-2 pt-1.5">
        {SECCIONES.map(({ ruta, Icono, texto }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-h-14 justify-center rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`px-5 py-1 rounded-full transition-colors ${isActive ? 'bg-slate-900 text-white' : ''}`}>
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                {texto}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
