import { useCallback, useState } from 'react';
import { obtenerEstadisticas } from '../services/estadisticas.service.js';
import { useDatos } from '../hooks/useDatos.js';
import { NOMBRES_MESES } from '../utils/fechas.js';
import { formatearMonto } from '../utils/montos.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import SelectorDeMes from '../components/comunes/SelectorDeMes.jsx';
import Tarjeta from '../components/comunes/Tarjeta.jsx';
import Aviso from '../components/comunes/Aviso.jsx';
import Cargando from '../components/comunes/Cargando.jsx';

// El nombre que ve la usuaria para cada estado de la base
const ESTADOS = {
  Señada: { texto: 'Señadas', barra: 'bg-sky-500' },
  Pagada: { texto: 'Pagadas', barra: 'bg-emerald-500' },
  Finalizada: { texto: 'Finalizadas', barra: 'bg-slate-400' },
  Abortada: { texto: 'Canceladas', barra: 'bg-orange-400' },
};

function Barra({ porcentaje, color = 'bg-slate-900' }) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
    </div>
  );
}

function Cifra({ rotulo, valor, detalle }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
      <p className="text-sm text-slate-500">{rotulo}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{valor}</p>
      <p className="text-sm text-slate-500">{detalle}</p>
    </div>
  );
}

function Informe({ datos }) {
  const { ingresosDelMes, totalReservas, reservasPorCabana, ingresosPorCabana, reservasPorEstado } = datos;
  const cabanas = [...new Set([...Object.keys(reservasPorCabana), ...Object.keys(ingresosPorCabana)])];
  const maxReservas = Math.max(1, ...Object.values(reservasPorCabana));
  const maxEstado = Math.max(1, ...Object.values(reservasPorEstado));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Cifra rotulo="Cobrado en el mes" valor={formatearMonto(ingresosDelMes)} detalle="Según la fecha de cada cobro" />
        <Cifra rotulo="Reservas" valor={totalReservas} detalle="Que entran este mes, sin canceladas" />
      </div>

      <Tarjeta titulo="Por cabaña">
        {cabanas.length === 0 ? (
          <p className="text-[15px] text-slate-500">Sin reservas en este mes.</p>
        ) : (
          <ul className="space-y-4">
            {cabanas.map((nombre) => {
              const reservas = reservasPorCabana[nombre] ?? 0;
              return (
                <li key={nombre} className="space-y-2">
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="text-[15px] font-semibold text-slate-900 capitalize">{nombre}</span>
                    <span className="text-[15px] font-semibold text-emerald-700 tabular-nums">{formatearMonto(ingresosPorCabana[nombre])}</span>
                  </div>
                  <Barra porcentaje={(reservas / maxReservas) * 100} />
                  <p className="text-sm text-slate-500">
                    {reservas} {reservas === 1 ? 'reserva' : 'reservas'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo="Estado de las reservas del mes">
        <ul className="space-y-3">
          {Object.entries(reservasPorEstado).map(([estado, cantidad]) => (
            <li key={estado} className="space-y-1.5">
              <div className="flex justify-between items-baseline text-[15px]">
                <span className="text-slate-700">{ESTADOS[estado]?.texto ?? estado}</span>
                <span className="font-semibold text-slate-900 tabular-nums">{cantidad}</span>
              </div>
              <Barra porcentaje={(cantidad / maxEstado) * 100} color={ESTADOS[estado]?.barra} />
            </li>
          ))}
        </ul>
      </Tarjeta>
    </>
  );
}

export default function Estadisticas() {
  const [periodo, setPeriodo] = useState(() => ({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear() }));
  const cargar = useCallback(() => obtenerEstadisticas(periodo.mes, periodo.anio), [periodo]);
  const { datos, cargando, error } = useDatos(cargar);

  function cambiarMes(salto) {
    const fecha = new Date(periodo.anio, periodo.mes - 1 + salto, 1);
    setPeriodo({ mes: fecha.getMonth() + 1, anio: fecha.getFullYear() });
  }

  return (
    <Pantalla conNavegacion encabezado={<Encabezado titulo="Informes" subtitulo="Cobros y reservas de cada mes" />}>
      <div className="bg-white rounded-2xl border border-slate-200 px-2 py-1">
        <SelectorDeMes titulo={`${NOMBRES_MESES[periodo.mes - 1]} ${periodo.anio}`} onCambiar={cambiarMes} />
      </div>

      {cargando ? (
        <Cargando texto="Calculando…" pantallaCompleta={false} />
      ) : error ? (
        <Aviso>No se pudo cargar el informe de este mes. Revisá la conexión y probá de nuevo.</Aviso>
      ) : (
        <Informe datos={datos} />
      )}
    </Pantalla>
  );
}
