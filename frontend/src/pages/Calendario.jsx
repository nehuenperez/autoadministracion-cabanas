import { Plus } from 'lucide-react';
import { listarCabanas, listarReservas, listarReservasHistoricas } from '../services/reservas.service.js';
import { useDatos } from '../hooks/useDatos.js';
import { formatearDia, hoyISO } from '../utils/fechas.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import Cargando from '../components/comunes/Cargando.jsx';
import Aviso from '../components/comunes/Aviso.jsx';
import { BotonEnlace } from '../components/comunes/Boton.jsx';
import ResumenDelDia from '../components/calendario/ResumenDelDia.jsx';
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
  const hoy = hoyISO();

  if (cargando) return <Cargando texto="Cargando reservas…" />;

  return (
    <Pantalla conNavegacion encabezado={<Encabezado titulo="Aroma del Potrero" subtitulo={formatearDia(hoy)} />}>
      {error ? (
        <Aviso>No se pudieron cargar las reservas. Revisá la conexión y volvé a abrir la app.</Aviso>
      ) : (
        <>
          <ResumenDelDia reservas={datos.reservas} hoy={hoy} />
          <CalendarioMensual reservas={datos.reservas} cabanas={datos.cabanas} />
        </>
      )}

      {/* Botón flotante: siempre a mano, arriba de la barra de navegación */}
      <BotonEnlace
        to="/reservas/nueva"
        icono={Plus}
        className="fixed right-4 z-30 rounded-full shadow-lg shadow-slate-900/20"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.25rem)' }}
      >
        Nueva reserva
      </BotonEnlace>
    </Pantalla>
  );
}
