import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { crearReserva, listarCabanas, listarReservas } from '../services/reservas.service.js';
import { vincularAReserva } from '../services/huespedes.service.js';
import { useDatos } from '../hooks/useDatos.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import Cargando from '../components/comunes/Cargando.jsx';
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
      setError(err.response?.data?.error || 'No se pudo crear la reserva. Revisá las fechas y probá de nuevo.');
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
    <Pantalla encabezado={<Encabezado onVolver={cancelar} textoVolver="Cancelar" />}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Nueva reserva</h1>
        {titularAClonar && (
          <p className="text-[15px] text-slate-600">
            Continúa la estadía de <span className="font-semibold text-slate-900 capitalize">{titularAClonar.nombre} {titularAClonar.apellido}</span>.
          </p>
        )}
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        {errorDeCarga ? (
          <Aviso>No se pudieron cargar las cabañas. Revisá la conexión y probá de nuevo.</Aviso>
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
      </section>
    </Pantalla>
  );
}
