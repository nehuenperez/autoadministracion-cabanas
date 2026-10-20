import { useState } from 'react';
import { calcularSena, formatearMonto, formatearNumero, parsearMonto } from '../../utils/montos.js';
import { saldoPendiente, totalCobrado } from '../../utils/reservas.js';
import Tarjeta, { BotonEditar } from '../comunes/Tarjeta.jsx';
import CampoMonto from '../comunes/CampoMonto.jsx';
import BotonWhatsapp from '../reservas/BotonWhatsapp.jsx';

/**
 * Total, seña, cobrado y saldo. La seña se edita como porcentaje: el backend
 * calcula el monto (y descarta un monto de seña que venga del cliente).
 */
export default function EstadoDeCuentas({ reserva, titular, ocupado, onGuardarMontos }) {
  const [form, setForm] = useState(null); // null = no se está editando
  const cobrado = totalCobrado(reserva);
  const saldo = saldoPendiente(reserva);

  function empezarEdicion() {
    setForm({
      montoTotal: formatearNumero(reserva.montoTotal),
      porcentajeSena: String(Number(reserva.porcentajeSena || 0)),
    });
  }

  async function guardar() {
    const ok = await onGuardarMontos({
      montoTotal: parsearMonto(form.montoTotal),
      porcentajeSena: Number(form.porcentajeSena) || 0,
    });
    if (ok) setForm(null);
  }

  return (
    <Tarjeta
      titulo="Estado de Cuentas"
      accion={!form && reserva.estado !== 'Abortada' && <BotonEditar onClick={empezarEdicion}>⚙️ Editar montos</BotonEditar>}
      className="space-y-4"
    >
      {form ? (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-bold text-slate-500">Monto Total ($)</span>
              <CampoMonto value={form.montoTotal} onChange={(montoTotal) => setForm({ ...form, montoTotal })} className="p-2.5 text-xs font-bold" />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-500">Seña (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.porcentajeSena}
                onChange={(e) => setForm({ ...form, porcentajeSena: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
              />
            </label>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Seña requerida:{' '}
            <span className="font-bold text-slate-800">
              {formatearMonto(calcularSena(parsearMonto(form.montoTotal), form.porcentajeSena))}
            </span>
          </p>
          <div className="flex gap-2 text-xs font-bold pt-1.5">
            <button type="button" onClick={guardar} disabled={ocupado} className="flex-1 bg-emerald-600 text-white p-2 rounded-xl cursor-pointer shadow-xs disabled:bg-slate-300">
              Guardar Montos
            </button>
            <button type="button" onClick={() => setForm(null)} className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-slate-100 pb-3">
            <div>
              <span className="text-slate-400 block mb-0.5">Monto Total</span>
              <span className="text-base font-bold text-slate-900">{formatearMonto(reserva.montoTotal)}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Seña Requerida</span>
              <span className="text-base font-bold text-slate-700">{formatearMonto(reserva.montoSena)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Pagado hasta hoy</span>
              <span className="text-sm font-bold text-emerald-600">{formatearMonto(cobrado)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block mb-0.5">Saldo Pendiente</span>
              <span className={`text-base font-black ${saldo <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatearMonto(saldo)}</span>
            </div>
          </div>
        </>
      )}

      {titular?.telefono && (
        <BotonWhatsapp
          telefono={titular.telefono}
          mensaje={`Hola, *${titular.nombre}* 😊\n¡Los esperamos pronto en Aroma del Potrero 🌿!\n\nLes recordamos algunos detalles previos a su llegada:\n...`}
        />
      )}
    </Tarjeta>
  );
}
