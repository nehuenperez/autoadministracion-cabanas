import { useState } from 'react';
import Aviso from '../comunes/Aviso.jsx';
import BuscadorPorDni from '../reservas/BuscadorPorDni.jsx';
import CargaRapidaHuespedes from '../reservas/CargaRapidaHuespedes.jsx';

/**
 * Alta de huéspedes en la reserva: pegando el mensaje que mandó el cliente
 * (carga rápida) o a mano, buscando por DNI. Las dos vías terminan en
 * `onVincular`, que suma los huéspedes a los que ya estaban.
 */
export default function CargaDeHuespedes({ titular, ocupado, onVincular }) {
  const [manuales, setManuales] = useState({}); // un huésped por rol: { titular, acompañante }
  const [version, setVersion] = useState(0); // al cambiarla se vacían los buscadores
  const [aviso, setAviso] = useState('');

  function huespedListo(datos) {
    setAviso('');
    setManuales((anteriores) => ({ ...anteriores, [datos.rol]: datos }));
  }

  async function guardarManuales() {
    const cargados = Object.values(manuales);
    if (!titular && !manuales.titular?.dni?.trim()) {
      setAviso('⚠️ Completá los datos del titular obligatoriamente.');
      return;
    }
    if (cargados.length === 0) {
      setAviso('⚠️ No hay ningún dato de huésped listo para guardar.');
      return;
    }
    if (cargados.some((h) => !h.nombre?.trim() || !h.apellido?.trim() || !h.dni?.trim())) {
      setAviso('⚠️ Completá nombre, apellido y DNI.');
      return;
    }
    if (await onVincular(cargados)) {
      setManuales({});
      setVersion((v) => v + 1);
    }
  }

  return (
    <section className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/70 space-y-4">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        {titular ? 'Agregar acompañantes' : 'Asignar Huéspedes'}
      </h3>

      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Carga rápida: pegá el mensaje</span>
        <CargaRapidaHuespedes titularActual={titular} onConfirmar={onVincular} />
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">o cargalos a mano</p>

      <div className="space-y-3">
        {!titular && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-2">Paso 1: Cargar Titular</span>
            <BuscadorPorDni key={`titular-${version}`} rol="titular" onHuespedListo={huespedListo} />
          </div>
        )}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Cargar Acompañante</span>
          <BuscadorPorDni key={`acompanante-${version}`} rol="acompañante" onHuespedListo={huespedListo} />
        </div>
      </div>

      <Aviso tipo="advertencia">{aviso}</Aviso>

      <button
        type="button"
        onClick={guardarManuales}
        disabled={ocupado}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer disabled:bg-slate-300"
      >
        Vincular Huéspedes a la Reserva
      </button>
    </section>
  );
}
