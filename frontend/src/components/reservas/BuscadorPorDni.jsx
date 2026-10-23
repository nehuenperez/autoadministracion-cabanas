import { useState } from 'react';
import { Search, StickyNote } from 'lucide-react';
import { buscarPorDni } from '../../services/huespedes.service.js';
import { claseDeCampo } from '../../utils/estilos.js';
import Campo from '../comunes/Campo.jsx';
import Boton from '../comunes/Boton.jsx';
import Aviso from '../comunes/Aviso.jsx';

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

  const entrada = (nombreCampo, rotulo, props = {}) => (
    <Campo rotulo={rotulo}>
      <input value={datos[nombreCampo] ?? ''} onChange={(e) => cambiar(nombreCampo, e.target.value)} className={claseDeCampo} {...props} />
    </Campo>
  );

  const mostrarCampos = estado === 'encontrado' || estado === 'nuevo';

  return (
    <div className="space-y-3">
      <Campo rotulo="DNI">
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={datos.dni}
            onChange={(e) => cambiar('dni', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBuscar();
              }
            }}
            className={claseDeCampo}
          />
          <Boton variante="secundario" icono={Search} onClick={handleBuscar} disabled={estado === 'buscando' || !datos.dni.trim()}>
            {estado === 'buscando' ? 'Buscando…' : 'Buscar'}
          </Boton>
        </div>
      </Campo>

      {estado === 'error' && <Aviso>No se pudo buscar. Revisá la conexión y probá de nuevo.</Aviso>}

      {mostrarCampos && (
        <div className="space-y-3 animate-aparecer">
          <p className="text-sm text-slate-500">
            {estado === 'encontrado' ? 'Ya vino antes: revisá que sus datos sigan iguales.' : 'Huésped nuevo: completá sus datos.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {entrada('nombre', 'Nombre')}
            {entrada('apellido', 'Apellido')}
          </div>
          {rol === 'titular' && (
            <>
              {entrada('telefono', 'Teléfono', { type: 'tel', inputMode: 'tel' })}
              {entrada('direccion', 'Domicilio')}
              <div className="grid grid-cols-2 gap-3">
                {entrada('vehiculoModelo', 'Vehículo')}
                {entrada('vehiculoPatente', 'Patente', { autoCapitalize: 'characters' })}
              </div>
            </>
          )}
          {estado === 'encontrado' && datos.notasComportamiento && (
            <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[15px] text-amber-950">
              <StickyNote className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p>{datos.notasComportamiento}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
