import { useState } from 'react';
import { Banknote, Landmark, Trash2 } from 'lucide-react';
import { formatearDiaCorto } from '../../utils/fechas.js';
import { formatearMonto, formatearNumero, parsearMonto } from '../../utils/montos.js';
import Tarjeta from '../comunes/Tarjeta.jsx';
import Campo from '../comunes/Campo.jsx';
import CampoMonto from '../comunes/CampoMonto.jsx';
import ControlSegmentado from '../comunes/ControlSegmentado.jsx';
import Boton from '../comunes/Boton.jsx';

const MEDIOS = [
  { valor: 'Efectivo', texto: 'Efectivo' },
  { valor: 'Transferencia', texto: 'Transferencia' },
];

/** Los cobros de la reserva y el formulario para registrar uno nuevo. */
export default function RegistroDeCobros({ pagos, saldo, ocupado, onRegistrar, onEliminar }) {
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
    <Tarjeta titulo="Cobros">
      {pagos.length === 0 ? (
        <p className="text-[15px] text-slate-500">Todavía no se registró ningún cobro.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pagos.map((p) => {
            const Icono = p.metodoPago === 'Transferencia' ? Landmark : Banknote;
            return (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="size-10 shrink-0 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900 tabular-nums">{formatearMonto(p.monto)}</p>
                  <p className="text-sm text-slate-500 first-letter:uppercase">
                    {p.metodoPago}, {formatearDiaCorto(p.fecha)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminar(p.id)}
                  disabled={ocupado}
                  aria-label={`Borrar el cobro de ${formatearMonto(p.monto)}`}
                  className="size-11 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={registrar} className="space-y-3 pt-4 border-t border-slate-100">
        <Campo rotulo="Nuevo cobro">
          <CampoMonto placeholder="Monto" value={monto} onChange={setMonto} />
        </Campo>
        {saldo > 0 && parsearMonto(monto) !== saldo && (
          <Boton variante="suave" tamano="chico" onClick={() => setMonto(formatearNumero(saldo))}>
            Completar con el saldo: {formatearMonto(saldo)}
          </Boton>
        )}
        <ControlSegmentado etiqueta="Medio de pago" opciones={MEDIOS} valor={metodoPago} onCambiar={setMetodoPago} />
        <Boton type="submit" variante="exito" ancho disabled={ocupado || parsearMonto(monto) <= 0}>
          Registrar cobro
        </Boton>
      </form>
    </Tarjeta>
  );
}
