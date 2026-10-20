import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOMBRES_MESES, diasDelMes, formatearRango, hoyISO } from '../../utils/fechas.js';
import { semaforoDe, ESTILOS, REFERENCIAS } from '../../utils/semaforo.js';
import { titularDe } from '../../utils/reservas.js';
import SelectorDeMes from '../comunes/SelectorDeMes.jsx';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

const MOVIMIENTOS = {
  egreso: { texto: 'EGRESA', clases: 'bg-amber-500 text-slate-950', orden: 0 },
  ingreso: { texto: 'INGRESA', clases: 'bg-emerald-600 text-white', orden: 1 },
  estadia: { texto: 'EN ESTADÍA', clases: 'bg-slate-200 text-slate-700', orden: 2 },
};

/**
 * Qué pasa en una cabaña un día dado: si está ocupada (y con qué color) y la
 * lista de movimientos (quién entra, quién sale, quién está).
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
    <div className="grid grid-cols-7 bg-slate-50/20">
      {diasDelMes(anio, mes).map((fecha, i) => {
        if (!fecha) return <div key={`vacio-${i}`} className="p-1 bg-slate-50/30 border border-slate-100/40" />;

        const { ocupacion, movimientos } = estadoDelDia(fecha, reservas);
        const activos = movimientos.filter((m) => m.reserva.estado !== 'Abortada');
        const estilo = ocupacion && ESTILOS[ocupacion.clave];

        return (
          <button
            type="button"
            key={fecha}
            onClick={() => onSeleccionar(fecha)}
            className={`p-1 min-h-12 border border-slate-100 flex flex-col justify-between items-center relative transition-all cursor-pointer focus:outline-hidden ${
              estilo ? `${estilo.celda} border-l-2` : 'bg-white hover:bg-slate-50'
            } ${diaSeleccionado === fecha ? 'ring-2 ring-blue-600/80 z-10 rounded-lg' : ''}`}
          >
            <span
              className={`text-xs ${estilo ? estilo.numero : 'font-bold text-slate-700'} ${
                fecha === hoy ? 'bg-slate-950 text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black no-underline' : ''
              }`}
            >
              {Number(fecha.slice(8))}
            </span>
            <div className="flex gap-1 justify-center items-center h-2 mb-0.5 w-full">
              {activos.some((m) => m.tipo === 'ingreso') && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              {activos.some((m) => m.tipo === 'egreso') && <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AgendaDelDia({ fecha, movimientos }) {
  const navigate = useNavigate();
  const [, mes, dia] = fecha.split('-');

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs space-y-3">
      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agenda: {dia}/{mes}</span>
        <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">
          {movimientos.length} {movimientos.length === 1 ? 'Movimiento' : 'Movimientos'}
        </span>
      </div>

      {movimientos.length === 0 ? (
        <p className="text-[11px] font-medium text-slate-400 py-2.5 text-center bg-slate-50/40 rounded-lg border border-dashed border-slate-100">
          Sin huéspedes ni movimientos para esta unidad este día.
        </p>
      ) : (
        <div className="space-y-2">
          {movimientos.map(({ reserva, tipo, semaforo }) => {
            const titular = titularDe(reserva);
            return (
              <button
                type="button"
                key={`${reserva.id}-${tipo}`}
                onClick={() => navigate(`/reservas/${reserva.id}`)}
                className="w-full text-left p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2 text-xs cursor-pointer active:scale-[0.995] transition-all"
              >
                <div className="space-y-0.5">
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-xs ${MOVIMIENTOS[tipo].clases}`}>
                    {MOVIMIENTOS[tipo].texto}
                  </span>
                  <p className="font-bold text-slate-700 capitalize">
                    {titular ? `${titular.nombre} ${titular.apellido}` : '👤 Sin responsable asignado'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {formatearRango(reserva.fechaCheckIn, reserva.fechaCheckOut)}
                  </p>
                </div>
                <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-md shrink-0 ${ESTILOS[semaforo.clave].insignia}`}>
                  {semaforo.etiqueta}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Calendario mensual por cabaña, con la agenda del día elegido debajo de cada uno. */
export default function CalendarioMensual({ reservas = [], cabanas = [] }) {
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyISO);

  return (
    <div className="space-y-4">
      <SelectorDeMes
        titulo={`${NOMBRES_MESES[mes.getMonth()]} ${mes.getFullYear()}`}
        onCambiar={(salto) => setMes(new Date(mes.getFullYear(), mes.getMonth() + salto, 1))}
      />

      <div className="space-y-6">
        {cabanas.map((cabana) => {
          const reservasDeLaCabana = reservas.filter((r) => Number(r.cabanaId) === Number(cabana.id));
          return (
            <div key={cabana.id} className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-xs p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">{cabana.nombre}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calendario</span>
                </div>
                <div className="grid grid-cols-7 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                  {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
                </div>
                <GrillaDelMes
                  anio={mes.getFullYear()}
                  mes={mes.getMonth()}
                  reservas={reservasDeLaCabana}
                  diaSeleccionado={diaSeleccionado}
                  onSeleccionar={setDiaSeleccionado}
                />
              </div>
              <AgendaDelDia
                fecha={diaSeleccionado}
                movimientos={estadoDelDia(diaSeleccionado, reservasDeLaCabana).movimientos}
              />
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-3 border border-slate-200/70 shadow-xs flex flex-col gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-slate-100 pb-2">
          {REFERENCIAS.map(({ clave, texto }) => (
            <div key={clave} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${ESTILOS[clave].punto}`} />
              <span>{texto}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9px] text-slate-400 capitalize">
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-950" /><span>Check-in (Entra)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-600" /><span>Check-out (Sale)</span></div>
        </div>
      </div>
    </div>
  );
}
