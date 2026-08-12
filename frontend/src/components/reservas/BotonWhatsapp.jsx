import { armarLinkWhatsapp } from '../../utils/whatsapp.js';

export default function BotonWhatsapp({ telefono, mensaje }) {
  if (!telefono) return null;

  const link = armarLinkWhatsapp(telefono, mensaje);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        background: '#25D366',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: 6,
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: 14,
      }}
    >
      WhatsApp
    </a>
  );
}