import { useState } from 'react';
import { formatearFecha } from '../../utils/fechas.js';
import { formatearMonto, parsearMonto } from '../../utils/montos.js';
import Tarjeta from '../comunes/Tarjeta.jsx';
import CampoMonto from '../comunes/CampoMonto.jsx';

/** Lista de cobros de la reserva y el formulario para registrar uno nuevo. */
export default function RegistroDeCobros({ pagos, ocupado, onRegistrar, onEliminar }) {
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  async function registrar(e) {
    e.preventDefault();
    const valor = parsearMonto(monto);
    if (valor <= 0) return;
    if (await onRegistrar({ monto: valor, metodoPago })) {
      setMonto('');
      setMetodoPago('Efectivo');
    }
  }

  return (
    <Tarjeta titulo="Registro de Cobros" className="space-y-4">
      {pagos.length === 0 ? (
        <p className="text-xs font-medium text-slate-400 bg-slate-50/50 p-3 rounded-lg text-center border border-dashed border-slate-200">
          No hay pagos registrados aún.
        </p>
      ) : (
        <div className="space-y-1.5">
          {pagos.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold">
              <div>
                <p className="font-bold text-slate-800">{formatearMonto(p.monto)}</p>
                <p className="text-[10px] text-slate-400 font-medium">{formatearFecha(p.fecha)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px] uppercase font-bold text-slate-500">
                  {p.metodoPago}
                </span>
                <button
                  type="button"
                  onClick={() => onEliminar(p.id)}
                  disabled={ocupado}
                  aria-label="Borrar cobro"
                  className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg transition text-xs cursor-pointer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={registrar} className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
        <CampoMonto placeholder="Monto a cobrar ($)" value={monto} onChange={setMonto} className="p-2.5" />
        <div className="flex gap-2">
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="p-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/50"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
          </select>
          <button
            type="submit"
            disabled={ocupado || parsearMonto(monto) <= 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer disabled:bg-slate-300"
          >
            Registrar Cobro
          </button>
        </div>
      </form>
    </Tarjeta>
  );
}
