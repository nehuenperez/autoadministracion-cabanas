import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { abortarReserva, editarReserva, obtenerReservaPorId } from '../services/reservas.service.js';
import { eliminarPago, registrarPago } from '../services/pagos.service.js';
import { crearHuesped, vincularAReserva } from '../services/huespedes.service.js';
import { useDatos } from '../hooks/useDatos.js';
import { acompanantesDe, saldoPendiente, titularDe, vinculosDe } from '../utils/reservas.js';
import { soloConDato } from '../utils/huespedes.js';
import { ESTILOS, semaforoDe } from '../utils/semaforo.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import { Ban, CalendarPlus } from 'lucide-react';
import Cargando from '../components/comunes/Cargando.jsx';
import Aviso from '../components/comunes/Aviso.jsx';
import Boton from '../components/comunes/Boton.jsx';
import MensajeFlotante from '../components/comunes/MensajeFlotante.jsx';
import TarjetaAlojamiento from '../components/detalle/TarjetaAlojamiento.jsx';
import { TarjetaTitular, TarjetaAcompanantes } from '../components/detalle/TarjetaHuespedes.jsx';
import EstadoDeCuentas from '../components/detalle/EstadoDeCuentas.jsx';
import CargaDeHuespedes from '../components/detalle/CargaDeHuespedes.jsx';
import RegistroDeCobros from '../components/detalle/RegistroDeCobros.jsx';

/** Los cobros en el orden en que se hicieron. */
const porFecha = (a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id;

export default function DetalleReserva() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cargar = useCallback(() => obtenerReservaPorId(id), [id]);
  const { datos: reserva, cargando, error, recargar } = useDatos(cargar);

  const [mensaje, setMensaje] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  // El estado tarda un render en verse: la ref frena el segundo toque de un doble toque
  const enCurso = useRef(false);

  /**
   * Corre una acción contra la API, recarga la reserva y avisa cómo salió.
   * Devuelve true si salió bien, para que el formulario se cierre o se vacíe.
   */
  async function ejecutar(accion, textoExito) {
    if (enCurso.current) return false;
    enCurso.current = true;
    setOcupado(true);
    try {
      await accion();
      await recargar();
      setMensaje({ texto: textoExito, tipo: 'exito' });
      return true;
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo completar la operación', tipo: 'error' });
      return false;
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }

  if (cargando) return <Cargando texto="Cargando la reserva…" />;

  if (!reserva) {
    return (
      <Pantalla encabezado={<Encabezado onVolver={() => navigate('/')} />}>
        <Aviso>{error?.response?.status === 404 ? 'Esta reserva no existe.' : 'No se pudo cargar la reserva. Revisá la conexión y probá de nuevo.'}</Aviso>
      </Pantalla>
    );
  }

  const titular = titularDe(reserva);
  const semaforo = semaforoDe(reserva);
  const pagos = [...(reserva.Pagos ?? [])].sort(porFecha);
  const activa = reserva.estado !== 'Abortada' && reserva.estado !== 'Finalizada';

  // Suma los huéspedes a los que ya estaban (el backend reemplaza la lista entera).
  // Cada uno se crea o actualiza por DNI; si ya estaba vinculado, sólo cambia su rol.
  const vincularHuespedes = (nuevos) =>
    ejecutar(async () => {
      const vinculos = vinculosDe(reserva);
      for (const huesped of nuevos) {
        const guardado = await crearHuesped(soloConDato(huesped));
        const yaVinculado = vinculos.find((v) => v.huespedId === guardado.id);
        if (yaVinculado) yaVinculado.rol = huesped.rol;
        else vinculos.push({ huespedId: guardado.id, rol: huesped.rol });
      }
      await vincularAReserva(id, vinculos);
    }, 'Huéspedes guardados');

  const guardarHuesped = (datos) => ejecutar(() => crearHuesped(datos), 'Datos guardados');

  function quitarAcompanante(huespedId) {
    if (!confirm('¿Quitar a este acompañante de la reserva?')) return;
    ejecutar(
      () => vincularAReserva(id, vinculosDe(reserva).filter((v) => v.huespedId !== huespedId)),
      'Acompañante quitado de la reserva'
    );
  }

  function borrarCobro(pagoId) {
    if (!confirm('¿Borrar este cobro? El saldo se vuelve a calcular.')) return;
    ejecutar(() => eliminarPago(pagoId), 'Cobro borrado');
  }

  function abortar() {
    if (!confirm('¿Cancelar esta reserva? Las fechas quedan libres para otra reserva.')) return;
    ejecutar(() => abortarReserva(id), 'Reserva cancelada');
  }

  // A la pantalla de la que se vino (calendario o historial); si se entró directo por la URL, al calendario
  function volver() {
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  }

  // La continuación arranca el día que termina esta estadía, en la misma cabaña y con el mismo titular
  function agregarDias() {
    navigate('/reservas/nueva', {
      state: { clonarHuesped: titular, cabanaId: reserva.cabanaId, desde: reserva.fechaCheckOut },
    });
  }


  return (
    <Pantalla
      encabezado={
        <Encabezado
          onVolver={volver}
          derecha={
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-lg border ${ESTILOS[semaforo.clave].insignia}`}>
              {semaforo.etiqueta}
            </span>
          }
        />
      }
    >
      <TarjetaAlojamiento
        reserva={reserva}
        ocupado={ocupado}
        onGuardarFechas={(fechas) => ejecutar(() => editarReserva(id, fechas), 'Fechas actualizadas')}
      />

      <EstadoDeCuentas
        reserva={reserva}
        ocupado={ocupado}
        onGuardarMontos={(montos) => ejecutar(() => editarReserva(id, montos), 'Montos actualizados')}
      />

      <RegistroDeCobros
        pagos={pagos}
        saldo={activa ? saldoPendiente(reserva) : 0}
        ocupado={ocupado}
        onRegistrar={(cobro) => ejecutar(() => registrarPago(id, cobro), 'Cobro registrado')}
        onEliminar={borrarCobro}
      />

      <TarjetaTitular titular={titular} ocupado={ocupado} onGuardar={guardarHuesped} />

      <TarjetaAcompanantes
        acompanantes={acompanantesDe(reserva)}
        ocupado={ocupado}
        onGuardar={guardarHuesped}
        onQuitar={quitarAcompanante}
      />

      <CargaDeHuespedes titular={titular} ocupado={ocupado} onVincular={vincularHuespedes} />

      <div className="space-y-2 pt-2">
        <Boton variante="secundario" ancho icono={CalendarPlus} onClick={agregarDias}>
          Extender la estadía
        </Boton>
        {activa && (
          <Boton variante="peligro" ancho icono={Ban} onClick={abortar} disabled={ocupado}>
            Cancelar reserva
          </Boton>
        )}
      </div>

      <MensajeFlotante mensaje={mensaje} onCerrar={setMensaje} />
    </Pantalla>
  );
}
