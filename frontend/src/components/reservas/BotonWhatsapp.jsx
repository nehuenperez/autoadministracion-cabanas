import { MessageCircle } from 'lucide-react';
import { armarLinkWhatsapp } from '../../utils/whatsapp.js';
import { clasesDeBoton } from '../../utils/estilos.js';

/** Abre WhatsApp con el mensaje ya escrito para el número del huésped. */
export default function BotonWhatsapp({ telefono, mensaje, className = '' }) {
  if (!telefono) return null;

  return (
    <a
      href={armarLinkWhatsapp(telefono, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className={clasesDeBoton({ variante: 'whatsapp', className })}
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      WhatsApp
    </a>
  );
}
