import { useState } from 'react';
import { interpretarMensaje } from '../../utils/interpretarMensaje.js';
import { buscarPorDni } from '../../services/huespedes.service.js';

const CAMPOS = [
  { campo: 'nombre', etiqueta: 'Nombre', obligatorio: true },
  { campo: 'apellido', etiqueta: 'Apellido', obligatorio: true },
  { campo: 'dni', etiqueta: 'DNI', obligatorio: true },
  { campo: 'cuil', etiqueta: 'CUIL' },
  { campo: 'telefono', etiqueta: 'Teléfono' },
  { campo: 'vehiculoPatente', etiqueta: 'Patente' },
  { campo: 'direccion', etiqueta: 'Domicilio', ancho: true },
  { campo: 'vehiculoModelo', etiqueta: 'Vehículo', ancho: true },
];

/**
 * Carga rápida: se pega el mensaje con los datos de los huéspedes, se
 * interpreta solo y se muestran las tarjetas para revisar antes de guardar.
 * Nada se guarda sin pasar por esta revisión.
 */
export default function CargaRapidaHuespedes({ titularActual, onConfirmar }) {
  const [texto, setTexto] = useState('');
  const [filas, setFilas] = useState(null);
  const [avisosGenerales, setAvisosGenerales] = useState([]);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');

  function armarFila(huesped, indice) {
    const fila = { clave: `${Date.now()}-${indice}`, avisos: huesped.avisos, buscando: Boolean(huesped.dni) };
    for (const { campo } of CAMPOS) fila[campo] = huesped[campo];

    const esElTitularActual = titularActual && huesped.dni === titularActual.dni;
    fila.rol = titularActual ? (esElTitularActual ? 'titular' : 'acompañante') : huesped.rol;
    if (fila.rol !== 'titular') fila.avisos = fila.avisos.filter((a) => !a.startsWith('No vino el teléfono'));
    return fila;
  }

  // Si el huésped ya vino antes, se completan los campos que el mensaje no
  // trajo con los datos guardados y se muestran sus notas. Corre en segundo
  // plano: el servidor puede tardar en despertar y las tarjetas ya se ven.
  async function completarConDatosGuardados(fila) {
    let existente = null;
    try {
      existente = await buscarPorDni(fila.dni);
    } catch {
      // Sin conexión: queda sólo lo interpretado del mensaje
    }

    setFilas((prev) =>
      prev?.map((f) => {
        if (f.clave !== fila.clave) return f;
        const actualizada = { ...f, buscando: false };
        if (!existente) return actualizada;

        // Sólo se completan campos vacíos, para no pisar lo que ya se corrigió
        for (const { campo } of CAMPOS) {
          if (!actualizada[campo] && existente[campo]) actualizada[campo] = existente[campo];
        }
        actualizada.yaRegistrado = true;
        actualizada.notasComportamiento = existente.notasComportamiento || '';
        if (actualizada.telefono) {
          actualizada.avisos = actualizada.avisos.filter((a) => !a.startsWith('No vino el teléfono'));
        }
        return actualizada;
      })
    );
  }

  function handleInterpretar() {
    setError('');
    const resultado = interpretarMensaje(texto);
    const nuevasFilas = resultado.huespedes.map(armarFila);
    setFilas(nuevasFilas);
    setAvisosGenerales(resultado.avisos);
    nuevasFilas.filter((f) => f.dni).forEach(completarConDatosGuardados);
  }

  function cambiarCampo(clave, campo, valor) {
    setFilas((prev) => prev.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));
  }

  // Sólo puede haber un titular: elegir uno pasa a los demás a acompañantes
  function elegirTitular(clave) {
    setFilas((prev) => prev.map((f) => ({ ...f, rol: f.clave === clave ? 'titular' : 'acompañante' })));
  }

  function quitarFila(clave) {
    setFilas((prev) => prev.filter((f) => f.clave !== clave));
  }

  function cancelar() {
    setFilas(null);
    setAvisosGenerales([]);
    setError('');
  }

  async function handleConfirmar() {
    setError('');

    const incompleta = filas.find((f) => !f.nombre.trim() || !f.apellido.trim() || !f.dni.trim());
    if (incompleta) {
      setError('Completá nombre, apellido y DNI de todos los huéspedes.');
      return;
    }

    const dnis = filas.map((f) => f.dni.trim());
    if (new Set(dnis).size !== dnis.length) {
      setError('Hay dos huéspedes con el mismo DNI.');
      return;
    }

    if (!titularActual && filas.filter((f) => f.rol === 'titular').length !== 1) {
      setError('Elegí quién es el titular de la reserva.');
      return;
    }

    setTrabajando(true);
    try {
      const ok = await onConfirmar(filas);
      if (ok) {
        setTexto('');
        cancelar();
      }
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Pegá acá el mensaje con los datos (nombre, DNI, domicilio, auto, patente...)"
        className="w-full p-3 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white h-28 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition"
      />
      <button
        type="button"
        onClick={handleInterpretar}
        disabled={!texto.trim() || trabajando}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {filas ? '↻ Volver a interpretar' : '✨ Interpretar mensaje'}
      </button>

      {filas && (
        <div className="space-y-3 pt-1">
          {filas.length === 0 ? (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg text-center">
              No se encontró ningún huésped en el mensaje. Revisalo o cargalo a mano abajo.
            </p>
          ) : (
            <p className="text-[11px] font-medium text-slate-500 text-center">
              Revisá los datos. Podés corregir cualquier campo antes de confirmar.
            </p>
          )}

          {filas.map((fila) => (
            <div key={fila.clave} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                {titularActual ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{fila.rol}</span>
                ) : (
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="titular-carga-rapida"
                      checked={fila.rol === 'titular'}
                      onChange={() => elegirTitular(fila.clave)}
                    />
                    {fila.rol === 'titular' ? 'Titular' : 'Acompañante'}
                  </label>
                )}
                <div className="flex items-center gap-1.5">
                  {fila.buscando && <span className="text-[9px] font-medium text-slate-400">Buscando si ya vino…</span>}
                  {fila.yaRegistrado && (
                    <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                      Ya vino antes
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => quitarFila(fila.clave)}
                    className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              {fila.avisos.length > 0 && (
                <ul className="p-2 bg-amber-50 border border-amber-100 rounded-lg text-[11px] font-medium text-amber-900 space-y-0.5">
                  {fila.avisos.map((aviso) => (
                    <li key={aviso}>⚠️ {aviso}</li>
                  ))}
                </ul>
              )}

              {fila.notasComportamiento && (
                <p className="p-2 bg-amber-50/60 border border-amber-100 rounded-lg text-[11px] text-amber-900">
                  📋 Notas: {fila.notasComportamiento}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {CAMPOS.map(({ campo, etiqueta, obligatorio, ancho }) => {
                  const falta = obligatorio && !fila[campo].trim();
                  return (
                    <label key={campo} className={ancho ? 'col-span-2' : ''}>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {etiqueta}
                      </span>
                      <input
                        type="text"
                        value={fila[campo]}
                        onChange={(e) => cambiarCampo(fila.clave, campo, e.target.value)}
                        className={`w-full p-2 text-xs font-medium text-slate-800 border rounded-lg bg-slate-50 ${
                          falta ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {avisosGenerales.length > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-500">Texto del mensaje que no se usó:</p>
              <ul className="space-y-0.5">
                {avisosGenerales.map((aviso) => (
                  <li key={aviso}>• {aviso.replace(/^No se usó: /, '')}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-center text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          {filas.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={trabajando}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl font-bold transition text-xs shadow-xs cursor-pointer disabled:bg-slate-300"
              >
                {trabajando ? 'Guardando...' : `Confirmar y vincular (${filas.length})`}
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="bg-slate-200 text-slate-700 px-4 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
