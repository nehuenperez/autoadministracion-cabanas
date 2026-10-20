const ESTILOS = {
  error: 'bg-rose-50 border-rose-100 text-rose-600',
  advertencia: 'bg-amber-50 border-amber-100 text-amber-700',
  info: 'bg-blue-50 border-blue-100 text-blue-700',
};

/** Recuadro de aviso: errores, advertencias o información. */
export default function Aviso({ tipo = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`p-2.5 border rounded-lg text-center text-xs font-semibold animate-aparecer ${ESTILOS[tipo]}`}>
      {children}
    </div>
  );
}
