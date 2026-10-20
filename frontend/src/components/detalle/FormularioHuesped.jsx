import { useState } from 'react';

const campo = 'p-2 border border-slate-200 rounded-lg bg-slate-50 w-full';

/**
 * Edición de los datos de un huésped. `completo` muestra todo (titular); sin
 * él, sólo nombre, apellido y teléfono (acompañantes). El DNI no se edita: es
 * lo que identifica al huésped.
 */
export default function FormularioHuesped({ huesped, completo = false, ocupado, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: huesped.nombre ?? '',
    apellido: huesped.apellido ?? '',
    telefono: huesped.telefono ?? '',
    cuil: huesped.cuil ?? '',
    direccion: huesped.direccion ?? '',
    vehiculoModelo: huesped.vehiculoModelo ?? '',
    vehiculoPatente: huesped.vehiculoPatente ?? '',
    notasComportamiento: huesped.notasComportamiento ?? '',
  });

  const entrada = (nombre, placeholder, clases = '') => (
    <input
      type="text"
      value={form[nombre]}
      onChange={(e) => setForm({ ...form, [nombre]: e.target.value })}
      placeholder={placeholder}
      className={`${campo} ${clases}`}
    />
  );

  async function guardar() {
    // Sin `completo` sólo se mandan los campos del formulario corto: el resto queda como estaba
    const datos = completo
      ? { ...form, dni: huesped.dni }
      : { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono, dni: huesped.dni };
    const ok = await onGuardar(datos);
    if (ok) onCancelar();
  }

  return (
    <div className="space-y-2.5 text-xs pt-1">
      <div className="grid grid-cols-2 gap-2">
        {entrada('nombre', 'Nombre')}
        {entrada('apellido', 'Apellido')}
      </div>
      {completo ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {entrada('telefono', 'Teléfono')}
            {entrada('cuil', 'CUIL')}
          </div>
          {entrada('direccion', 'Dirección')}
          <div className="grid grid-cols-2 gap-2">
            {entrada('vehiculoModelo', 'Vehículo Modelo')}
            {entrada('vehiculoPatente', 'Patente')}
          </div>
          <textarea
            value={form.notasComportamiento}
            onChange={(e) => setForm({ ...form, notasComportamiento: e.target.value })}
            placeholder="Notas de comportamiento"
            className={`${campo} h-16`}
          />
        </>
      ) : (
        entrada('telefono', 'Teléfono')
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={guardar}
          disabled={ocupado || !form.nombre.trim() || !form.apellido.trim()}
          className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-bold cursor-pointer disabled:bg-slate-300"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancelar} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold cursor-pointer">
          Cancelar
        </button>
      </div>
    </div>
  );
}
