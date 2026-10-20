import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarReservasHistoricas } from '../services/reservas.service.js';
import { useDatos } from '../hooks/useDatos.js';
import { NOMBRES_MESES, formatearRango, hoyISO } from '../utils/fechas.js';
import { formatearMonto } from '../utils/montos.js';
import { titularDe, totalCobrado } from '../utils/reservas.js';
import { ESTILOS, semaforoDe } from '../utils/semaforo.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import Cargando from '../components/comunes/Cargando.jsx';
import Aviso from '../components/comunes/Aviso.jsx';

/** ¿La reserva coincide con lo buscado? Por cabaña, nombre, apellido o DNI de cualquier huésped. */
function coincide(reserva, busqueda) {
  const termino = busqueda.toLowerCase().trim();
  if (!termino) return true;
  if ((reserva.Cabana?.nombre ?? '').toLowerCase().includes(termino)) return true;
  return (reserva.Huespeds ?? []).some((h) =>
    [h.nombre, h.apellido, h.dni].some((valor) => (valor ?? '').toLowerCase().includes(termino))
  );
}

/** Agrupa por mes de ingreso ('2026-07'), del más nuevo al más viejo. */
function agruparPorMes(reservas) {
  const grupos = {};
  for (const reserva of reservas) {
    const clave = reserva.fechaCheckIn.slice(0, 7);
    (grupos[clave] ??= []).push(reserva);
  }
  return Object.entries(grupos).sort(([a], [b]) => b.localeCompare(a));
}

function TarjetaHistorica({ reserva }) {
  const navigate = useNavigate();
  const titular = titularDe(reserva);
  const semaforo = semaforoDe(reserva);

  return (
    <button
      type="button"
      onClick={() => navigate(`/reservas/${reserva.id}`)}
      className="w-full text-left bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs space-y-2.5 cursor-pointer hover:bg-slate-50/50 active:scale-[0.995] transition-all"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight">{reserva.Cabana?.nombre || 'Unidad de Alojamiento'}</h3>
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${ESTILOS[semaforo.clave].insignia}`}>
          {reserva.estado}
        </span>
      </div>
      <div className="text-xs font-semibold text-slate-600">
        {titular ? (
          <p className="capitalize text-slate-700 font-bold">👤 {titular.nombre} {titular.apellido}</p>
        ) : (
          <p className="text-amber-600">⚠️ Sin titular registrado</p>
        )}
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{formatearRango(reserva.fechaCheckIn, reserva.fechaCheckOut)}</p>
      </div>
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
        <span className="text-slate-400 font-medium">Monto Recaudado:</span>
        {/* Lo cobrado de verdad, no el total pactado: en una Abortada no son lo mismo */}
        <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {formatearMonto(totalCobrado(reserva))}
        </span>
      </div>
    </button>
  );
}

export default function ReservasAnteriores() {
  const { datos: reservas, cargando, error } = useDatos(listarReservasHistoricas);
  const [busqueda, setBusqueda] = useState('');
  // Arranca abierto el mes actual, para ver rápido lo más reciente
  const [mesesAbiertos, setMesesAbiertos] = useState(() => ({ [hoyISO().slice(0, 7)]: true }));

  if (cargando) return <Cargando texto="Abriendo archivo..." />;

  const grupos = agruparPorMes((reservas ?? []).filter((r) => coincide(r, busqueda)));
  // Mientras se busca se abren todos los meses: si no, los resultados quedarían escondidos
  const estaAbierto = (clave) => Boolean(busqueda.trim()) || Boolean(mesesAbiertos[clave]);

  return (
    <Pantalla
      conNavegacion
      encabezado={
        <Encabezado antetitulo="Historial General" titulo="Reservas Pasadas">
          <input
            type="search"
            placeholder="Buscar por apellido, DNI o cabaña..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition text-slate-800"
          />
        </Encabezado>
      }
    >
      {error && <Aviso>No se pudo sincronizar el historial de reservas</Aviso>}

      {grupos.length === 0 ? (
        <p className="text-xs font-medium text-slate-400 py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
          No se encontraron registros que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="space-y-3">
          {grupos.map(([clave, delMes]) => {
            const [anio, mes] = clave.split('-');
            const abierto = estaAbierto(clave);
            return (
              <div key={clave} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMesesAbiertos((previos) => ({ ...previos, [clave]: !previos[clave] }))}
                  className="w-full bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-xs flex items-center justify-between transition active:bg-slate-50 text-left focus:outline-hidden cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{NOMBRES_MESES[Number(mes) - 1]} {anio}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {delMes.length} {delMes.length === 1 ? 'reserva' : 'reservas'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{abierto ? '▲' : '▼'}</span>
                </button>
                {abierto && (
                  <div className="space-y-2.5 pl-1 border-l-2 border-slate-200/50 ml-2 animate-aparecer">
                    {delMes.map((reserva) => <TarjetaHistorica key={reserva.id} reserva={reserva} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Pantalla>
  );
}
