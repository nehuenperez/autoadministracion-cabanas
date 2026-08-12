import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function ReservasAnteriores() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para controlar qué meses están desplegados/abiertos (ej: {'2026-07': true})
  const [mesesAbiertos, setMesesAbiertos] = useState({});

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    async function cargarHistoricas() {
      setCargando(true);
      try {
        const { data } = await api.get('/reservas/historicas');
        const lista = Array.isArray(data) ? data : [];
        setReservas(lista);

        // Inicializador automático: dejamos abierto el mes actual para que vea rápido lo reciente
        const hoy = new Date();
        const claveActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        setMesesAbiertos({ [claveActual]: true });

      } catch {
        setError('No se pudo sincronizar el historial de reservas');
      } finally {
        setCargando(false);
      }
    }
    cargarHistoricas();
  }, []);

  // Alternador para abrir/cerrar un mes específico
  function toggleMes(clave) {
    setMesesAbiertos(prev => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Abriendo archivo...</p>
      </div>
    );
  }

  // 1. Filtrado dinámico por barra de búsqueda (Apellido, DNI o Cabaña)
  const reservasFiltradas = reservas.filter(r => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;

    const cabanaNombre = r.Cabana?.nombre?.toLowerCase() || '';
    const coincideCabana = cabanaNombre.includes(term);

    const coincideHuesped = r.Huespeds?.some(h => {
      const nom = (h.nombre || '').toLowerCase();
      const ape = (h.apellido || '').toLowerCase();
      const dni = (h.dni || '').toLowerCase();
      return nom.includes(term) || ape.includes(term) || dni.includes(term);
    });

    return coincideCabana || coincideHuesped;
  });

  // 2. Agrupador inteligente: Clasifica las reservas en sus casilleros de Año-Mes
  const gruposMensuales = {};
  reservasFiltradas.forEach(r => {
    if (!r.fechaCheckIn) return;
    const [anio, mes] = r.fechaCheckIn.split('-'); // Extrae "2026" y "07"
    const clave = `${anio}-${mes}`;
    
    if (!gruposMensuales[clave]) {
      gruposMensuales[clave] = [];
    }
    gruposMensuales[clave].push(r);
  });

  // Ordenamos las llaves de los meses para que aparezcan de manera cronológica descendente (más nuevo arriba)
  const mesesOrdenados = Object.keys(gruposMensuales).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-slate-800 antialiased">
      
      {/* Barra de búsqueda fija */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/60 p-4 space-y-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Historial General</span>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Reservas Pasadas</h1>
        </div>
        <input
          type="text"
          placeholder="Buscar por apellido, DNI o cabaña..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition text-slate-800"
        />
      </div>

      <div className="max-w-md mx-auto px-4 mt-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl text-center mb-4">
            {error}
          </div>
        )}

        {mesesOrdenados.length === 0 ? (
          <p className="text-xs font-medium text-slate-400 py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
            No se encontraron registros que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="space-y-3">
            {mesesOrdenados.map((clave) => {
              const [anio, mesNum] = clave.split('-');
              const nombreMes = nombresMeses[parseInt(mesNum, 10) - 1];
              const reservasDelMes = gruposMensuales[clave];
              const estaAbierto = !!mesesAbiertos[clave];

              return (
                <div key={clave} className="space-y-2">
                  
                  {/* BARRA DESPLEGABLE DEL MES (BOTÓN ACORDEÓN) */}
                  <button
                    type="button"
                    onClick={() => toggleMes(clave)}
                    className="w-full bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-xs flex items-center justify-between transition active:bg-slate-50 text-left focus:outline-hidden cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {nombreMes} {anio}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {reservasDelMes.length} {reservasDelMes.length === 1 ? 'reserva' : 'reservas'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 transition-transform duration-200">
                      {estaAbierto ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* CONTENEDOR DE TARJETAS (Se muestra solo si estaAbierto === true) */}
                  {estaAbierto && (
                    <div className="space-y-2.5 pl-1 border-l-2 border-slate-200/50 ml-2 animate-fadeIn">
                      {reservasDelMes.map((reserva) => {
                        const titular = reserva.Huespeds?.find(h => h.ReservaHuesped?.role === 'titular' || h.ReservaHuesped?.rol === 'titular');

                        return (
                          <div
                            key={reserva.id}
                            onClick={() => navigate(`/reservas/${reserva.id}`)}
                            className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs space-y-2.5 cursor-pointer hover:bg-slate-50/50 active:scale-[0.995] transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                                {reserva.Cabana?.nombre || 'Unidad de Alojamiento'}
                              </h3>
                              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                {reserva.estado}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-slate-600">
                              {titular ? (
                                <p className="capitalize text-slate-700 font-bold">👤 {titular.nombre} {titular.apellido}</p>
                              ) : (
                                <p className="text-amber-600 flex items-center gap-1">⚠️ Sin titular registrado</p>
                              )}
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {reserva.fechaCheckIn} al {reserva.fechaCheckOut}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                              <span className="text-slate-400 font-medium">Monto Recaudado:</span>
                              <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                ${Number(reserva.montoTotal).toLocaleString('es-AR')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Menú de navegación inferior */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 flex justify-around items-center z-30 shadow-lg">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <span className="text-lg">🗓️</span>
          <span className="text-[9px] font-bold tracking-tight">Calendario</span>
        </button>
        <button onClick={() => navigate('/reservas-anteriores')} className="flex flex-col items-center gap-0.5 text-blue-600 cursor-pointer">
          <span className="text-lg">📚</span>
          <span className="text-[9px] font-bold tracking-tight">Historial</span>
        </button>
        <button onClick={() => navigate('/estadisticas')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <span className="text-lg">📊</span>
          <span className="text-[9px] font-bold tracking-tight">Informes</span>
        </button>
      </div>

    </div>
  );
}