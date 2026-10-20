import { Link } from 'react-router-dom';
import { listarCabanas, listarReservas, listarReservasHistoricas } from '../services/reservas.service.js';
import { useDatos } from '../hooks/useDatos.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import Cargando from '../components/comunes/Cargando.jsx';
import Aviso from '../components/comunes/Aviso.jsx';
import CalendarioMensual from '../components/calendario/CalendarioMensual.jsx';

// Activas e históricas juntas, para poder recorrer también los meses pasados.
// Cada reserva ya trae sus cobros, que es lo que necesita el semáforo.
async function cargarCalendario() {
  const [cabanas, activas, historicas] = await Promise.all([
    listarCabanas(),
    listarReservas(),
    listarReservasHistoricas(),
  ]);
  return { cabanas, reservas: [...activas, ...historicas] };
}

export default function Calendario() {
  const { datos, cargando, error } = useDatos(cargarCalendario);

  if (cargando) return <Cargando texto="Sincronizando..." />;

  return (
    <Pantalla
      conNavegacion
      encabezado={
        <Encabezado
          antetitulo="Panel de Control"
          titulo="Cabañas Aroma del potrero"
          derecha={
            <Link
              to="/reservas/nueva"
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all"
            >
              + Nueva Reserva
            </Link>
          }
        />
      }
    >
      {error ? (
        <Aviso>No se pudo sincronizar el estado de ocupación principal</Aviso>
      ) : (
        <CalendarioMensual reservas={datos.reservas} cabanas={datos.cabanas} />
      )}
    </Pantalla>
  );
}
