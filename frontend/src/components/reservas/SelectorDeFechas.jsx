import { useState } from 'react';
import { NOMBRES_MESES, deISO, diasDelMes, sumarDias } from '../../utils/fechas.js';
import SelectorDeMes from '../comunes/SelectorDeMes.jsx';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

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
 * egreso. Los días con la noche tomada aparecen tachados. El día en que entra
 * otra reserva sí se puede elegir como egreso: uno se va a la mañana y el otro
 * llega a la tarde.
 */
export default function SelectorDeFechas({ ocupadas, checkIn, checkOut, onCambiar, onError }) {
  const [mes, setMes] = useState(() => {
    const base = checkIn ? deISO(checkIn) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const eligiendoEgreso = Boolean(checkIn && !checkOut);

  function seleccionar(fecha) {
    onError('');
    if (!eligiendoEgreso || fecha <= checkIn) {
      onCambiar({ checkIn: fecha, checkOut: '' });
    } else if (!rangoLibre(checkIn, fecha, ocupadas)) {
      onError('⚠️ El rango seleccionado se superpone con una reserva existente.');
    } else {
      onCambiar({ checkIn, checkOut: fecha });
    }
  }

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3 animate-aparecer">
      <SelectorDeMes
        compacto
        titulo={`${NOMBRES_MESES[mes.getMonth()]} ${mes.getFullYear()}`}
        onCambiar={(salto) => setMes(new Date(mes.getFullYear(), mes.getMonth() + salto, 1))}
      />

      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5">
        {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {diasDelMes(mes.getFullYear(), mes.getMonth()).map((fecha, i) => {
          if (!fecha) return <div key={`vacio-${i}`} className="p-2" />;

          const sirveDeEgreso = eligiendoEgreso && fecha > checkIn && rangoLibre(checkIn, fecha, ocupadas);
          const bloqueado = nocheOcupada(fecha, ocupadas) && fecha !== checkOut && !sirveDeEgreso;
          const extremo = fecha === checkIn || fecha === checkOut;
          const dentro = checkIn && checkOut && fecha > checkIn && fecha < checkOut;

          let clases = 'text-slate-700 hover:bg-slate-100 font-medium rounded-lg cursor-pointer';
          if (bloqueado) clases = 'text-slate-300 line-through bg-slate-50/70 cursor-not-allowed';
          else if (extremo) clases = 'bg-blue-600 text-white font-bold rounded-lg shadow-xs scale-105';
          else if (dentro) clases = 'bg-blue-50 text-blue-700 font-semibold rounded-none';

          return (
            <button
              type="button"
              key={fecha}
              disabled={bloqueado}
              onClick={() => seleccionar(fecha)}
              className={`p-2.5 text-center text-xs flex items-center justify-center min-h-9.5 transition-all duration-150 ${clases}`}
            >
              {Number(fecha.slice(8))}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 font-medium text-center pt-1">
        {eligiendoEgreso ? 'Ahora tocá el día de egreso.' : 'Tocá el día de ingreso y luego el de egreso.'}
      </p>
    </div>
  );
}
