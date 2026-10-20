import { useState } from 'react';
import { formatearFecha } from '../../utils/fechas.js';
import { BotonEditar } from '../comunes/Tarjeta.jsx';

const campoFecha = 'w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold';

/** Cabaña y fechas de la estadía, con la franja del color del semáforo. */
export default function TarjetaAlojamiento({ reserva, colorDeBorde, ocupado, onGuardarFechas }) {
  const [fechas, setFechas] = useState(null); // null = no se está editando

  async function guardar() {
    if (await onGuardarFechas(fechas)) setFechas(null);
  }

  return (
    <section className={`bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 border-l-4 ${colorDeBorde} space-y-3`}>
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Alojamiento</span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{reserva.Cabana?.nombre}</h2>
        </div>
        {!fechas && reserva.estado !== 'Abortada' && (
          <BotonEditar onClick={() => setFechas({ fechaCheckIn: reserva.fechaCheckIn, fechaCheckOut: reserva.fechaCheckOut })}>
            ⚙️ Editar fechas
          </BotonEditar>
        )}
      </div>

      {fechas ? (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-bold text-slate-500">Nuevo Check-In</span>
              <input type="date" value={fechas.fechaCheckIn} onChange={(e) => setFechas({ ...fechas, fechaCheckIn: e.target.value })} className={campoFecha} />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-500">Nuevo Check-Out</span>
              <input type="date" value={fechas.fechaCheckOut} onChange={(e) => setFechas({ ...fechas, fechaCheckOut: e.target.value })} className={campoFecha} />
            </label>
          </div>
          <div className="flex gap-2 text-xs font-bold pt-1">
            <button type="button" onClick={guardar} disabled={ocupado} className="flex-1 bg-blue-600 text-white p-2 rounded-xl cursor-pointer shadow-xs disabled:bg-slate-300">
              Guardar Cambios
            </button>
            <button type="button" onClick={() => setFechas(null)} className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3.5 border-t border-slate-100 text-xs">
          <div>
            <p className="font-semibold text-slate-400 mb-0.5">Check-In</p>
            <p className="font-bold text-slate-700 text-sm">{formatearFecha(reserva.fechaCheckIn)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 mb-0.5">Check-Out</p>
            <p className="font-bold text-slate-700 text-sm">{formatearFecha(reserva.fechaCheckOut)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
