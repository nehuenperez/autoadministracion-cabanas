import { useState } from 'react';
import { Car, IdCard, MapPin, Pencil, Phone, StickyNote, UserMinus } from 'lucide-react';
import Tarjeta, { BotonEditar } from '../comunes/Tarjeta.jsx';
import Aviso from '../comunes/Aviso.jsx';
import FormularioHuesped from './FormularioHuesped.jsx';
import BotonWhatsapp from '../reservas/BotonWhatsapp.jsx';
import { clasesDeBoton } from '../../utils/estilos.js';

function Dato({ icono: Icono, children }) {
  return (
    <li className="flex items-start gap-3 py-1.5 text-[15px] text-slate-700">
      <Icono className="size-5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

/** Responsable de la reserva: sus datos, su vehículo, las notas y cómo contactarlo. */
export function TarjetaTitular({ titular, ocupado, onGuardar }) {
  const [editando, setEditando] = useState(false);

  if (!titular) {
    return (
      <Tarjeta titulo="Titular">
        <Aviso tipo="advertencia">Falta cargar al titular de la reserva. Podés hacerlo más abajo, en «Cargar huéspedes».</Aviso>
      </Tarjeta>
    );
  }

  const vehiculo = [titular.vehiculoModelo, titular.vehiculoPatente].filter(Boolean).join(', patente ');

  return (
    <Tarjeta titulo="Titular" accion={!editando && <BotonEditar onClick={() => setEditando(true)} />}>
      {editando ? (
        <FormularioHuesped huesped={titular} completo ocupado={ocupado} onGuardar={onGuardar} onCancelar={() => setEditando(false)} />
      ) : (
        <div className="space-y-3">
          <p className="text-xl font-semibold text-slate-900 capitalize">{titular.nombre} {titular.apellido}</p>
          <ul>
            <Dato icono={IdCard}>
              DNI {titular.dni}
              {titular.cuil && <span className="text-slate-500">. CUIL {titular.cuil}</span>}
            </Dato>
            {titular.telefono && <Dato icono={Phone}>{titular.telefono}</Dato>}
            {titular.direccion && <Dato icono={MapPin}>{titular.direccion}</Dato>}
            {vehiculo && <Dato icono={Car}>{vehiculo}</Dato>}
          </ul>
          {titular.notasComportamiento && (
            <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[15px] text-amber-950">
              <StickyNote className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p>{titular.notasComportamiento}</p>
            </div>
          )}
          {titular.telefono && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a href={`tel:${titular.telefono.replace(/[^\d+]/g, '')}`} className={clasesDeBoton({ variante: 'secundario' })}>
                <Phone className="size-5" aria-hidden="true" />
                Llamar
              </a>
              <BotonWhatsapp
                telefono={titular.telefono}
                mensaje={`Hola, *${titular.nombre}* 😊\n¡Los esperamos pronto en Aroma del Potrero 🌿!\n\nLes recordamos algunos detalles previos a su llegada:\n...`}
              />
            </div>
          )}
        </div>
      )}
    </Tarjeta>
  );
}

/** Los acompañantes, con edición rápida y la opción de quitarlos de la reserva. */
export function TarjetaAcompanantes({ acompanantes, ocupado, onGuardar, onQuitar }) {
  const [editandoId, setEditandoId] = useState(null);

  if (acompanantes.length === 0) return null;

  return (
    <Tarjeta titulo={`Acompañantes (${acompanantes.length})`}>
      <ul className="divide-y divide-slate-100">
        {acompanantes.map((a) => (
          <li key={a.id} className="py-2 first:pt-0 last:pb-0">
            {editandoId === a.id ? (
              <FormularioHuesped huesped={a} ocupado={ocupado} onGuardar={onGuardar} onCancelar={() => setEditandoId(null)} />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900 capitalize">{a.nombre} {a.apellido}</p>
                  <p className="text-sm text-slate-500">
                    DNI {a.dni}
                    {a.telefono && `. Tel. ${a.telefono}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditandoId(a.id)}
                  aria-label={`Editar a ${a.nombre} ${a.apellido}`}
                  className="size-11 shrink-0 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                >
                  <Pencil className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onQuitar(a.id)}
                  disabled={ocupado}
                  aria-label={`Quitar a ${a.nombre} ${a.apellido} de la reserva`}
                  className="size-11 shrink-0 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 cursor-pointer disabled:opacity-50"
                >
                  <UserMinus className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
