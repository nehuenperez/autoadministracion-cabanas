import { useState } from 'react';
import { NOMBRES_MESES, deISO, diasDelMes, formatearDia, sumarDias } from '../../utils/fechas.js';
import SelectorDeMes from '../comunes/SelectorDeMes.jsx';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/** ¿Alguna reserva ocupa la noche de `fecha`? (del ingreso inclusive al egreso exclusive) */
function nocheOcupada(fecha, ocupadas) {
  return ocupadas.some((r) => fecha >= r.fechaCheckIn && fecha < r.fechaCheckOut);
}

/** ¿Están libres todas las noches entre `desde` (inclusive) y `hasta` (exclusive)? */
function rangoLibre(desde, hasta, ocupadas) {
  for (let fecha = desde; fecha < hasta; fecha = sumarDias(fecha, 1)) {
    if (nocheOcupada(fecha, ocupadas)) return false;
  }
  return true;
}

/**
 * Calendario para elegir la estadía: se toca el día de ingreso y después el de
 * salida. Los días con la noche tomada no se pueden elegir. El día en que entra
 * otra reserva sí sirve como salida: uno se va a la mañana y el otro llega a la
 * tarde.
 */
export default function SelectorDeFechas({ ocupadas, checkIn, checkOut, onCambiar, onError }) {
  const [mes, setMes] = useState(() => {
    const base = checkIn ? deISO(checkIn) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const eligiendoSalida = Boolean(checkIn && !checkOut);

  function seleccionar(fecha) {
    onError('');
    if (!eligiendoSalida || fecha <= checkIn) {
      onCambiar({ checkIn: fecha, checkOut: '' });
    } else if (!rangoLibre(checkIn, fecha, ocupadas)) {
      onError('Entre esas fechas hay otra reserva. Elegí otro día de salida.');
    } else {
      onCambiar({ checkIn, checkOut: fecha });
    }
  }

  return (
    <div className="space-y-2">
      <SelectorDeMes
        titulo={`${NOMBRES_MESES[mes.getMonth()]} ${mes.getFullYear()}`}
        onCambiar={(salto) => setMes(new Date(mes.getFullYear(), mes.getMonth() + salto, 1))}
      />

      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500" aria-hidden="true">
        {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {diasDelMes(mes.getFullYear(), mes.getMonth()).map((fecha, i) => {
          if (!fecha) return <div key={`vacio-${i}`} />;

          const sirveDeSalida = eligiendoSalida && fecha > checkIn && rangoLibre(checkIn, fecha, ocupadas);
          const bloqueado = nocheOcupada(fecha, ocupadas) && fecha !== checkOut && !sirveDeSalida;
          const extremo = fecha === checkIn || fecha === checkOut;
          const dentro = checkIn && checkOut && fecha > checkIn && fecha < checkOut;

          let clases = 'text-slate-800 hover:bg-slate-100 rounded-lg';
          if (bloqueado) clases = 'text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed';
          else if (extremo) clases = 'bg-slate-900 text-white font-semibold rounded-lg';
          else if (dentro) clases = 'bg-slate-200 text-slate-900';

          return (
            <button
              type="button"
              key={fecha}
              disabled={bloqueado}
              onClick={() => seleccionar(fecha)}
              aria-pressed={extremo}
              aria-label={`${formatearDia(fecha)}${bloqueado ? ', ocupado' : ''}`}
              className={`min-h-11 text-[15px] tabular-nums flex items-center justify-center transition-colors cursor-pointer ${clases}`}
            >
              {Number(fecha.slice(8))}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-slate-500 text-center" aria-live="polite">
        {eligiendoSalida ? 'Ahora tocá el día de salida.' : 'Tocá el día de ingreso y después el de salida.'}
      </p>
    </div>
  );
}
