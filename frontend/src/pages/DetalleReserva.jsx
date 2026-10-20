import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  obtenerReservaPorId,
  abortarReserva,
} from '../services/reservas.service.js';
import { listarPagos, registrarPago } from '../services/pagos.service.js';
import { vincularAReserva, crearHuesped } from '../services/huespedes.service.js';
import BuscadorPorDni from '../components/reservas/BuscadorPorDni.jsx';
import CargaRapidaHuespedes from '../components/reservas/CargaRapidaHuespedes.jsx';
import BotonWhatsapp from '../components/reservas/BotonWhatsapp.jsx';
import api from '../services/api.js'; 

export default function DetalleReserva() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reserva, setReserva] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [huespedesForm, setHuespedesForm] = useState({});
  const [nuevoPago, setNuevoPago] = useState({ monto: '', metodoPago: 'Efectivo' });
  const [mensajeAccion, setMensajeAccion] = useState('');

  const [idHuespedEditando, setIdHuespedEditando] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [editandoFechas, setEditandoFechas] = useState(false);
  const [formFechas, setFormFechas] = useState({ fechaCheckIn: '', fechaCheckOut: '' });

  // NUEVOS ESTADOS: Controlan la edición de los montos de la estadía
  const [editandoCuentas, setEditandoCuentas] = useState(false);
  const [formCuentas, setFormCuentas] = useState({ montoTotal: '', porcentajeSena: '' });

  // useCallback para que la referencia sólo cambie cuando cambia el id: así el
  // efecto de abajo puede declararla como dependencia sin recargar en bucle.
  const cargarTodo = useCallback(async () => {
    setCargando(true);
    try {
      const [reservaData, pagosData] = await Promise.all([
        obtenerReservaPorId(id),
        listarPagos(id),
      ]);
      setReserva(reservaData);
      setPagos(pagosData);
      
      setFormFechas({
        fechaCheckIn: reservaData.fechaCheckIn || '',
        fechaCheckOut: reservaData.fechaCheckOut || ''
      });

      // Precargamos el total formateado regionalmente y el porcentaje de seña
      setFormCuentas({
        montoTotal: Number(reservaData.montoTotal || 0).toLocaleString('es-AR'),
        porcentajeSena: String(Number(reservaData.porcentajeSena || 0))
      });
    } catch {
      setError('No se pudo cargar la reserva');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    // La regla apunta a los casos de estado derivado, que deberían calcularse
    // en el render. Acá se trata de una carga de datos al montar: marcar
    // "cargando" antes de pedir a la API es justamente lo que corresponde.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTodo();
  }, [cargarTodo]);

  async function handleGuardarFechas() {
    try {
      setMensajeAccion('Actualizando fechas en el calendario...');
      await api.put(`/reservas/${id}`, formFechas);
      setMensajeAccion('✨ Fechas modificadas correctamente');
      setEditandoFechas(false);
      cargarTodo();
    } catch (err) {
      setMensajeAccion(err.response?.data?.error || 'No se pudieron actualizar las fechas');
    }
  }

  // Limpia los puntos del total y guarda. La seña se manda como porcentaje:
  // el backend calcula el monto y descarta un montoSena que venga del cliente.
  async function handleGuardarMontos() {
    try {
      setMensajeAccion('Recalculando estado de cuentas...');

      await api.put(`/reservas/${id}`, {
        montoTotal: Number(String(formCuentas.montoTotal).replace(/\D/g, '')) || 0,
        porcentajeSena: Number(formCuentas.porcentajeSena) || 0,
      });

      setMensajeAccion('✨ Montos corregidos correctamente');
      setEditandoCuentas(false);
      cargarTodo();
    } catch (err) {
      setMensajeAccion(err.response?.data?.error || 'No se pudieron actualizar los valores financieros');
    }
  }

  function handleHuespedListo(datos) {
    setHuespedesForm((prev) => ({ ...prev, [datos.rol]: datos }));
  }

  function iniciarEdicion(h) {
    setIdHuespedEditando(h.id);
    setEditForm({
      id: h.id,
      dni: h.dni,
      cuil: h.cuil || '',
      nombre: h.nombre,
      apellido: h.apellido,
      telefono: h.telefono || '',
      direccion: h.direccion || '',
      vehiculoModelo: h.vehiculoModelo || '',
      vehiculoPatente: h.vehiculoPatente || '',
      notasComportamiento: h.notasComportamiento || '',
      rol: h.ReservaHuesped?.rol
    });
  }

  async function guardarCambiosHuesped() {
    try {
      setMensajeAccion('Actualizando datos...');
      await crearHuesped(editForm);

      const huespedesAEnviar = reserva.Huespeds.map((h) => {
        if (h.id === editForm.id) {
          return { huespedId: editForm.id, ...editForm };
        }
        return {
          huespedId: h.id,
          dni: h.dni,
          nombre: h.nombre,
          apellido: h.apellido,
          telefono: h.telefono,
          direccion: h.direccion,
          vehiculoModelo: h.vehiculoModelo,
          vehiculoPatente: h.vehiculoPatente,
          rol: h.ReservaHuesped?.rol
        };
      });

      await vincularAReserva(id, huespedesAEnviar);
      setMensajeAccion('✨ Datos modificados correctamente');
      setIdHuespedEditando(null);
      cargarTodo();
    } catch {
      setMensajeAccion('Error al modificar los datos del huésped');
    }
  }

  async function eliminarAcompanante(huespedId) {
    if (!confirm('¿Deseás remover este acompañante de la reserva?')) return;
    try {
      setMensajeAccion('Removiendo...');
      const huespedesRestantes = reserva.Huespeds
        .filter((h) => h.id !== huespedId)
        .map((h) => ({
          huespedId: h.id,
          dni: h.dni,
          nombre: h.nombre,
          apellido: h.apellido,
          telefono: h.telefono,
          direccion: h.direccion,
          vehiculoModelo: h.vehiculoModelo,
          vehiculoPatente: h.vehiculoPatente,
          rol: h.ReservaHuesped?.rol
        }));

      await vincularAReserva(id, huespedesRestantes);
      setMensajeAccion('🗑️ Acompañante removido');
      cargarTodo();
    } catch {
      setMensajeAccion('Error al eliminar el acompañante');
    }
  }

  async function guardarHuespedes() {
    const titularActual = reserva.Huespeds?.find((h) => h.ReservaHuesped?.rol === 'titular');
    const titularEnFormulario = huespedesForm.titular;

    if (!titularActual && (!titularEnFormulario || !titularEnFormulario.dni)) {
      setMensajeAccion('⚠️ Completá los datos del titular obligatoriamente.');
      return;
    }

    if (Object.keys(huespedesForm).length === 0) {
      setMensajeAccion('⚠️ No hay ningún dato de huésped listo para guardar.');
      return;
    }

    try {
      setMensajeAccion('Procesando...');
      // El backend reemplaza todos los vínculos de la reserva: hay que mandar
      // también los que ya estaban, o los acompañantes cargados antes se pierden.
      const vinculos = (reserva.Huespeds || []).map((h) => ({ huespedId: h.id, rol: h.ReservaHuesped?.rol }));

      for (const h of Object.values(huespedesForm)) {
        // crearHuesped crea o actualiza según el DNI, así que también guarda lo
        // que se corrigió de un huésped que ya existía. Sólo se mandan los campos
        // con dato para no borrar lo guardado de una visita anterior.
        const datos = {};
        for (const campo of ['dni', 'nombre', 'apellido', 'telefono', 'direccion', 'vehiculoModelo', 'vehiculoPatente']) {
          const valor = String(h[campo] ?? '').trim();
          if (valor) datos[campo] = valor;
        }
        const guardado = await crearHuesped(datos);

        const yaVinculado = vinculos.find((v) => v.huespedId === guardado.id);
        if (yaVinculado) {
          yaVinculado.rol = h.rol;
        } else {
          vinculos.push({ huespedId: guardado.id, rol: h.rol });
        }
      }

      await vincularAReserva(id, vinculos);
      setMensajeAccion('✨ Huéspedes vinculados correctamente');
      setHuespedesForm({});
      cargarTodo();
    } catch (err) {
      setMensajeAccion(err.response?.data?.error || 'Error al guardar huéspedes');
    }
  }

  // Guarda los huéspedes revisados en la carga rápida y los suma a los que ya
  // estaban vinculados. Devuelve true si salió bien, para que el componente
  // limpie el formulario.
  async function vincularDesdeMensaje(filas) {
    try {
      setMensajeAccion('Guardando huéspedes...');
      const vinculos = (reserva.Huespeds || []).map((h) => ({ huespedId: h.id, rol: h.ReservaHuesped?.rol }));

      for (const fila of filas) {
        // crearHuesped crea o actualiza según el DNI. Se mandan sólo los campos
        // con dato: un campo vacío no debe borrar lo que ya estaba guardado de
        // una visita anterior.
        const datos = {};
        for (const campo of ['nombre', 'apellido', 'dni', 'cuil', 'telefono', 'direccion', 'vehiculoModelo', 'vehiculoPatente']) {
          const valor = fila[campo].trim();
          if (valor) datos[campo] = valor;
        }
        const guardado = await crearHuesped(datos);

        const yaVinculado = vinculos.find((v) => v.huespedId === guardado.id);
        if (yaVinculado) {
          yaVinculado.rol = fila.rol;
        } else {
          vinculos.push({ huespedId: guardado.id, rol: fila.rol });
        }
      }

      await vincularAReserva(id, vinculos);
      setMensajeAccion('✨ Huéspedes vinculados correctamente');
      cargarTodo();
      return true;
    } catch (err) {
      setMensajeAccion(err.response?.data?.error || 'Error al guardar huéspedes');
      return false;
    }
  }

  async function handleRegistrarPago(e) {
    e.preventDefault();
    const totalNumeric = Number(String(nuevoPago.monto).replace(/\D/g, '')) || 0;
    if (totalNumeric <= 0) return;

    try {
      await registrarPago(id, { monto: totalNumeric, metodoPago: nuevoPago.metodoPago });
      setNuevoPago({ monto: '', metodoPago: 'Efectivo' });
      setMensajeAccion('✅ Cobro registrado');
      cargarTodo();
    } catch (err) {
      setMensajeAccion(err.response?.data?.error || 'Error al registrar el pago');
    }
  }

  async function handleEliminarPago(pagoId) {
    if (!confirm('¿Deseás borrar este registro de cobro?')) return;
    try {
      setMensajeAccion('Removiendo cobro...');
      await api.delete(`/pagos/${pagoId}`);
      setMensajeAccion('🗑️ Cobro eliminado correctamente');
      cargarTodo();
    } catch (err) {
      setMensajeAccion(err.response?.data?.error || 'No se pudo eliminar el cobro');
    }
  }

  async function handleAbortar() {
    if (!confirm('¿Confirmás cancelar esta reserva?')) return;
    try {
      await abortarReserva(id);
      cargarTodo();
    } catch {
      setMensajeAccion('Error al cancelar la reserva');
    }
  }

  function handleAgregarDias() {
    navigate('/reservas/nueva', {
      state: titularActual ? { clonarHuesped: titularActual } : undefined,
    });
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/60">
        <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-400 tracking-wider uppercase">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-sm mx-auto mt-16 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
        <p className="text-slate-800 font-bold text-sm mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">Volver</button>
      </div>
    );
  }

  const titularActual = reserva.Huespeds?.find((h) => h.ReservaHuesped?.role === 'titular' || h.ReservaHuesped?.rol === 'titular');
  const acompanantes = reserva.Huespeds?.filter((h) => h.ReservaHuesped?.role === 'acompañante' || h.ReservaHuesped?.rol === 'acompañante') || [];
  const totalPagado = pagos.reduce((acum, p) => acum + Number(p.monto), 0);
  const saldoPendiente = Number(reserva.montoTotal) - totalPagado;

  let semaforoAccent = 'border-l-sky-500';
  let semaforoBadge = 'bg-sky-50 text-sky-700 border-sky-100';
  let semaforoLabel = 'Señada';

  if (reserva.estado === 'Abortada') {
    semaforoAccent = 'border-l-orange-400';
    semaforoBadge = 'bg-orange-50 text-orange-700 border-orange-100';
    semaforoLabel = 'Abortada';
  } else if (reserva.estado === 'Finalizada') {
    semaforoAccent = 'border-l-slate-400';
    semaforoBadge = 'bg-slate-100 text-slate-700 border-slate-200';
    semaforoLabel = 'Finalizada';
  } else if (saldoPendiente <= 0) {
    semaforoAccent = 'border-l-emerald-500';
    semaforoBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    semaforoLabel = 'Pagada';
  } else {
    const [anio, mes, dia] = reserva.fechaCheckIn.split('-').map(Number);
    const checkInFecha = new Date(anio, mes - 1, dia);
    const ahora = new Date();
    ahora.setHours(0,0,0,0);
    checkInFecha.setHours(0,0,0,0);
    const diferenciaDias = (checkInFecha - ahora) / (1000 * 60 * 60 * 24);

    if (diferenciaDias < 0) {
      semaforoAccent = 'border-l-rose-500';
      semaforoBadge = 'bg-rose-50 text-rose-700 border-rose-100';
      semaforoLabel = 'Saldo Pendiente';
    } else if (diferenciaDias <= 1) {
      semaforoAccent = 'border-l-amber-500';
      semaforoBadge = 'bg-amber-50 text-amber-700 border-amber-100';
      semaforoLabel = 'Check-in Próximo';
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16 text-slate-800 antialiased">
      
      {/* Barra superior */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-3.5 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer">
          ← Volver
        </button>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${semaforoBadge}`}>
          {semaforoLabel}
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 mt-5 space-y-4">
        
        {/* Card 1: Cabaña */}
        <div className={`bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 border-l-4 ${semaforoAccent} space-y-3`}>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Alojamiento</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{reserva.Cabana?.nombre}</h2>
            </div>
            {!editandoFechas && reserva.estado !== 'Abortada' && (
              <button 
                onClick={() => setEditandoFechas(true)} 
                className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ⚙️ Editar fechas
              </button>
            )}
          </div>

          {editandoFechas ? (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Nuevo Check-In</label>
                  <input 
                    type="date" 
                    value={formFechas.fechaCheckIn} 
                    onChange={(e) => setFormFechas({ ...formFechas, fechaCheckIn: e.target.value })} 
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Nuevo Check-Out</label>
                  <input 
                    type="date" 
                    value={formFechas.fechaCheckOut} 
                    onChange={(e) => setFormFechas({ ...formFechas, fechaCheckOut: e.target.value })} 
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-2 text-xs font-bold pt-1">
                <button onClick={handleGuardarFechas} className="flex-1 bg-blue-600 text-white p-2 rounded-xl cursor-pointer shadow-xs">
                  Guardar Cambios
                </button>
                <button onClick={() => { setEditandoFechas(false); cargarTodo(); }} className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-3.5 border-t border-slate-100 text-xs">
              <div>
                <p className="font-semibold text-slate-400 mb-0.5">Check-In</p>
                <p className="font-bold text-slate-700 text-sm">{reserva.fechaCheckIn}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-400 mb-0.5">Check-Out</p>
                <p className="font-bold text-slate-700 text-sm">{reserva.fechaCheckOut}</p>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Titular */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Responsable Titular</h3>
            {titularActual && idHuespedEditando !== titularActual.id && (
              <button onClick={() => iniciarEdicion(titularActual)} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm cursor-pointer">
                Editar datos
              </button>
            )}
          </div>

          {titularActual ? (
            idHuespedEditando === titularActual.id ? (
              <div className="space-y-2.5 text-xs pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={editForm.nombre} onChange={(e) => setEditForm({...editForm, nombre: e.target.value})} placeholder="Nombre" className="p-2 border border-slate-200 rounded-lg bg-slate-50" />
                  <input type="text" value={editForm.apellido} onChange={(e) => setEditForm({...editForm, apellido: e.target.value})} placeholder="Apellido" className="p-2 border border-slate-200 rounded-lg bg-slate-50" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={editForm.telefono} onChange={(e) => setEditForm({...editForm, telefono: e.target.value})} placeholder="Teléfono" className="p-2 border border-slate-200 rounded-lg bg-slate-50" />
                  <input type="text" value={editForm.cuil} onChange={(e) => setEditForm({...editForm, cuil: e.target.value})} placeholder="CUIL" className="p-2 border border-slate-200 rounded-lg bg-slate-50" />
                </div>
                <input type="text" value={editForm.direccion} onChange={(e) => setEditForm({...editForm, direccion: e.target.value})} placeholder="Dirección" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={editForm.vehiculoModelo} onChange={(e) => setEditForm({...editForm, vehiculoModelo: e.target.value})} placeholder="Vehículo Modelo" className="p-2 border border-slate-200 rounded-lg bg-slate-50" />
                  <input type="text" value={editForm.vehiculoPatente} onChange={(e) => setEditForm({...editForm, vehiculoPatente: e.target.value})} placeholder="Patente" className="p-2 border border-slate-200 rounded-lg bg-slate-50" />
                </div>
                <textarea value={editForm.notasComportamiento} onChange={(e) => setEditForm({...editForm, notasComportamiento: e.target.value})} placeholder="Notas de comportamiento" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 h-16" />
                <div className="flex gap-2 pt-1">
                  <button onClick={guardarCambiosHuesped} className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-bold cursor-pointer">Guardar</button>
                  <button onClick={() => setIdHuespedEditando(null)} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold cursor-pointer">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900 capitalize tracking-tight">{titularActual.nombre} {titularActual.apellido}</h4>
                <div className="grid grid-cols-1 gap-1.5 text-xs font-medium text-slate-600">
                  <p className="text-slate-500">DNI: <span className="text-slate-800 font-semibold">{titularActual.dni}</span></p>
                  {titularActual.cuil && <p className="text-slate-500">CUIL: <span className="text-slate-800 font-semibold">{titularActual.cuil}</span></p>}
                  {titularActual.telefono && <p className="text-slate-500">Tel: <span className="text-slate-800 font-semibold">{titularActual.telefono}</span></p>}
                  {titularActual.direccion && <p className="text-slate-500">Dir: <span className="text-slate-800 font-semibold">{titularActual.direccion}</span></p>}
                  {titularActual.vehiculoPatente && (
                    <div className="mt-1 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-semibold flex items-center gap-1.5">
                      <span>🚗</span> {titularActual.vehiculoModelo} — <span className="font-mono bg-slate-200/60 px-1 rounded">{titularActual.vehiculoPatente}</span>
                    </div>
                  )}
                </div>
                {titularActual.notasComportamiento && (
                  <div className="mt-2 p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg text-xs text-amber-900">
                    {titularActual.notasComportamiento}
                  </div>
                )}
              </div>
            )
          ) : (
            <p className="text-xs font-bold text-rose-600 bg-rose-50/60 border border-rose-100 p-3 rounded-lg text-center">
              ⚠️ Falta registrar los datos del titular
            </p>
          )}
        </div>

        {/* Card 3: Acompañantes */}
        {acompanantes.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/70">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Acompañantes ({acompanantes.length})</h3>
            <div className="space-y-2.5">
              {acompanantes.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50/60 rounded-lg border border-slate-100 text-xs space-y-2">
                  {idHuespedEditando === a.id ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={editForm.nombre} onChange={(e) => setEditForm({...editForm, nombre: e.target.value})} placeholder="Nombre" className="p-2 border border-slate-200 rounded-lg bg-white" />
                        <input type="text" value={editForm.apellido} onChange={(e) => setEditForm({...editForm, apellido: e.target.value})} placeholder="Apellido" className="p-2 border border-slate-200 rounded-lg bg-white" />
                      </div>
                      <input type="text" value={editForm.telefono} onChange={(e) => setEditForm({...editForm, telefono: e.target.value})} placeholder="Teléfono" className="w-full p-2 border border-slate-200 rounded-lg bg-white" />
                      <div className="flex gap-2 pt-1">
                        <button onClick={guardarCambiosHuesped} className="flex-1 bg-blue-600 text-white p-1.5 rounded-lg font-bold cursor-pointer">Guardar</button>
                        <button onClick={() => setIdHuespedEditando(null)} className="bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{a.nombre} {a.apellido}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">DNI {a.dni} {a.telefono && `| Tel: ${a.telefono}`}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => iniciarEdicion(a)} className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded cursor-pointer">Editar</button>
                        <button onClick={() => eliminarAcompanante(a.id)} className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 cursor-pointer">Quitar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card 4: Estado de Cuentas (CON PANEL DE INTERFAZ DE EDICIÓN DE MONTOS FINANCIEROS) */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de Cuentas</h3>
            {!editandoCuentas && reserva.estado !== 'Abortada' && (
              <button 
                onClick={() => setEditandoCuentas(true)} 
                className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ⚙️ Editar montos
              </button>
            )}
          </div>

          {editandoCuentas ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Monto Total ($)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={formCuentas.montoTotal} 
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setFormCuentas({ ...formCuentas, montoTotal: clean ? Number(clean).toLocaleString('es-AR') : '' });
                    }} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Seña (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formCuentas.porcentajeSena}
                    onChange={(e) => setFormCuentas({ ...formCuentas, porcentajeSena: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Seña requerida: <span className="font-bold text-slate-800">
                  ${Number(((Number(String(formCuentas.montoTotal).replace(/\D/g, '')) || 0) * (Number(formCuentas.porcentajeSena) || 0) / 100).toFixed(2)).toLocaleString('es-AR')}
                </span>
              </p>
              <div className="flex gap-2 text-xs font-bold pt-1.5">
                <button onClick={handleGuardarMontos} className="flex-1 bg-emerald-600 text-white p-2 rounded-xl cursor-pointer shadow-xs">
                  Guardar Montos
                </button>
                <button onClick={() => { setEditandoCuentas(false); cargarTodo(); }} className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block mb-0.5">Monto Total</span>
                  <span className="text-base font-bold text-slate-900">${Number(reserva.montoTotal).toLocaleString('es-AR')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Seña Requerida</span>
                  <span className="text-base font-bold text-slate-700">${Number(reserva.montoSena).toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Pagado hasta hoy</span>
                  <span className="text-sm font-bold text-emerald-600">${totalPagado.toLocaleString('es-AR')}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block mb-0.5">Saldo Pendiente</span>
                  <span className={`text-base font-black ${saldoPendiente <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${saldoPendiente.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </>
          )}
          
          {titularActual?.telefono && (
            <div className="pt-1">
              <BotonWhatsapp
                telefono={titularActual.telefono}
                mensaje={`Hola, *${titularActual.nombre}* 😊\n¡Los esperamos pronto en Aroma del Potrero 🌿!\n\nLes recordamos algunos detalles previos a su llegada:\n...`}
              />
            </div>
          )}
        </div>

        {/* Card 5: Operativa - Carga de Huéspedes */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {titularActual ? 'Agregar acompañantes' : 'Asignar Huéspedes'}
          </h3>
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Carga rápida: pegá el mensaje</span>
            <CargaRapidaHuespedes titularActual={titularActual} onConfirmar={vincularDesdeMensaje} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">o cargalos a mano</p>
          <div className="space-y-3">
            {!titularActual && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Paso 1: Cargar Titular</span>
                <BuscadorPorDni rol="titular" onHuespedListo={handleHuespedListo} />
              </div>
            )}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cargar Acompañante</span>
              <BuscadorPorDni rol="acompañante" onHuespedListo={handleHuespedListo} />
            </div>
          </div>
          <button type="button" onClick={guardarHuespedes} className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer">
            Vincular Huéspedes a la Reserva
          </button>
          {mensajeAccion && (
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg text-center text-xs font-semibold">
              {mensajeAccion}
            </div>
          )}
        </div>

        {/* Card 6: Cobros */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Registro de Cobros</h3>
          <div className="space-y-2">
            {pagos.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 bg-slate-50/50 p-3 rounded-lg text-center border border-dashed border-slate-200">
                No hay pagos registrados aún.
              </p>
            ) : (
              <div className="space-y-1.5">
                {pagos.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold">
                    <div>
                      <p className="font-bold text-slate-800">${Number(p.monto).toLocaleString('es-AR')}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.fecha}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px] uppercase font-bold text-slate-500">
                        {p.metodoPago}
                      </span>
                      <button type="button" onClick={() => handleEliminarPago(p.id)} className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg transition text-xs cursor-pointer">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleRegistrarPago} className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Monto a cobrar ($)"
              value={nuevoPago.monto}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '');
                const formatted = clean ? Number(clean).toLocaleString('es-AR') : '';
                setNuevoPago({ ...nuevoPago, monto: formatted });
              }}
              className="w-full p-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition"
            />
            <div className="flex gap-2">
              <select value={nuevoPago.metodoPago} onChange={(e) => setNuevoPago({ ...nuevoPago, metodoPago: e.target.value })} className="p-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/50">
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
              </select>
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer">
                Registrar Cobro
              </button>
            </div>
          </form>
        </div>

        {/* Acciones Administrativas */}
        <div className="flex flex-col gap-2 pt-2">
          <button type="button" onClick={handleAgregarDias} className="w-full bg-white text-slate-700 border border-slate-200 p-3 rounded-xl font-semibold transition text-xs active:bg-slate-50 cursor-pointer">
            🗓️ Cliente desea agregar días
          </button>
          {reserva.estado !== 'Abortada' && reserva.estado !== 'Finalizada' && (
            <button type="button" onClick={handleAbortar} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-3 rounded-xl font-bold transition text-xs cursor-pointer">
              Cancelar reserva (Abortar)
            </button>
          )}
        </div>

      </div>
    </div>
  );
}