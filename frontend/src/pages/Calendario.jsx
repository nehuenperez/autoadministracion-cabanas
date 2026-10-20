import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import CalendarioMensual from '../components/calendario/CalendarioMensual.jsx';

export default function Calendario() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [cabanas, setCabanas] = useState([]);
  const [pagosPorReserva, setPagosPorReserva] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function inicializarDashboard() {
      setCargando(true);
      try {
        // Consultamos de forma paralela las cabañas, las activas y las históricas
        const [cabanasRes, reservasRes, historicasRes] = await Promise.all([
          api.get('/cabanas'),
          api.get('/reservas'),
          api.get('/reservas/historicas')
        ]);

        const listaCabanas = Array.isArray(cabanasRes.data) ? cabanasRes.data : [];
        const listaActivas = Array.isArray(reservasRes.data) ? reservasRes.data : [];
        const listaHistoricas = Array.isArray(historicasRes.data) ? historicasRes.data : [];

        // Combinamos ambas fuentes de reservas para que el calendario tenga el mapa completo del año
        const listaTotalReservas = [...listaActivas, ...listaHistoricas];

        setCabanas(listaCabanas);
        setReservas(listaTotalReservas);

        // Los listados ya traen los cobros de cada reserva. Antes se pedían de
        // nuevo uno por uno (una llamada por reserva, historial incluido) y si
        // alguna fallaba la reserva aparecía "Sin Seña" aunque estuviera paga.
        const mapaPagos = {};
        for (const reserva of listaTotalReservas) {
          if (reserva?.id) mapaPagos[reserva.id] = Array.isArray(reserva.Pagos) ? reserva.Pagos : [];
        }
        setPagosPorReserva(mapaPagos);

      } catch {
        setError('No se pudo sincronizar el estado de ocupación principal');
      } finally {
        setCargando(false);
      }
    }
    inicializarDashboard();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-slate-800 antialiased">
      
      {/* Navbar de Bienvenida */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Panel de Control</span>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Cabañas Aroma del potrero</h1>
        </div>
        <button
          onClick={() => navigate('/reservas/nueva')}
          className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          + Nueva Reserva
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4">
        {error ? (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        ) : (
          <CalendarioMensual 
            reservas={reservas} 
            cabanas={cabanas} 
            pagosPorReserva={pagosPorReserva} 
          />
        )}
      </div>

      {/* Menú de navegación inferior fijo */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 flex justify-around items-center z-30 shadow-lg">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 text-blue-600 cursor-pointer">
          <span className="text-lg">🗓️</span>
          <span className="text-[9px] font-bold tracking-tight">Calendario</span>
        </button>
        <button onClick={() => navigate('/reservas-anteriores')} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
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