import { useState } from 'react';
import { BedDouble, LogIn, LogOut } from 'lucide-react';
import { NOMBRES_MESES, deISO, diasDelMes, formatearDia, formatearRango, hoyISO } from '../../utils/fechas.js';
import { semaforoDe, ESTILOS, REFERENCIAS } from '../../utils/semaforo.js';
import SelectorDeMes from '../comunes/SelectorDeMes.jsx';
import ControlSegmentado from '../comunes/ControlSegmentado.jsx';
import FilaDeReserva from './FilaDeReserva.jsx';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const MOVIMIENTOS = {
  egreso: { texto: 'Sale', Icono: LogOut, color: 'bg-slate-100 text-slate-600', orden: 0 },
  ingreso: { texto: 'Entra', Icono: LogIn, color: 'bg-emerald-50 text-emerald-700', orden: 1 },
  estadia: { texto: 'Alojado', Icono: BedDouble, color: 'bg-sky-50 text-sky-700', orden: 2 },
};

/**
 * Qué pasa en una cabaña un día dado: si la noche está ocupada (y con qué
 * color) y la lista de movimientos (quién entra, quién sale, quién está).
 */
function estadoDelDia(fecha, reservas) {
  let ocupacion = null;
  const movimientos = [];

  for (const reserva of reservas) {
    const { fechaCheckIn: entrada, fechaCheckOut: salida } = reserva;
    if (fecha < entrada || fecha > salida) continue;

    const tipo = fecha === entrada ? 'ingreso' : fecha === salida ? 'egreso' : 'estadia';
    const semaforo = semaforoDe(reserva);

    // El día de salida la cabaña ya queda libre para el que entra
    if (tipo !== 'egreso' && reserva.estado !== 'Abortada') ocupacion = semaforo;

    movimientos.push({ reserva, tipo, semaforo });
  }

  movimientos.sort((a, b) => MOVIMIENTOS[a.tipo].orden - MOVIMIENTOS[b.tipo].orden);
  return { ocupacion, movimientos };
}

function GrillaDelMes({ anio, mes, reservas, diaSeleccionado, onSeleccionar }) {
  const hoy = hoyISO();

  return (
    <div className="grid grid-cols-7 gap-1">
      {diasDelMes(anio, mes).map((fecha, i) => {
        if (!fecha) return <div key={`vacio-${i}`} />;

        const { ocupacion, movimientos } = estadoDelDia(fecha, reservas);
        const activos = movimientos.filter((m) => m.reserva.estado !== 'Abortada');
        const entra = activos.some((m) => m.tipo === 'ingreso');
        const sale = activos.some((m) => m.tipo === 'egreso');
        const estilo = ocupacion && ESTILOS[ocupacion.clave];
        const seleccionado = diaSeleccionado === fecha;
        const esHoy = fecha === hoy;

        return (
          <button
            type="button"
            key={fecha}
            onClick={() => onSeleccionar(fecha)}
            aria-pressed={seleccionado}
            aria-label={`${formatearDia(fecha)}${ocupacion ? `, ocupado, ${ocupacion.etiqueta}` : ', libre'}${entra ? ', entra alguien' : ''}${sale ? ', sale alguien' : ''}`}
            className={`relative min-h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
              estilo ? estilo.celda : 'hover:bg-slate-100'
            } ${seleccionado ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
          >
            <span
              className={`size-7 flex items-center justify-center rounded-full text-[15px] tabular-nums ${
                esHoy ? 'bg-slate-900 text-white font-bold' : estilo ? estilo.numero : 'text-slate-800'
              }`}
            >
              {Number(fecha.slice(8))}
            </span>
            <span className="flex gap-1 h-1.5" aria-hidden="true">
              {entra && <span className="size-1.5 rounded-full bg-slate-900" />}
              {sale && <span className="size-1.5 rounded-full ring-1 ring-slate-500 ring-inset" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Referencias() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-slate-100 text-sm text-slate-600">
      {REFERENCIAS.map(({ clave, texto }) => (
        <li key={clave} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${ESTILOS[clave].punto}`} aria-hidden="true" />
          {texto}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-slate-900" aria-hidden="true" />
        Entra
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full ring-1 ring-slate-500 ring-inset" aria-hidden="true" />
        Sale
      </li>
    </ul>
  );
}

function AgendaDelDia({ fecha, movimientos }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2" aria-live="polite">
      <h2 className="text-base font-semibold text-slate-900 first-letter:uppercase">{formatearDia(fecha)}</h2>
      {movimientos.length === 0 ? (
        <p className="text-[15px] text-slate-500 py-1">Cabaña libre, sin entradas ni salidas.</p>
      ) : (
        <ul>
          {movimientos.map(({ reserva, tipo, semaforo }) => {
            const { texto, Icono, color } = MOVIMIENTOS[tipo];
            return (
              <FilaDeReserva
                key={`${reserva.id}-${tipo}`}
                reserva={reserva}
                icono={Icono}
                colorIcono={color}
                detalle={`${texto}. ${formatearRango(reserva.fechaCheckIn, reserva.fechaCheckOut)}`}
                insignia={
                  <span className={`inline-block text-xs font-semibold border px-2 py-0.5 rounded-md ${ESTILOS[semaforo.clave].insignia}`}>
                    {semaforo.etiqueta}
                  </span>
                }
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Calendario mensual de una cabaña a la vez (se cambia con las pestañas), con
 * la agenda del día elegido debajo.
 */
export default function CalendarioMensual({ reservas = [], cabanas = [] }) {
  const [cabanaId, setCabanaId] = useState(() => cabanas[0]?.id);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyISO);
  const [mes, setMes] = useState(() => {
    const hoy = deISO(hoyISO());
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  const reservasDeLaCabana = reservas.filter((r) => Number(r.cabanaId) === Number(cabanaId));

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        {cabanas.length > 1 && (
          <ControlSegmentado
            etiqueta="Cabaña"
            opciones={cabanas.map((c) => ({ valor: c.id, texto: c.nombre }))}
            valor={cabanaId}
            onCambiar={setCabanaId}
          />
        )}

        <SelectorDeMes
          titulo={`${NOMBRES_MESES[mes.getMonth()]} ${mes.getFullYear()}`}
          onCambiar={(salto) => setMes(new Date(mes.getFullYear(), mes.getMonth() + salto, 1))}
        />

        <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500" aria-hidden="true">
          {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
        </div>

        <GrillaDelMes
          anio={mes.getFullYear()}
          mes={mes.getMonth()}
          reservas={reservasDeLaCabana}
          diaSeleccionado={diaSeleccionado}
          onSeleccionar={setDiaSeleccionado}
        />

        <Referencias />
      </section>

      <AgendaDelDia fecha={diaSeleccionado} movimientos={estadoDelDia(diaSeleccionado, reservasDeLaCabana).movimientos} />
    </div>
  );
}
