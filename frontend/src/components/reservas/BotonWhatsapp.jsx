import { armarLinkWhatsapp } from '../../utils/whatsapp.js';

/** Abre WhatsApp con el mensaje ya escrito para el número del huésped. */
export default function BotonWhatsapp({ telefono, mensaje }) {
  if (!telefono) return null;

  return (
    <a
      href={armarLinkWhatsapp(telefono, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
    >
      WhatsApp
    </a>
  );
}
