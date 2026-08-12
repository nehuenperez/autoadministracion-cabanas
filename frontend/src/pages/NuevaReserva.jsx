import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { crearReserva } from '../services/reservas.service.js';
import FormularioReserva from '../components/reservas/FormularioReserva.jsx';

export default function NuevaReserva() {
  const navigate = useNavigate();
  const [cabanas, setCabanas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarCabanas() {
      try {
        const { data } = await api.get('/cabanas');
        setCabanas(data);
      } catch {
        setError('No se pudieron cargar las cabañas disponibles');
      }
    }
    cargarCabanas();
  }, []);

  async function handleCrearReserva(datosNuevaReserva) {
    setCargando(true);
    setError('');
    try {
      const nuevaReserva = await crearReserva(datosNuevaReserva);
      // Una vez generada con éxito, mandamos a tu mamá directo al detalle para asociar huéspedes
      navigate(`/reservas/${nuevaReserva.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al intentar dar de alta la reserva. Verifique las fechas.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 text-slate-800 antialiased">
      
      {/* Header Minimalista superior */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          ✕ Cancelar
        </button>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">Nuevo Registro</h1>
        <div className="w-14"></div> {/* Bloque spacer para centrar el título */}
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Contenedor principal estilizado */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
          <div className="border-b border-slate-50 pb-2">
            <h2 className="text-base font-bold text-slate-900">Bloqueo de Disponibilidad</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ingresá los datos del período para reservar la propiedad.</p>
          </div>

          {error && !cabanas.length ? (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg text-center">
              {error}
            </div>
          ) : (
            <FormularioReserva
              cabanas={cabanas}
              onSubmit={handleCrearReserva}
              cargando={cargando}
              error={error}
            />
          )}
        </div>

      </div>
    </div>
  );
}