import { useState } from 'react';
import { Sparkles, StickyNote, X } from 'lucide-react';
import { interpretarMensaje } from '../../utils/interpretarMensaje.js';
import { claseDeCampo } from '../../utils/estilos.js';
import { buscarPorDni } from '../../services/huespedes.service.js';
import Campo from '../comunes/Campo.jsx';
import Boton from '../comunes/Boton.jsx';
import Aviso from '../comunes/Aviso.jsx';

const CAMPOS = [
  { campo: 'nombre', etiqueta: 'Nombre', obligatorio: true },
  { campo: 'apellido', etiqueta: 'Apellido', obligatorio: true },
  { campo: 'dni', etiqueta: 'DNI', obligatorio: true },
  { campo: 'cuil', etiqueta: 'CUIL' },
  { campo: 'telefono', etiqueta: 'Teléfono', ancho: true },
  { campo: 'direccion', etiqueta: 'Domicilio', ancho: true },
  { campo: 'vehiculoModelo', etiqueta: 'Vehículo' },
  { campo: 'vehiculoPatente', etiqueta: 'Patente' },
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
    <div className="space-y-4">
      <Campo rotulo="Mensaje del huésped" ayuda="Pegá el mensaje tal cual llegó: nombres, DNI, domicilio, auto y patente.">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          className={`${claseDeCampo} py-3`}
        />
      </Campo>
      <Boton variante={filas ? 'secundario' : 'primario'} ancho icono={Sparkles} onClick={handleInterpretar} disabled={!texto.trim() || trabajando}>
        {filas ? 'Volver a leer el mensaje' : 'Completar datos'}
      </Boton>

      {filas && (
        <div className="space-y-3 pt-1">
          {filas.length === 0 ? (
            <Aviso>No se encontró ningún huésped en el mensaje. Revisalo o cargalos con «Buscar por DNI».</Aviso>
          ) : (
            <p className="text-[15px] text-slate-600">Revisá los datos y corregí lo que haga falta antes de guardar.</p>
          )}

          {filas.map((fila) => (
            <div key={fila.clave} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                {titularActual ? (
                  <span className="inline-block text-[15px] font-semibold text-slate-900 first-letter:uppercase">{fila.rol}</span>
                ) : (
                  <label className="flex items-center gap-2.5 min-h-11 text-[15px] font-semibold text-slate-900 cursor-pointer">
                    <input
                      type="radio"
                      name="titular-carga-rapida"
                      checked={fila.rol === 'titular'}
                      onChange={() => elegirTitular(fila.clave)}
                      className="size-5 accent-slate-900"
                    />
                    {fila.rol === 'titular' ? 'Titular' : 'Acompañante'}
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => quitarFila(fila.clave)}
                  aria-label="Quitar este huésped"
                  className="size-11 shrink-0 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              {(fila.buscando || fila.yaRegistrado) && (
                <p className="text-sm text-slate-500">
                  {fila.buscando ? 'Buscando si ya vino antes…' : 'Ya vino antes: se completaron los datos que faltaban.'}
                </p>
              )}

              {fila.avisos.length > 0 && (
                <Aviso tipo="advertencia">
                  <ul className="space-y-0.5">
                    {fila.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
                  </ul>
                </Aviso>
              )}

              {fila.notasComportamiento && (
                <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[15px] text-amber-950">
                  <StickyNote className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
                  <p>{fila.notasComportamiento}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {CAMPOS.map(({ campo, etiqueta, obligatorio, ancho }) => {
                  const falta = obligatorio && !fila[campo].trim();
                  return (
                    <Campo key={campo} rotulo={etiqueta} className={ancho ? 'col-span-2' : ''}>
                      <input
                        type="text"
                        value={fila[campo]}
                        onChange={(e) => cambiarCampo(fila.clave, campo, e.target.value)}
                        aria-invalid={falta}
                        className={`${claseDeCampo} ${falta ? 'border-rose-400 bg-rose-50' : ''}`}
                      />
                    </Campo>
                  );
                })}
              </div>
            </div>
          ))}

          {avisosGenerales.length > 0 && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-600 space-y-1">
              <p className="font-medium text-slate-700">Texto del mensaje que no se usó:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {avisosGenerales.map((aviso) => <li key={aviso}>{aviso.replace(/^No se usó: /, '')}</li>)}
              </ul>
            </div>
          )}

          <Aviso>{error}</Aviso>

          {filas.length > 0 && (
            <div className="flex gap-2">
              <Boton variante="exito" ancho onClick={handleConfirmar} disabled={trabajando}>
                {trabajando ? 'Guardando…' : `Guardar ${filas.length === 1 ? 'huésped' : `${filas.length} huéspedes`}`}
              </Boton>
              <Boton variante="secundario" onClick={cancelar}>Cancelar</Boton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
