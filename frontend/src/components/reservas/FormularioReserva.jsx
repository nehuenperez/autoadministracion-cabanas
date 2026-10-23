import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatearDiaCorto, formatearNoches } from '../../utils/fechas.js';
import { calcularSena, formatearMonto, parsearMonto } from '../../utils/montos.js';
import { claseDeCampo } from '../../utils/estilos.js';
import Campo from '../comunes/Campo.jsx';
import CampoMonto from '../comunes/CampoMonto.jsx';
import ControlSegmentado from '../comunes/ControlSegmentado.jsx';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import SelectorDeFechas from './SelectorDeFechas.jsx';

function ResumenDeFechas({ checkIn, checkOut }) {
  if (!checkIn) return <p className="text-[15px] text-slate-500">Elegí las fechas en el calendario.</p>;
  return (
    <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
      <span className="inline-block first-letter:uppercase">{formatearDiaCorto(checkIn)}</span>
      <ArrowRight className="size-4 text-slate-400" aria-hidden="true" />
      <span className={checkOut ? 'inline-block first-letter:uppercase' : 'text-slate-400 font-normal'}>
        {checkOut ? formatearDiaCorto(checkOut) : 'salida'}
      </span>
      {checkOut && <span className="text-slate-500 font-normal">({formatearNoches(checkIn, checkOut)})</span>}
    </div>
  );
}

/**
 * Alta de reserva: cabaña, estadía, total y porcentaje de seña.
 * `reservasActivas` son las Señadas y Pagadas: definen qué días están tomados.
 * `inicial` permite precargar cabaña e ingreso (cuando el cliente agrega días).
 */
export default function FormularioReserva({ cabanas, reservasActivas, inicial = {}, onSubmit, cargando, error }) {
  const [form, setForm] = useState({
    cabanaId: inicial.cabanaId ? String(inicial.cabanaId) : cabanas.length === 1 ? String(cabanas[0].id) : '',
    fechaCheckIn: inicial.fechaCheckIn || '',
    fechaCheckOut: '',
    montoTotal: '',
    porcentajeSena: '',
  });
  const [errorLocal, setErrorLocal] = useState('');

  const actualizar = (cambios) => setForm((anterior) => ({ ...anterior, ...cambios }));
  const ocupadas = reservasActivas.filter((r) => Number(r.cabanaId) === Number(form.cabanaId));
  const sena = calcularSena(parsearMonto(form.montoTotal), form.porcentajeSena);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.cabanaId) {
      setErrorLocal('Elegí la cabaña.');
      return;
    }
    if (!form.fechaCheckIn || !form.fechaCheckOut) {
      setErrorLocal('Elegí en el calendario el día de ingreso y el de salida.');
      return;
    }
    if (parsearMonto(form.montoTotal) <= 0) {
      setErrorLocal('Ingresá el total de la estadía.');
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Campo rotulo="Cabaña" grupo>
        <ControlSegmentado
          etiqueta="Cabaña"
          opciones={cabanas.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
          valor={form.cabanaId}
          onCambiar={(cabanaId) => {
            // Otra cabaña tiene otros días ocupados: las fechas elegidas dejan de valer
            actualizar({ cabanaId, fechaCheckIn: '', fechaCheckOut: '' });
            setErrorLocal('');
          }}
        />
      </Campo>

      {form.cabanaId && (
        <Campo rotulo="Estadía" grupo>
          <ResumenDeFechas checkIn={form.fechaCheckIn} checkOut={form.fechaCheckOut} />
          <div className="pt-2">
            <SelectorDeFechas
              key={form.cabanaId}
              ocupadas={ocupadas}
              checkIn={form.fechaCheckIn}
              checkOut={form.fechaCheckOut}
              onError={setErrorLocal}
              onCambiar={({ checkIn, checkOut }) => actualizar({ fechaCheckIn: checkIn, fechaCheckOut: checkOut })}
            />
          </div>
        </Campo>
      )}

      <Campo rotulo="Total de la estadía">
        <CampoMonto value={form.montoTotal} onChange={(montoTotal) => actualizar({ montoTotal })} required />
      </Campo>

      <Campo
        rotulo="Seña (%)"
        ayuda={sena > 0 ? `Seña a cobrar: ${formatearMonto(sena)}` : 'Opcional. Dejalo vacío si no pedís seña.'}
      >
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="1"
          value={form.porcentajeSena}
          onChange={(e) => actualizar({ porcentajeSena: e.target.value })}
          className={claseDeCampo}
        />
      </Campo>

      <Aviso>{errorLocal || error}</Aviso>

      <Boton type="submit" ancho disabled={cargando}>
        {cargando ? 'Guardando…' : 'Crear reserva'}
      </Boton>
    </form>
  );
}
