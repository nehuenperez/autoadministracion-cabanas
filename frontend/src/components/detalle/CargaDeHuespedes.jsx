import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Tarjeta from '../comunes/Tarjeta.jsx';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import ControlSegmentado from '../comunes/ControlSegmentado.jsx';
import BuscadorPorDni from '../reservas/BuscadorPorDni.jsx';
import CargaRapidaHuespedes from '../reservas/CargaRapidaHuespedes.jsx';

const FORMAS = [
  { valor: 'mensaje', texto: 'Pegar mensaje' },
  { valor: 'dni', texto: 'Buscar por DNI' },
];

/**
 * Alta de huéspedes en la reserva: pegando el mensaje que mandó el cliente
 * (carga rápida) o a mano, buscando por DNI. Las dos vías terminan en
 * `onVincular`, que suma los huéspedes a los que ya estaban.
 *
 * Si la reserva ya tiene titular, arranca cerrada detrás de un botón: lo
 * habitual a esa altura es cobrar, no cargar gente.
 */
export default function CargaDeHuespedes({ titular, ocupado, onVincular }) {
  const [abierta, setAbierta] = useState(!titular);
  const [forma, setForma] = useState('mensaje');
  const [manuales, setManuales] = useState({}); // un huésped por rol: { titular, acompañante }
  const [version, setVersion] = useState(0); // al cambiarla se vacían los buscadores
  const [aviso, setAviso] = useState('');

  if (!abierta) {
    return (
      <Boton variante="secundario" ancho icono={UserPlus} onClick={() => setAbierta(true)}>
        Agregar acompañantes
      </Boton>
    );
  }

  function huespedListo(datos) {
    setAviso('');
    setManuales((anteriores) => ({ ...anteriores, [datos.rol]: datos }));
  }

  async function guardarManuales() {
    const cargados = Object.values(manuales);
    if (!titular && !manuales.titular?.dni?.trim()) {
      setAviso('Falta cargar al titular de la reserva.');
      return;
    }
    if (cargados.length === 0) {
      setAviso('Buscá a un huésped por su DNI para poder guardarlo.');
      return;
    }
    if (cargados.some((h) => !h.nombre?.trim() || !h.apellido?.trim() || !h.dni?.trim())) {
      setAviso('Completá nombre, apellido y DNI.');
      return;
    }
    if (await onVincular(cargados)) {
      setManuales({});
      setVersion((v) => v + 1);
    }
  }

  async function confirmarDesdeMensaje(huespedes) {
    const ok = await onVincular(huespedes);
    if (ok && titular) setAbierta(false);
    return ok;
  }

  return (
    <Tarjeta titulo={titular ? 'Agregar acompañantes' : 'Cargar huéspedes'}>
      <ControlSegmentado etiqueta="Forma de carga" opciones={FORMAS} valor={forma} onCambiar={setForma} />

      {forma === 'mensaje' ? (
        <CargaRapidaHuespedes titularActual={titular} onConfirmar={confirmarDesdeMensaje} />
      ) : (
        <div className="space-y-4">
          {!titular && (
            <div className="space-y-2">
              <h3 className="text-[15px] font-semibold text-slate-900">Titular</h3>
              <BuscadorPorDni key={`titular-${version}`} rol="titular" onHuespedListo={huespedListo} />
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-slate-900">Acompañante</h3>
            <BuscadorPorDni key={`acompanante-${version}`} rol="acompañante" onHuespedListo={huespedListo} />
          </div>
          <Aviso tipo="advertencia">{aviso}</Aviso>
          <Boton variante="exito" ancho onClick={guardarManuales} disabled={ocupado}>
            Guardar huéspedes
          </Boton>
        </div>
      )}

      {titular && (
        <Boton variante="fantasma" ancho onClick={() => setAbierta(false)}>
          Cerrar
        </Boton>
      )}
    </Tarjeta>
  );
}
