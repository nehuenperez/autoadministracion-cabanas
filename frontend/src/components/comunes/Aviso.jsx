import { CircleAlert, Info, TriangleAlert } from 'lucide-react';

const TIPOS = {
  error: { clases: 'bg-rose-50 border-rose-200 text-rose-800', Icono: CircleAlert },
  advertencia: { clases: 'bg-amber-50 border-amber-200 text-amber-900', Icono: TriangleAlert },
  info: { clases: 'bg-blue-50 border-blue-200 text-blue-900', Icono: Info },
};

/** Recuadro de aviso: errores, advertencias o información. Sin contenido no muestra nada. */
export default function Aviso({ tipo = 'error', children }) {
  if (!children) return null;
  const { clases, Icono } = TIPOS[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`flex gap-2.5 p-3 border rounded-xl text-sm animate-aparecer ${clases}`}>
      <Icono className="size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
