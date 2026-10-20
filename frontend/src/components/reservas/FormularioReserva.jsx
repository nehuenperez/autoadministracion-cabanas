import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function FormularioReserva({ cabanas, valoresIniciales, onSubmit, cargando, error }) {
  const [form, setForm] = useState({
    cabanaId: valoresIniciales?.cabanaId || '',
    fechaCheckIn: valoresIniciales?.fechaCheckIn || '',
    fechaCheckOut: valoresIniciales?.fechaCheckOut || '',
    montoTotal: valoresIniciales?.montoTotal ? Number(valoresIniciales.montoTotal).toLocaleString('es-AR') : '',
    porcentajeSena: valoresIniciales?.porcentajeSena || '',
  });

  // Estados para las reservas de la cabaña seleccionada y el control del calendario
  const [reservasOcupadas, setReservasOcupadas] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // Carga las reservas activas globales para poder filtrar por cabaña
  useEffect(() => {
    if (!form.cabanaId) return;

    // `cancelado` evita escribir el estado si el usuario cambió de cabaña
    // mientras la petición anterior seguía en curso.
    let cancelado = false;

    async function obtenerFechasBloqueadas() {
      try {
        const { data } = await api.get('/reservas'); // Devuelve solo Señada y Pagada
        const filtradas = data.filter(r => Number(r.cabanaId) === Number(form.cabanaId));
        if (!cancelado) setReservasOcupadas(filtradas);
      } catch (err) {
        console.error("No se pudieron cargar las fechas ocupadas", err);
      }
    }

    obtenerFechasBloqueadas();

    return () => { cancelado = true; };
  }, [form.cabanaId]);

  // La seña es un valor derivado del total y el porcentaje: se calcula durante
  // el render. Tenerlo en un useState + useEffect provocaba un render extra en
  // cada tecla y podía mostrar por un instante el monto de la seña anterior.
  const totalNumerico = Number(String(form.montoTotal).replace(/\D/g, '')) || 0;
  const montoSenaCalculado = Number(
    (totalNumerico * ((Number(form.porcentajeSena) || 0) / 100)).toFixed(2)
  );

  // Sin cabaña elegida no hay fechas bloqueadas que mostrar
  const fechasOcupadas = form.cabanaId ? reservasOcupadas : [];

  // Formateador de moneda regional para miles
  function handleMontoChange(e) {
    const cleanValue = e.target.value.replace(/\D/g, '');
    const formattedValue = cleanValue ? Number(cleanValue).toLocaleString('es-AR') : '';
    setForm(prev => ({ ...prev, montoTotal: formattedValue }));
  }

  // Lógica de validación de fechas bloqueadas
  function verificarDiaOcupado(fechaStr) {
    const target = new Date(fechaStr + 'T00:00:00');
    return fechasOcupadas.some(r => {
      const entrada = new Date(r.fechaCheckIn + 'T00:00:00');
      const salida = new Date(r.fechaCheckOut + 'T00:00:00');
      // Un día está ocupado si cae entre el ingreso (inclusive) y el egreso (exclusive)
      return target >= entrada && target < salida;
    });
  }

  // true si ninguna noche entre el ingreso (inclusive) y el egreso (exclusive) está tomada.
  // Se arma la fecha con los getters locales: toISOString() la pasa a UTC y
  // puede correrla un día según la zona horaria del teléfono.
  function rangoLibre(desdeStr, hastaStr) {
    const fin = new Date(hastaStr + 'T00:00:00');
    for (let d = new Date(desdeStr + 'T00:00:00'); d < fin; d.setDate(d.getDate() + 1)) {
      const checkStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (verificarDiaOcupado(checkStr)) return false;
    }
    return true;
  }

  // Maneja la selección secuencial de Check-In y Check-Out al tocar la grilla
  function seleccionarDiaCalendario(fechaStr) {
    if (!form.fechaCheckIn || (form.fechaCheckIn && form.fechaCheckOut)) {
      setForm(prev => ({ ...prev, fechaCheckIn: fechaStr, fechaCheckOut: '' }));
    } else {
      if (new Date(fechaStr) <= new Date(form.fechaCheckIn)) {
        setForm(prev => ({ ...prev, fechaCheckIn: fechaStr, fechaCheckOut: '' }));
      } else {
        // Validación: verificar que no existan reservas en el medio del rango elegido
        if (!rangoLibre(form.fechaCheckIn, fechaStr)) {
          alert("⚠️ El rango seleccionado se solapa con una reserva existente.");
          return;
        }

        setForm(prev => ({ ...prev, fechaCheckOut: fechaStr }));
        setMostrarCalendario(false); // Cierra el panel al completar el rango
      }
    }
  }

  // Generador de la grilla de días del mes
  function generarDiasMes() {
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);
    
    // Ajuste para que la semana empiece el Lunes (0: Lu, 6: Do)
    let diaSemanaInicio = primerDiaMes.getDay();
    diaSemanaInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;

    const dias = [];
    
    // Espacios vacíos del mes anterior
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Días del mes corriente
    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
      const fechaInstancia = new Date(anio, mes, d);
      const strFecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // El día en que entra otra reserva está "ocupado", pero sirve como egreso:
      // uno se va a la mañana y el otro entra a la tarde (no hay solapamiento).
      const eligiendoCheckOut = form.fechaCheckIn && !form.fechaCheckOut;
      const ocupado = verificarDiaOcupado(strFecha) && strFecha !== form.fechaCheckOut &&
        !(eligiendoCheckOut && strFecha > form.fechaCheckIn && rangoLibre(form.fechaCheckIn, strFecha));
      const esCheckIn = form.fechaCheckIn === strFecha;
      const esCheckOut = form.fechaCheckOut === strFecha;
      const dentroDelRango = form.fechaCheckIn && form.fechaCheckOut && 
                             fechaInstancia > new Date(form.fechaCheckIn + 'T00:00:00') && 
                             fechaInstancia < new Date(form.fechaCheckOut + 'T00:00:00');

      let clasesEstilo = "text-slate-700 hover:bg-slate-100 font-medium rounded-lg cursor-pointer transition-all duration-150";
      
      if (ocupado) {
        clasesEstilo = "text-slate-300 line-through bg-slate-50/70 cursor-not-allowed pointer-events-none";
      } else if (esCheckIn || esCheckOut) {
        clasesEstilo = "bg-blue-600 text-white font-bold rounded-lg shadow-xs scale-105";
      } else if (dentroDelRango) {
        clasesEstilo = "bg-blue-50 text-blue-700 font-semibold rounded-none";
      }

      dias.push(
        <button
          type="button"
          key={`day-${d}`}
          disabled={ocupado}
          onClick={() => seleccionarDiaCalendario(strFecha)}
          className={`p-2.5 text-center text-xs flex items-center justify-center min-h-[38px] ${clasesEstilo}`}
        >
          {d}
        </button>
      );
    }

    return dias;
  }

  function cambiarMes(factor) {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + factor, 1));
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '__ /__ /____';
    const [a, m, d] = dateStr.split('-');
    return `${d}/${m}/${a}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.fechaCheckIn || !form.fechaCheckOut) {
      alert("Por favor seleccione un rango válido de estadía en el calendario.");
      return;
    }
    const totalNumeric = Number(String(form.montoTotal).replace(/\D/g, '')) || 0;

    onSubmit({
      cabanaId: Number(form.cabanaId),
      fechaCheckIn: form.fechaCheckIn,
      fechaCheckOut: form.fechaCheckOut,
      montoTotal: totalNumeric,
      porcentajeSena: form.porcentajeSena === '' ? 0 : Number(form.porcentajeSena),
    });
  }

  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Selección de Cabaña */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Cabaña Seleccionada
        </label>
        <select
          value={form.cabanaId}
          onChange={(e) => {
            setForm(prev => ({ ...prev, cabanaId: e.target.value, fechaCheckIn: '', fechaCheckOut: '' }));
          }}
          required
          className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition"
        >
          <option value="">Seleccionar cabaña...</option>
          {cabanas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Disparador Táctil del Selector de Fechas */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Período de Estadía
        </label>
        <button
          type="button"
          disabled={!form.cabanaId}
          onClick={() => setMostrarCalendario(!mostrarCalendario)}
          className="w-full grid grid-cols-2 gap-2 text-left p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden disabled:opacity-50 transition cursor-pointer min-h-[48px]"
        >
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Ingreso</span>
            <span className="text-xs font-bold text-slate-700">{formatDisplayDate(form.fechaCheckIn)}</span>
          </div>
          <div className="border-l border-slate-200 pl-3">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Egreso</span>
            <span className="text-xs font-bold text-slate-700">{formatDisplayDate(form.fechaCheckOut)}</span>
          </div>
        </button>
      </div>

      {/* Panel del Calendario Premium Integrado */}
      {mostrarCalendario && form.cabanaId && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3 animate-fadeIn">
          
          {/* Encabezado del Mes */}
          <div className="flex justify-between items-center px-1">
            <button type="button" onClick={() => cambiarMes(-1)} className="p-1 text-slate-400 hover:text-slate-800 text-sm font-bold">←</button>
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              {nombresMeses[mesActual.getMonth()]} {mesActual.getFullYear()}
            </span>
            <button type="button" onClick={() => cambiarMes(1)} className="p-1 text-slate-400 hover:text-slate-800 text-sm font-bold">→</button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5">
            <div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sa</div><div>Do</div>
          </div>

          {/* Días del Mes */}
          <div className="grid grid-cols-7 gap-1">
            {generarDiasMes()}
          </div>

          <p className="text-[10px] text-slate-400 font-medium text-center pt-1">
            Toca el día de ingreso y luego el de egreso.
          </p>
        </div>
      )}

      {/* Monto Total */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Monto Total del Alquiler ($)
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Ej: 120.000"
          value={form.montoTotal}
          onChange={handleMontoChange}
          required
          className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition"
        />
      </div>

      {/* Porcentaje de seña */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Porcentaje de Seña (Opcional)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="Dejalo vacío si no aplica"
          value={form.porcentajeSena}
          onChange={(e) => setForm(prev => ({ ...prev, porcentajeSena: e.target.value }))}
          className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition"
        />
      </div>

      {/* Seña Preliminar */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-medium">
        <span className="text-slate-400">Monto de seña preliminar:</span>
        <span className="font-bold text-slate-900">${montoSenaCalculado.toLocaleString('es-AR')}</span>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-center text-xs font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl font-bold transition text-xs shadow-xs tracking-wide uppercase disabled:bg-slate-300"
      >
        {cargando ? 'Registrando...' : 'Confirmar Reserva'}
      </button>
    </form>
  );
}