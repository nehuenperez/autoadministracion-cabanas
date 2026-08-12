import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function Estadisticas() {
  const navigate = useNavigate();
  const [fechaFiltro, setFechaFiltro] = useState(new Date());
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    async function cargarEstadisticas() {
      setCargando(true);
      setError('');
      try {
        const mesQuery = fechaFiltro.getMonth() + 1;
        const anioQuery = fechaFiltro.getFullYear();

        const response = await api.get(`/estadisticas?mes=${mesQuery}&anio=${anioQuery}`);
        setData(response.data);
      } catch {
        setError('No se pudieron procesar los informes del período seleccionado');
      } finally {
        setCargando(false);
      }
    }
    cargarEstadisticas();
  }, [fechaFiltro]);

  function cambiarMes(factor) {
    setFechaFiltro(new Date(fechaFiltro.getFullYear(), fechaFiltro.getMonth() + factor, 1));
  }

  function normalizarEstructura(rawData, campoNombre) {
    if (!rawData) return {};
    if (!Array.isArray(rawData) && typeof rawData === 'object') {
      const sanificado = {};
      for (const [key, val] of Object.entries(rawData)) {
        sanificado[key] = Number(val) || 0;
      }
      return sanificado;
    }
    if (Array.isArray(rawData)) {
      const mapeado = {};
      rawData.forEach(item => {
        if (!item) return;
        
        let nombre = '';
        for (const key in item) {
          if (key.toLowerCase().includes('nombre') || key.toLowerCase().includes('cabana') || key.toLowerCase().includes('est')) {
            const val = item[key];
            nombre = (typeof val === 'object' && val !== null) ? (val.nombre || val.cabana || val.estado || String(val)) : String(val);
            break;
          }
        }
        if (!nombre) nombre = item.nombre || item.cabana || item.estado || item[campoNombre] || 'Otros';
        
        let cantidad = 0;
        for (const key in item) {
          if (key.toLowerCase().includes('count') || key.toLowerCase().includes('cant') || key.toLowerCase().includes('total') || key.toLowerCase().includes('monto') || key.toLowerCase().includes('ingreso')) {
            cantidad = Number(item[key]) || 0;
            break;
          }
        }
        mapeado[nombre] = cantidad;
      });
      return mapeado;
    }
    return {};
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Calculando informes...</p>
      </div>
    );
  }

  // PRIORIZACIÓN DE LLAVES NUEVAS DEL BACKEND CRUZADO
  const ingresosTotales = Number(data?.ingresosDelMes || data?.ingresos || data?.ingresosMes || data?.totalIngresos || 0);
  const reservasTotales = Number(data?.totalReservas || data?.reservasTotales || data?.total || 0);
  
  const rawCabanas = data?.reservasPorCabana || data?.porCabanas || data?.porCabana || data?.cabanas || data?.cabana || data?.por_cabana || data?.distribucionCabana;
  const rawEstados = data?.reservasPorEstado || data?.porEstados || data?.porEstado || data?.estados || data?.estado || data?.por_estado || data?.distribucionEstado;
  const rawIngresosCabana = data?.ingresosPorCabana || data?.ingresosPorCabanas || data?.ingresosCabana || data?.recaudacionCabana || data?.pagosPorCabana;

  let porCabana = normalizarEstructura(rawCabanas, 'cabana');
  let porEstado = normalizarEstructura(rawEstados, 'estado');
  let porCabanaIngresos = normalizarEstructura(rawIngresosCabana, 'cabana');

  if (Object.keys(porCabana).length === 0 && data) {
    for (const key in data) {
      if (key.toLowerCase().includes('caba') || key.toLowerCase().includes('unidad')) {
        const check = normalizarEstructura(data[key], 'cabana');
        if (Object.keys(check).length > 0) { porCabana = check; break; }
      }
    }
  }
  if (Object.keys(porEstado).length === 0 && data) {
    for (const key in data) {
      if (key.toLowerCase().includes('est') || key.toLowerCase().includes('status')) {
        const check = normalizarEstructura(data[key], 'estado');
        if (Object.keys(check).length > 0) { porEstado = check; break; }
      }
    }
  }

  const todasLasCabanas = Array.from(new Set([
    ...Object.keys(porCabana).map(k => k.trim()),
    ...Object.keys(porCabanaIngresos).map(k => k.trim())
  ]));

  const maxCabana = Math.max(...Object.values(porCabana), 1);
  const maxEstado = Math.max(...Object.values(porEstado), 1);

  const tieneDesgloseFinancieroBD = Object.values(porCabanaIngresos).some(v => v > 0);

  const mapeoColoresEstado = {
    'Señada': { bg: 'bg-sky-500', texto: 'text-sky-700 font-bold' },
    'Pagada': { bg: 'bg-emerald-500', texto: 'text-emerald-700 font-bold' },
    'Finalizada': { bg: 'bg-slate-400', texto: 'text-slate-600 font-bold' },
    'Abortada': { bg: 'bg-orange-400', texto: 'text-orange-600 font-bold' }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-slate-800 antialiased">
      
      {/* Navbar Superior */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Rendimiento Comercial</span>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Informes Mensuales</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
        
        {/* Selector de Fecha */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/70 flex justify-between items-center shadow-xs">
          <button type="button" onClick={() => cambiarMes(-1)} className="p-2 font-bold text-slate-400 hover:text-slate-900 text-sm focus:outline-hidden cursor-pointer">←</button>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {nombresMeses[fechaFiltro.getMonth()]} {fechaFiltro.getFullYear()}
          </span>
          <button type="button" onClick={() => cambiarMes(1)} className="p-2 font-bold text-slate-400 hover:text-slate-900 text-sm focus:outline-hidden cursor-pointer">→</button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Balance General */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/70 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Caja General</span>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                ${ingresosTotales.toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">● Total cobrado</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/70 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ocupación Total</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {reservasTotales}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">Reservas del mes</span>
            </div>
          </div>
        </div>

        {/* Distribución por Unidad */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Rendimiento por Unidad</h3>
          
          {todasLasCabanas.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 py-2 text-center">Sin actividad en este período.</p>
          ) : (
            <div className="space-y-4">
              {todasLasCabanas.map((nombre) => {
                const llaveNormalizada = nombre.toLowerCase().trim();
                
                let reservasCabana = 0;
                for (const [k, v] of Object.entries(porCabana)) {
                  if (k.toLowerCase().trim() === llaveNormalizada) {
                    reservasCabana = v;
                    break;
                  }
                }

                let ingresosCabana = 0;
                if (tieneDesgloseFinancieroBD) {
                  for (const [k, v] of Object.entries(porCabanaIngresos)) {
                    if (k.toLowerCase().trim() === llaveNormalizada) {
                      ingresosCabana = v;
                      break;
                    }
                  }
                } else if (reservasTotales > 0) {
                  ingresosCabana = Math.round((reservasCabana / reservasTotales) * ingresosTotales);
                }

                const porcentajeBarra = (reservasCabana / maxCabana) * 100;

                return (
                  <div key={nombre} className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 capitalize text-sm tracking-tight">{nombre}</span>
                      <span className="text-[9px] font-bold bg-slate-200/70 text-slate-500 px-2 py-0.5 rounded-sm uppercase tracking-wider">Unidad</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Reservas</span>
                        <span className="font-black text-slate-800 text-sm">
                          {reservasCabana} {reservasCabana === 1 ? 'reserva' : 'reservas'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Ingresado</span>
                        <span className="font-black text-emerald-600 text-sm">
                          ${ingresosCabana.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${porcentajeBarra}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Auditoría de Estados */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Auditoría de Estados</h3>
          
          {Object.keys(porEstado).length === 0 ? (
            <p className="text-xs font-medium text-slate-400 py-2 text-center">Sin registros comerciales.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(porEstado).map(([estado, cantidad]) => {
                const porcentajeBarra = (cantidad / maxEstado) * 100;
                const configColor = mapeoColoresEstado[estado] || { bg: 'bg-slate-400', texto: 'text-slate-700' };
                
                return (
                  <div key={estado} className="space-y-1 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">{estado}</span>
                      <span className={configColor.texto}>{cantidad}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`${configColor.bg} h-full rounded-full transition-all duration-500`} 
                        style={{ width: `${porcentajeBarra}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Menú de navegación inferior */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 flex justify-around items-center z-30 shadow-lg">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <span className="text-lg">🗓️</span>
          <span className="text-[9px] font-bold tracking-tight">Calendario</span>
        </button>
        <button onClick={() => navigate('/reservas-anteriores')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <span className="text-lg">📚</span>
          <span className="text-[9px] font-bold tracking-tight">Historial</span>
        </button>
        <button onClick={() => navigate('/estadisticas')} className="flex flex-col items-center gap-0.5 text-blue-600 cursor-pointer">
          <span className="text-lg">📊</span>
          <span className="text-[9px] font-bold tracking-tight">Informes</span>
        </button>
      </div>

    </div>
  );
}