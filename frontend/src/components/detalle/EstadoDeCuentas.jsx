import { useState } from 'react';
import { calcularSena, formatearMonto, formatearNumero, parsearMonto } from '../../utils/montos.js';
import { saldoPendiente, totalCobrado } from '../../utils/reservas.js';
import { claseDeCampo } from '../../utils/estilos.js';
import Tarjeta, { BotonEditar } from '../comunes/Tarjeta.jsx';
import Campo from '../comunes/Campo.jsx';
import CampoMonto from '../comunes/CampoMonto.jsx';
import Boton from '../comunes/Boton.jsx';

function Renglon({ rotulo, valor, destacado = false }) {
  return (
    <div className="flex justify-between items-baseline gap-3 py-1.5">
      <dt className="text-[15px] text-slate-600">{rotulo}</dt>
      <dd className={`text-[15px] tabular-nums ${destacado ? 'font-semibold text-emerald-700' : 'font-medium text-slate-900'}`}>{valor}</dd>
    </div>
  );
}

/**
 * Total, seña, cobrado y saldo. La seña se edita como porcentaje: el backend
 * calcula el monto (y descarta un monto de seña que venga del cliente).
 */
export default function EstadoDeCuentas({ reserva, ocupado, onGuardarMontos }) {
  const [form, setForm] = useState(null); // null = no se está editando
  const total = Number(reserva.montoTotal) || 0;
  const cobrado = totalCobrado(reserva);
  const saldo = saldoPendiente(reserva);
  const porcentajeCobrado = total > 0 ? Math.min(100, (cobrado / total) * 100) : 100;

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
      titulo="Cuentas"
      accion={!form && reserva.estado !== 'Abortada' && <BotonEditar onClick={empezarEdicion}>Cambiar montos</BotonEditar>}
    >
      {form ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Total">
              <CampoMonto value={form.montoTotal} onChange={(montoTotal) => setForm({ ...form, montoTotal })} />
            </Campo>
            <Campo rotulo="Seña (%)">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                value={form.porcentajeSena}
                onChange={(e) => setForm({ ...form, porcentajeSena: e.target.value })}
                className={claseDeCampo}
              />
            </Campo>
          </div>
          <p className="text-[15px] text-slate-600">
            Seña: <span className="font-semibold text-slate-900 tabular-nums">{formatearMonto(calcularSena(parsearMonto(form.montoTotal), form.porcentajeSena))}</span>
          </p>
          <div className="flex gap-2">
            <Boton ancho onClick={guardar} disabled={ocupado}>Guardar montos</Boton>
            <Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {saldo > 0 ? (
              <p className="text-sm text-slate-500">
                Falta cobrar
                <span className="block text-3xl font-bold text-rose-700 tabular-nums">{formatearMonto(saldo)}</span>
              </p>
            ) : (
              <p className="text-xl font-semibold text-emerald-700">Pagada en su totalidad</p>
            )}
            <div
              className="h-2 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Cobrado del total"
              aria-valuenow={Math.round(porcentajeCobrado)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${porcentajeCobrado}%` }} />
            </div>
          </div>
          <dl className="divide-y divide-slate-100">
            <Renglon rotulo="Total de la estadía" valor={formatearMonto(reserva.montoTotal)} />
            <Renglon
              rotulo={Number(reserva.porcentajeSena) > 0 ? `Seña (${Number(reserva.porcentajeSena)}%)` : 'Seña'}
              valor={Number(reserva.montoSena) > 0 ? formatearMonto(reserva.montoSena) : 'Sin seña'}
            />
            <Renglon rotulo="Cobrado" valor={formatearMonto(cobrado)} destacado />
          </dl>
        </>
      )}
    </Tarjeta>
  );
}
