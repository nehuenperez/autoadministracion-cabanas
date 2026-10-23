import { LogIn, LogOut, Wallet } from 'lucide-react';
import { cobrosPendientes, movimientosDelDia } from '../../utils/agenda.js';
import { formatearDiaCorto, formatearNoches, sumarDias } from '../../utils/fechas.js';
import { formatearMonto } from '../../utils/montos.js';
import { saldoPendiente } from '../../utils/reservas.js';
import FilaDeReserva from './FilaDeReserva.jsx';

const MOVIMIENTO = {
  entra: { Icono: LogIn, color: 'bg-emerald-50 text-emerald-700', verbo: 'Entra' },
  sale: { Icono: LogOut, color: 'bg-slate-100 text-slate-600', verbo: 'Sale' },
};

function Grupo({ titulo, vacio, filas }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-slate-500">{titulo}</h3>
      {filas.length === 0 ? <p className="text-[15px] text-slate-500 py-2">{vacio}</p> : <ul>{filas}</ul>}
    </div>
  );
}

function filasDeMovimientos(fecha, reservas) {
  return movimientosDelDia(fecha, reservas).map(({ tipo, reserva }) => {
    const { Icono, color, verbo } = MOVIMIENTO[tipo];
    const cabana = reserva.Cabana?.nombre ?? 'la cabaña';
    const noches = tipo === 'entra' ? `, ${formatearNoches(reserva.fechaCheckIn, reserva.fechaCheckOut)}` : '';
    return (
      <FilaDeReserva
        key={`${tipo}-${reserva.id}`}
        reserva={reserva}
        icono={Icono}
        colorIcono={color}
        detalle={`${verbo} en ${cabana}${noches}`}
      />
    );
  });
}

/**
 * Lo que hay que atender sin buscar en el calendario: quién entra y quién sale
 * hoy y mañana en todas las cabañas, y a quién falta cobrarle.
 */
export default function ResumenDelDia({ reservas, hoy }) {
  const manana = sumarDias(hoy, 1);

  const porCobrar = cobrosPendientes(reservas, hoy).map((reserva) => {
    const verbo = reserva.fechaCheckIn < hoy ? 'entró' : 'entra';
    return (
      <FilaDeReserva
        key={`cobro-${reserva.id}`}
        reserva={reserva}
        icono={Wallet}
        colorIcono="bg-amber-50 text-amber-700"
        detalle={`${reserva.Cabana?.nombre ?? 'Cabaña'}, ${verbo} el ${formatearDiaCorto(reserva.fechaCheckIn)}`}
        extra={
          <span className="text-[15px] font-semibold text-rose-700 tabular-nums shrink-0">
            {formatearMonto(saldoPendiente(reserva))}
          </span>
        }
      />
    );
  });

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4" aria-label="Resumen de hoy y mañana">
      <Grupo titulo="Hoy" vacio="Hoy no entra ni sale nadie." filas={filasDeMovimientos(hoy, reservas)} />
      <Grupo
        titulo={`Mañana, ${formatearDiaCorto(manana)}`}
        vacio="Mañana no entra ni sale nadie."
        filas={filasDeMovimientos(manana, reservas)}
      />
      {porCobrar.length > 0 && <Grupo titulo="Falta cobrar" filas={porCobrar} />}
    </section>
  );
}
