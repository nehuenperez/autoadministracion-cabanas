import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { titularDe } from '../../utils/reservas.js';

/**
 * Una reserva en una lista, que lleva a su detalle al tocarla.
 *   Icono / colorIcono: qué pasa (entra, sale, hay que cobrar)
 *   detalle:            la línea de abajo (cabaña, fechas)
 *   insignia:           una etiqueta debajo del detalle (el estado de cobro)
 *   extra:              lo de la derecha (un monto)
 * El nombre nunca se corta: en un celular angosto pasa al renglón siguiente.
 */
export default function FilaDeReserva({ reserva, icono: Icono, colorIcono, detalle, insignia, extra }) {
  const navigate = useNavigate();
  const titular = titularDe(reserva);

  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/reservas/${reserva.id}`)}
        className="w-full flex items-center gap-3 min-h-14 py-2 -mx-2 px-2 text-left rounded-xl hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
      >
        {Icono && (
          <span className={`size-10 shrink-0 rounded-full flex items-center justify-center ${colorIcono}`}>
            <Icono className="size-5" aria-hidden="true" />
          </span>
        )}
        <span className="flex-1 min-w-0 space-y-0.5">
          <span className={`block text-[15px] font-semibold leading-snug ${titular ? 'text-slate-900' : 'text-amber-700'}`}>
            {titular ? `${titular.nombre} ${titular.apellido}` : 'Falta cargar el titular'}
          </span>
          {detalle && <span className="block text-sm text-slate-500 leading-snug">{detalle}</span>}
          {insignia && <span className="block pt-1">{insignia}</span>}
        </span>
        {extra}
        <ChevronRight className="size-5 text-slate-400 shrink-0" aria-hidden="true" />
      </button>
    </li>
  );
}
