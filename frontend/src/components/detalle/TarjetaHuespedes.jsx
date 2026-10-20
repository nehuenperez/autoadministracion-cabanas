import { useState } from 'react';
import Tarjeta, { BotonEditar } from '../comunes/Tarjeta.jsx';
import FormularioHuesped from './FormularioHuesped.jsx';

/** Responsable de la reserva: sus datos, su vehículo y las notas de comportamiento. */
export function TarjetaTitular({ titular, ocupado, onGuardar }) {
  const [editando, setEditando] = useState(false);

  return (
    <Tarjeta
      titulo="Responsable Titular"
      accion={titular && !editando && <BotonEditar onClick={() => setEditando(true)}>Editar datos</BotonEditar>}
    >
      {!titular && (
        <p className="text-xs font-bold text-rose-600 bg-rose-50/60 border border-rose-100 p-3 rounded-lg text-center">
          ⚠️ Falta registrar los datos del titular
        </p>
      )}

      {titular && editando && (
        <FormularioHuesped huesped={titular} completo ocupado={ocupado} onGuardar={onGuardar} onCancelar={() => setEditando(false)} />
      )}

      {titular && !editando && (
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-slate-900 capitalize tracking-tight">{titular.nombre} {titular.apellido}</h4>
          <div className="grid grid-cols-1 gap-1.5 text-xs font-medium text-slate-500">
            <p>DNI: <span className="text-slate-800 font-semibold">{titular.dni}</span></p>
            {titular.cuil && <p>CUIL: <span className="text-slate-800 font-semibold">{titular.cuil}</span></p>}
            {titular.telefono && <p>Tel: <span className="text-slate-800 font-semibold">{titular.telefono}</span></p>}
            {titular.direccion && <p>Dir: <span className="text-slate-800 font-semibold">{titular.direccion}</span></p>}
            {(titular.vehiculoModelo || titular.vehiculoPatente) && (
              <div className="mt-1 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                <span>🚗</span> {titular.vehiculoModelo}
                {titular.vehiculoPatente && (
                  <> — <span className="font-mono bg-slate-200/60 px-1 rounded">{titular.vehiculoPatente}</span></>
                )}
              </div>
            )}
          </div>
          {titular.notasComportamiento && (
            <div className="mt-2 p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg text-xs text-amber-900">
              {titular.notasComportamiento}
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
      <div className="space-y-2.5">
        {acompanantes.map((a) => (
          <div key={a.id} className="p-3 bg-slate-50/60 rounded-lg border border-slate-100 text-xs">
            {editandoId === a.id ? (
              <FormularioHuesped huesped={a} ocupado={ocupado} onGuardar={onGuardar} onCancelar={() => setEditandoId(null)} />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800 capitalize">{a.nombre} {a.apellido}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    DNI {a.dni} {a.telefono && `| Tel: ${a.telefono}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditandoId(a.id)} className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded cursor-pointer">
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuitar(a.id)}
                    disabled={ocupado}
                    className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}
