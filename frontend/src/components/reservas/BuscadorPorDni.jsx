import { useState } from 'react';
import { buscarPorDni } from '../../services/huespedes.service.js';

export default function BuscadorPorDni({ rol, onHuespedListo }) {
  const [datos, setDatos] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', direccion: '', vehiculoModelo: '', vehiculoPatente: '',
  });
  const [encontrado, setEncontrado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mostrarCampos, setMostrarCampos] = useState(false);

  async function handleBuscar() {
    if (!datos.dni) return;
    setBuscando(true);
    try {
      const huesped = await buscarPorDni(datos.dni);
      if (huesped) {
        setDatos(huesped);
        setEncontrado(true);
        setMostrarCampos(true);
        onHuespedListo({ ...huesped, rol });
      } else {
        setEncontrado(false);
        setMostrarCampos(true);
        onHuespedListo({ ...datos, rol }); // dni ya está en datos en este punto
      }
    } finally {
      setBuscando(false);
    }
  }

  function handleChangeCampo(campo, valor) {
    const nuevosDatos = { ...datos, [campo]: valor };
    setDatos(nuevosDatos);
    onHuespedListo({ ...nuevosDatos, rol });
  }

  const estilos = {
    input: { width: '100%', padding: 8, marginBottom: 6, fontSize: 14, borderRadius: 6, border: '1px solid #ccc' },
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <strong style={{ fontSize: 13, textTransform: 'uppercase', color: '#666' }}>{rol}</strong>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          placeholder="DNI"
          value={datos.dni}
          onChange={(e) => handleChangeCampo('dni', e.target.value)}
          style={{ ...estilos.input, marginBottom: 0 }}
        />
        <button type="button" onClick={handleBuscar} disabled={buscando}>
          {buscando ? '...' : 'Buscar'}
        </button>
      </div>

      {mostrarCampos && (
        <div style={{ marginTop: 8 }}>
          {!encontrado && <p style={{ fontSize: 12, color: '#888' }}>Huésped nuevo, completá los datos:</p>}
          <input
            placeholder="Nombre"
            value={datos.nombre || ''}
            onChange={(e) => handleChangeCampo('nombre', e.target.value)}
            style={estilos.input}
          />
          <input
            placeholder="Apellido"
            value={datos.apellido || ''}
            onChange={(e) => handleChangeCampo('apellido', e.target.value)}
            style={estilos.input}
          />
          {rol === 'titular' && (
            <>
              <input
                placeholder="Teléfono (para WhatsApp)"
                value={datos.telefono || ''}
                onChange={(e) => handleChangeCampo('telefono', e.target.value)}
                style={estilos.input}
              />
              <input
                placeholder="Domicilio"
                value={datos.direccion || ''}
                onChange={(e) => handleChangeCampo('direccion', e.target.value)}
                style={estilos.input}
              />
              <input
                placeholder="Modelo del vehículo"
                value={datos.vehiculoModelo || ''}
                onChange={(e) => handleChangeCampo('vehiculoModelo', e.target.value)}
                style={estilos.input}
              />
              <input
                placeholder="Patente"
                value={datos.vehiculoPatente || ''}
                onChange={(e) => handleChangeCampo('vehiculoPatente', e.target.value)}
                style={estilos.input}
              />
            </>
          )}
          {encontrado && datos.notasComportamiento && (
            <p style={{ fontSize: 12, background: '#fff3cd', padding: 6, borderRadius: 4 }}>
              📋 Notas: {datos.notasComportamiento}
            </p>
          )}
        </div>
      )}
    </div>
  );
}