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

const COLOR_ESTADO = {
  Señada: { barra: 'bg-sky-500', texto: 'text-sky-700' },
  Pagada: { barra: 'bg-emerald-500', texto: 'text-emerald-700' },
  Finalizada: { barra: 'bg-slate-400', texto: 'text-slate-600' },
  Abortada: { barra: 'bg-orange-400', texto: 'text-orange-600' },
};

function Barra({ porcentaje, color = 'bg-blue-600' }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
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
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/70 flex flex-col justify-between min-h-25">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caja General</span>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">{formatearMonto(ingresosDelMes)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">● Total cobrado</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/70 flex flex-col justify-between min-h-25">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ocupación Total</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalReservas}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Reservas del mes (sin canceladas)</span>
          </div>
        </div>
      </div>

      <Tarjeta titulo="Rendimiento por Unidad" className="space-y-4">
        {cabanas.length === 0 ? (
          <p className="text-xs font-medium text-slate-400 py-2 text-center">Sin actividad en este período.</p>
        ) : (
          <div className="space-y-4">
            {cabanas.map((nombre) => {
              const reservas = reservasPorCabana[nombre] ?? 0;
              return (
                <div key={nombre} className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 capitalize text-sm tracking-tight">{nombre}</span>
                    <span className="text-[9px] font-bold bg-slate-200/70 text-slate-500 px-2 py-0.5 rounded-sm uppercase tracking-wider">Unidad</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Reservas</span>
                      <span className="font-black text-slate-800 text-sm">{reservas} {reservas === 1 ? 'reserva' : 'reservas'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Ingresado</span>
                      <span className="font-black text-emerald-600 text-sm">{formatearMonto(ingresosPorCabana[nombre])}</span>
                    </div>
                  </div>
                  <Barra porcentaje={(reservas / maxReservas) * 100} />
                </div>
              );
            })}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Auditoría de Estados" className="space-y-4">
        <div className="space-y-3.5">
          {Object.entries(reservasPorEstado).map(([estado, cantidad]) => (
            <div key={estado} className="space-y-1 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{estado}</span>
                <span className={`font-bold ${COLOR_ESTADO[estado]?.texto ?? 'text-slate-700'}`}>{cantidad}</span>
              </div>
              <Barra porcentaje={(cantidad / maxEstado) * 100} color={COLOR_ESTADO[estado]?.barra} />
            </div>
          ))}
        </div>
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
    <Pantalla conNavegacion encabezado={<Encabezado antetitulo="Rendimiento Comercial" titulo="Informes Mensuales" />}>
      <SelectorDeMes titulo={`${NOMBRES_MESES[periodo.mes - 1]} ${periodo.anio}`} onCambiar={cambiarMes} />

      {cargando ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-7 h-7 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Calculando informes...</p>
        </div>
      ) : error ? (
        <Aviso>No se pudieron procesar los informes del período seleccionado</Aviso>
      ) : (
        <Informe datos={datos} />
      )}
    </Pantalla>
  );
}
