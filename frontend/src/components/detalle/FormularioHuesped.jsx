import { useState } from 'react';
import { claseDeCampo } from '../../utils/estilos.js';
import Campo from '../comunes/Campo.jsx';
import Boton from '../comunes/Boton.jsx';

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

  const entrada = (nombre, rotulo, props = {}) => (
    <Campo rotulo={rotulo}>
      <input
        type="text"
        value={form[nombre]}
        onChange={(e) => setForm({ ...form, [nombre]: e.target.value })}
        className={claseDeCampo}
        {...props}
      />
    </Campo>
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {entrada('nombre', 'Nombre', { autoComplete: 'off' })}
        {entrada('apellido', 'Apellido', { autoComplete: 'off' })}
      </div>
      {entrada('telefono', 'Teléfono', { type: 'tel', inputMode: 'tel' })}
      {completo && (
        <>
          {entrada('cuil', 'CUIL', { inputMode: 'numeric' })}
          {entrada('direccion', 'Domicilio')}
          <div className="grid grid-cols-2 gap-3">
            {entrada('vehiculoModelo', 'Vehículo')}
            {entrada('vehiculoPatente', 'Patente', { autoCapitalize: 'characters' })}
          </div>
          <Campo rotulo="Notas" ayuda="Sólo las ves vos. Aparecen cuando vuelve a reservar.">
            <textarea
              value={form.notasComportamiento}
              onChange={(e) => setForm({ ...form, notasComportamiento: e.target.value })}
              rows={3}
              className={`${claseDeCampo} py-3`}
            />
          </Campo>
        </>
      )}
      <div className="flex gap-2">
        <Boton ancho onClick={guardar} disabled={ocupado || !form.nombre.trim() || !form.apellido.trim()}>
          Guardar
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
      </div>
    </div>
  );
}
