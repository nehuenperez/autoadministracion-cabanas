import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { abortarReserva, editarReserva, obtenerReservaPorId } from '../services/reservas.service.js';
import { eliminarPago, registrarPago } from '../services/pagos.service.js';
import { crearHuesped, vincularAReserva } from '../services/huespedes.service.js';
import { useDatos } from '../hooks/useDatos.js';
import { acompanantesDe, titularDe, vinculosDe } from '../utils/reservas.js';
import { soloConDato } from '../utils/huespedes.js';
import { ESTILOS, semaforoDe } from '../utils/semaforo.js';
import Pantalla from '../components/layout/Pantalla.jsx';
import Encabezado from '../components/layout/Encabezado.jsx';
import Cargando from '../components/comunes/Cargando.jsx';
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

  if (cargando) return <Cargando />;

  if (!reserva) {
    return (
      <div className="p-6 max-w-sm mx-auto mt-16 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
        <p className="text-slate-800 font-bold text-sm mb-4">
          {error?.response?.status === 404 ? 'La reserva no existe' : 'No se pudo cargar la reserva'}
        </p>
        <button type="button" onClick={() => navigate('/')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
          Volver
        </button>
      </div>
    );
  }

  const titular = titularDe(reserva);
  const semaforo = semaforoDe(reserva);
  const pagos = [...(reserva.Pagos ?? [])].sort(porFecha);

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
    }, '✨ Huéspedes vinculados correctamente');

  const guardarHuesped = (datos) => ejecutar(() => crearHuesped(datos), '✨ Datos modificados correctamente');

  function quitarAcompanante(huespedId) {
    if (!confirm('¿Deseás remover este acompañante de la reserva?')) return;
    ejecutar(
      () => vincularAReserva(id, vinculosDe(reserva).filter((v) => v.huespedId !== huespedId)),
      '🗑️ Acompañante removido'
    );
  }

  function borrarCobro(pagoId) {
    if (!confirm('¿Deseás borrar este registro de cobro?')) return;
    ejecutar(() => eliminarPago(pagoId), '🗑️ Cobro eliminado correctamente');
  }

  function abortar() {
    if (!confirm('¿Confirmás cancelar esta reserva?')) return;
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
          izquierda={
            <button type="button" onClick={volver} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer">
              ← Volver
            </button>
          }
          derecha={
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${ESTILOS[semaforo.clave].insignia}`}>
              {semaforo.etiqueta}
            </span>
          }
        />
      }
    >
      <TarjetaAlojamiento
        reserva={reserva}
        colorDeBorde={ESTILOS[semaforo.clave].borde}
        ocupado={ocupado}
        onGuardarFechas={(fechas) => ejecutar(() => editarReserva(id, fechas), '✨ Fechas modificadas correctamente')}
      />

      <TarjetaTitular titular={titular} ocupado={ocupado} onGuardar={guardarHuesped} />

      <TarjetaAcompanantes
        acompanantes={acompanantesDe(reserva)}
        ocupado={ocupado}
        onGuardar={guardarHuesped}
        onQuitar={quitarAcompanante}
      />

      <EstadoDeCuentas
        reserva={reserva}
        titular={titular}
        ocupado={ocupado}
        onGuardarMontos={(montos) => ejecutar(() => editarReserva(id, montos), '✨ Montos corregidos correctamente')}
      />

      <CargaDeHuespedes titular={titular} ocupado={ocupado} onVincular={vincularHuespedes} />

      <RegistroDeCobros
        pagos={pagos}
        ocupado={ocupado}
        onRegistrar={(cobro) => ejecutar(() => registrarPago(id, cobro), '✅ Cobro registrado')}
        onEliminar={borrarCobro}
      />

      <div className="flex flex-col gap-2 pt-2">
        <button type="button" onClick={agregarDias} className="w-full bg-white text-slate-700 border border-slate-200 p-3 rounded-xl font-semibold transition text-xs active:bg-slate-50 cursor-pointer">
          🗓️ Cliente desea agregar días
        </button>
        {reserva.estado !== 'Abortada' && reserva.estado !== 'Finalizada' && (
          <button
            type="button"
            onClick={abortar}
            disabled={ocupado}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-3 rounded-xl font-bold transition text-xs cursor-pointer"
          >
            Cancelar reserva (Abortar)
          </button>
        )}
      </div>

      <MensajeFlotante mensaje={mensaje} onCerrar={setMensaje} />
    </Pantalla>
  );
}
