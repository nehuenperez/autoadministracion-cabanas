import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { crearReserva, listarCabanas, listarReservas } from '../services/reservas.service.js';
import { vincularAReserva } from '../services/huespedes.service.js';
import { useDatos } from '../hooks/useDatos.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import Cargando from '../components/comunes/Cargando.jsx';
import Tarjeta from '../components/comunes/Tarjeta.jsx';
import Aviso from '../components/comunes/Aviso.jsx';
import FormularioReserva from '../components/reservas/FormularioReserva.jsx';

async function cargarDatosDelFormulario() {
  const [cabanas, reservasActivas] = await Promise.all([listarCabanas(), listarReservas()]);
  return { cabanas, reservasActivas };
}

export default function NuevaReserva() {
  const navigate = useNavigate();
  const location = useLocation();
  // Desde "Cliente desea agregar días" llegan el titular, la cabaña y el día en que arranca
  const continuacion = location.state ?? {};
  const titularAClonar = continuacion.clonarHuesped;

  const { datos, cargando, error: errorDeCarga } = useDatos(cargarDatosDelFormulario);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleCrearReserva(datosNuevaReserva) {
    setGuardando(true);
    setError('');
    try {
      const nuevaReserva = await crearReserva(datosNuevaReserva);
      if (titularAClonar) {
        try {
          await vincularAReserva(nuevaReserva.id, [{ huespedId: titularAClonar.id, rol: 'titular' }]);
        } catch {
          // La reserva ya está creada: si falla el vínculo, el titular se carga a mano en el detalle
        }
      }
      // Directo al detalle para cargar huéspedes y cobros. Reemplaza al formulario en
      // el historial: "Volver" desde el detalle no debe reabrir un formulario ya enviado.
      navigate(`/reservas/${nuevaReserva.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al intentar dar de alta la reserva. Verifique las fechas.');
      setGuardando(false);
    }
  }

  // Vuelve a la pantalla anterior; si se entró directo por la URL, al calendario
  function cancelar() {
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  }

  if (cargando) return <Cargando />;

  return (
    <Pantalla
      encabezado={
        <Encabezado
          titulo="Nuevo Registro"
          izquierda={
            <button
              type="button"
              onClick={cancelar}
              className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              ✕ Cancelar
            </button>
          }
        />
      }
    >
      <Tarjeta>
        <div className="border-b border-slate-50 pb-2">
          <h2 className="text-base font-bold text-slate-900">Bloqueo de Disponibilidad</h2>
          <p className="text-xs text-slate-400 mt-0.5">Ingresá los datos del período para reservar la propiedad.</p>
          {titularAClonar && (
            <p className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mt-2">
              Titular: <span className="capitalize">{titularAClonar.nombre} {titularAClonar.apellido}</span>
            </p>
          )}
        </div>

        {errorDeCarga ? (
          <Aviso>No se pudieron cargar las cabañas disponibles</Aviso>
        ) : (
          <FormularioReserva
            cabanas={datos.cabanas}
            reservasActivas={datos.reservasActivas}
            inicial={{ cabanaId: continuacion.cabanaId, fechaCheckIn: continuacion.desde }}
            onSubmit={handleCrearReserva}
            cargando={guardando}
            error={error}
          />
        )}
      </Tarjeta>
    </Pantalla>
  );
}
