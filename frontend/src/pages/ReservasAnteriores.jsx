import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronUp, Search } from 'lucide-react';
import { listarReservasHistoricas } from '../services/reservas.service.js';
import { useDatos } from '../hooks/useDatos.js';
import { NOMBRES_MESES, formatearRango, hoyISO } from '../utils/fechas.js';
import { formatearMonto } from '../utils/montos.js';
import { titularDe, totalCobrado } from '../utils/reservas.js';
import { ESTILOS, semaforoDe } from '../utils/semaforo.js';
import { claseDeCampo } from '../utils/estilos.js';
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
    <li>
      <button
        type="button"
        onClick={() => navigate(`/reservas/${reserva.id}`)}
        className="w-full text-left bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-[15px] font-semibold capitalize ${titular ? 'text-slate-900' : 'text-amber-700'}`}>
              {titular ? `${titular.nombre} ${titular.apellido}` : 'Sin titular cargado'}
            </p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0 ${ESTILOS[semaforo.clave].insignia}`}>
              {semaforo.etiqueta}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {reserva.Cabana?.nombre ?? 'Cabaña'}. {formatearRango(reserva.fechaCheckIn, reserva.fechaCheckOut)}
          </p>
          {/* Lo cobrado de verdad, no el total pactado: en una cancelada no son lo mismo */}
          <p className="text-sm text-slate-600">
            Cobrado: <span className="font-semibold text-slate-900 tabular-nums">{formatearMonto(totalCobrado(reserva))}</span>
          </p>
        </div>
        <ChevronRight className="size-5 text-slate-400 shrink-0" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function ReservasAnteriores() {
  const { datos: reservas, cargando, error } = useDatos(listarReservasHistoricas);
  const [busqueda, setBusqueda] = useState('');
  // Arranca abierto el mes actual, para ver rápido lo más reciente
  const [mesesAbiertos, setMesesAbiertos] = useState(() => ({ [hoyISO().slice(0, 7)]: true }));

  if (cargando) return <Cargando texto="Cargando el historial…" />;

  const grupos = agruparPorMes((reservas ?? []).filter((r) => coincide(r, busqueda)));
  // Mientras se busca se abren todos los meses: si no, los resultados quedarían escondidos
  const estaAbierto = (clave) => Boolean(busqueda.trim()) || Boolean(mesesAbiertos[clave]);

  return (
    <Pantalla
      conNavegacion
      encabezado={
        <Encabezado titulo="Historial" subtitulo="Reservas finalizadas y canceladas">
          <div className="relative">
            <Search className="size-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar en el historial"
              placeholder="Buscar por apellido, DNI o cabaña"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`${claseDeCampo} pl-11`}
            />
          </div>
        </Encabezado>
      }
    >
      {error && <Aviso>No se pudo cargar el historial. Revisá la conexión y probá de nuevo.</Aviso>}

      {grupos.length === 0 ? (
        <p className="text-[15px] text-slate-500 py-12 text-center">
          {busqueda.trim() ? 'No hay reservas que coincidan con la búsqueda.' : 'Todavía no hay reservas finalizadas ni canceladas.'}
        </p>
      ) : (
        <div className="space-y-3">
          {grupos.map(([clave, delMes]) => {
            const [anio, mes] = clave.split('-');
            const abierto = estaAbierto(clave);
            const Flecha = abierto ? ChevronUp : ChevronDown;
            return (
              <section key={clave} className="space-y-2">
                <button
                  type="button"
                  aria-expanded={abierto}
                  onClick={() => setMesesAbiertos((previos) => ({ ...previos, [clave]: !previos[clave] }))}
                  className="w-full min-h-12 px-1 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-base font-semibold text-slate-900">
                    {NOMBRES_MESES[Number(mes) - 1]} {anio}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {delMes.length} {delMes.length === 1 ? 'reserva' : 'reservas'}
                    </span>
                  </span>
                  <Flecha className="size-5 text-slate-500" aria-hidden="true" />
                </button>
                {abierto && (
                  <ul className="space-y-2">
                    {delMes.map((reserva) => <TarjetaHistorica key={reserva.id} reserva={reserva} />)}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Pantalla>
  );
}
