import { useState } from 'react';
import { buscarPorDni } from '../../services/huespedes.service.js';

const campo = 'w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500';
const VACIO = { nombre: '', apellido: '', dni: '', telefono: '', direccion: '', vehiculoModelo: '', vehiculoPatente: '' };

/**
 * Carga manual de un huésped: se busca por DNI y, si ya vino antes, se
 * completan sus datos y se muestran sus notas. Cada cambio se informa con
 * `onHuespedListo`, para que la pantalla tenga siempre la última versión.
 */
export default function BuscadorPorDni({ rol, onHuespedListo }) {
  const [datos, setDatos] = useState(VACIO);
  const [estado, setEstado] = useState('inicial'); // inicial | buscando | encontrado | nuevo | error

  async function handleBuscar() {
    if (!datos.dni.trim()) return;
    setEstado('buscando');
    try {
      const huesped = await buscarPorDni(datos.dni.trim());
      const completos = huesped ? { ...VACIO, ...huesped } : datos;
      setDatos(completos);
      setEstado(huesped ? 'encontrado' : 'nuevo');
      onHuespedListo({ ...completos, rol });
    } catch {
      setEstado('error');
    }
  }

  function cambiar(nombreCampo, valor) {
    const nuevos = { ...datos, [nombreCampo]: valor };
    setDatos(nuevos);
    onHuespedListo({ ...nuevos, rol });
  }

  const entrada = (nombreCampo, placeholder) => (
    <input placeholder={placeholder} value={datos[nombreCampo] ?? ''} onChange={(e) => cambiar(nombreCampo, e.target.value)} className={campo} />
  );

  const mostrarCampos = estado === 'encontrado' || estado === 'nuevo';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          placeholder="DNI"
          inputMode="numeric"
          value={datos.dni}
          onChange={(e) => cambiar('dni', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleBuscar();
            }
          }}
          className={campo}
        />
        <button
          type="button"
          onClick={handleBuscar}
          disabled={estado === 'buscando' || !datos.dni.trim()}
          className="bg-slate-800 text-white text-xs font-bold px-4 rounded-lg cursor-pointer disabled:bg-slate-300"
        >
          {estado === 'buscando' ? '...' : 'Buscar'}
        </button>
      </div>

      {estado === 'error' && (
        <p className="text-[11px] font-semibold text-rose-600">No se pudo buscar. Revisá la conexión y probá de nuevo.</p>
      )}

      {mostrarCampos && (
        <div className="space-y-2 animate-aparecer">
          {estado === 'nuevo' && <p className="text-[11px] text-slate-500">Huésped nuevo, completá los datos:</p>}
          {estado === 'encontrado' && (
            <p className="text-[9px] font-bold uppercase inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
              Ya vino antes
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {entrada('nombre', 'Nombre')}
            {entrada('apellido', 'Apellido')}
          </div>
          {rol === 'titular' && (
            <>
              {entrada('telefono', 'Teléfono (para WhatsApp)')}
              {entrada('direccion', 'Domicilio')}
              <div className="grid grid-cols-2 gap-2">
                {entrada('vehiculoModelo', 'Modelo del vehículo')}
                {entrada('vehiculoPatente', 'Patente')}
              </div>
            </>
          )}
          {estado === 'encontrado' && datos.notasComportamiento && (
            <p className="text-[11px] p-2 bg-amber-50/60 border border-amber-100 rounded-lg text-amber-900">
              📋 Notas: {datos.notasComportamiento}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
