import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatearDiaCorto, formatearNoches } from '../../utils/fechas.js';
import { claseDeCampo } from '../../utils/estilos.js';
import Tarjeta, { BotonEditar } from '../comunes/Tarjeta.jsx';
import Campo from '../comunes/Campo.jsx';
import Boton from '../comunes/Boton.jsx';

/** Cabaña y fechas de la estadía, con la opción de cambiar las fechas. */
export default function TarjetaAlojamiento({ reserva, ocupado, onGuardarFechas }) {
  const [fechas, setFechas] = useState(null); // null = no se está editando

  async function guardar() {
    if (await onGuardarFechas(fechas)) setFechas(null);
  }

  return (
    <Tarjeta
      titulo={reserva.Cabana?.nombre ?? 'Cabaña'}
      accion={
        !fechas &&
        reserva.estado !== 'Abortada' && (
          <BotonEditar onClick={() => setFechas({ fechaCheckIn: reserva.fechaCheckIn, fechaCheckOut: reserva.fechaCheckOut })}>
            Cambiar fechas
          </BotonEditar>
        )
      }
    >
      {fechas ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Ingreso">
              <input type="date" value={fechas.fechaCheckIn} onChange={(e) => setFechas({ ...fechas, fechaCheckIn: e.target.value })} className={claseDeCampo} />
            </Campo>
            <Campo rotulo="Salida">
              <input type="date" value={fechas.fechaCheckOut} onChange={(e) => setFechas({ ...fechas, fechaCheckOut: e.target.value })} className={claseDeCampo} />
            </Campo>
          </div>
          <div className="flex gap-2">
            <Boton ancho onClick={guardar} disabled={ocupado}>Guardar fechas</Boton>
            <Boton variante="secundario" onClick={() => setFechas(null)}>Cancelar</Boton>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-slate-500">Ingreso</p>
            <p className="text-[17px] font-semibold text-slate-900 first-letter:uppercase">{formatearDiaCorto(reserva.fechaCheckIn)}</p>
          </div>
          <ArrowRight className="size-5 text-slate-400 shrink-0" aria-hidden="true" />
          <div className="flex-1 text-right">
            <p className="text-sm text-slate-500">Salida</p>
            <p className="text-[17px] font-semibold text-slate-900 first-letter:uppercase">{formatearDiaCorto(reserva.fechaCheckOut)}</p>
          </div>
        </div>
      )}
      {!fechas && (
        <p className="text-sm text-slate-500 -mt-1">{formatearNoches(reserva.fechaCheckIn, reserva.fechaCheckOut)}</p>
      )}
    </Tarjeta>
  );
}
