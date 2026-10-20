import { useState } from 'react';
import { formatearFecha } from '../../utils/fechas.js';
import { calcularSena, formatearMonto, parsearMonto } from '../../utils/montos.js';
import CampoMonto from '../comunes/CampoMonto.jsx';
import Aviso from '../comunes/Aviso.jsx';
import SelectorDeFechas from './SelectorDeFechas.jsx';

const rotulo = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5';
const campo =
  'w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition';

/**
 * Alta de reserva: cabaña, estadía, total y porcentaje de seña.
 * `reservasActivas` son las Señadas y Pagadas: definen qué días están tomados.
 * `inicial` permite precargar cabaña e ingreso (cuando el cliente agrega días).
 */
export default function FormularioReserva({ cabanas, reservasActivas, inicial = {}, onSubmit, cargando, error }) {
  const [form, setForm] = useState({
    cabanaId: inicial.cabanaId ? String(inicial.cabanaId) : '',
    fechaCheckIn: inicial.fechaCheckIn || '',
    fechaCheckOut: '',
    montoTotal: '',
    porcentajeSena: '',
  });
  const [mostrarCalendario, setMostrarCalendario] = useState(Boolean(inicial.fechaCheckIn));
  const [errorLocal, setErrorLocal] = useState('');

  const actualizar = (cambios) => setForm((anterior) => ({ ...anterior, ...cambios }));
  const ocupadas = reservasActivas.filter((r) => Number(r.cabanaId) === Number(form.cabanaId));
  const sena = calcularSena(parsearMonto(form.montoTotal), form.porcentajeSena);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.fechaCheckIn || !form.fechaCheckOut) {
      setErrorLocal('Elegí en el calendario el día de ingreso y el de egreso.');
      setMostrarCalendario(true);
      return;
    }
    onSubmit({
      cabanaId: Number(form.cabanaId),
      fechaCheckIn: form.fechaCheckIn,
      fechaCheckOut: form.fechaCheckOut,
      montoTotal: parsearMonto(form.montoTotal),
      porcentajeSena: Number(form.porcentajeSena) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={rotulo}>Cabaña Seleccionada</label>
        <select
          value={form.cabanaId}
          onChange={(e) => {
            // Otra cabaña tiene otros días ocupados: las fechas elegidas dejan de valer
            actualizar({ cabanaId: e.target.value, fechaCheckIn: '', fechaCheckOut: '' });
            setErrorLocal('');
          }}
          required
          className={campo}
        >
          <option value="">Seleccionar cabaña...</option>
          {cabanas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={rotulo}>Período de Estadía</label>
        <button
          type="button"
          disabled={!form.cabanaId}
          onClick={() => setMostrarCalendario(!mostrarCalendario)}
          className="w-full grid grid-cols-2 gap-2 text-left p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden disabled:opacity-50 transition cursor-pointer min-h-12"
        >
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Ingreso</span>
            <span className="text-xs font-bold text-slate-700">{formatearFecha(form.fechaCheckIn)}</span>
          </div>
          <div className="border-l border-slate-200 pl-3">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Egreso</span>
            <span className="text-xs font-bold text-slate-700">{formatearFecha(form.fechaCheckOut)}</span>
          </div>
        </button>
      </div>

      {mostrarCalendario && form.cabanaId && (
        <SelectorDeFechas
          ocupadas={ocupadas}
          checkIn={form.fechaCheckIn}
          checkOut={form.fechaCheckOut}
          onError={setErrorLocal}
          onCambiar={({ checkIn, checkOut }) => {
            actualizar({ fechaCheckIn: checkIn, fechaCheckOut: checkOut });
            if (checkOut) setMostrarCalendario(false);
          }}
        />
      )}

      <div>
        <label className={rotulo}>Monto Total del Alquiler ($)</label>
        <CampoMonto
          placeholder="Ej: 120.000"
          value={form.montoTotal}
          onChange={(montoTotal) => actualizar({ montoTotal })}
          required
        />
      </div>

      <div>
        <label className={rotulo}>Porcentaje de Seña (Opcional)</label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="Dejalo vacío si no aplica"
          value={form.porcentajeSena}
          onChange={(e) => actualizar({ porcentajeSena: e.target.value })}
          className={campo}
        />
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-medium">
        <span className="text-slate-400">Monto de seña preliminar:</span>
        <span className="font-bold text-slate-900">{formatearMonto(sena)}</span>
      </div>

      <Aviso>{errorLocal || error}</Aviso>

      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl font-bold transition text-xs shadow-xs tracking-wide uppercase disabled:bg-slate-300 cursor-pointer"
      >
        {cargando ? 'Registrando...' : 'Confirmar Reserva'}
      </button>
    </form>
  );
}
