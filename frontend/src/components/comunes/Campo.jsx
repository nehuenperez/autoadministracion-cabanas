/**
 * Un campo con su rótulo arriba y, opcionalmente, una ayuda abajo. `children`
 * es el control: un input con `claseDeCampo` (utils/estilos.js), un CampoMonto,
 * un ControlSegmentado...
 *
 * Con `grupo` el contenedor es un <div> en vez de un <label>: un <label> que
 * envuelve varios botones activa el primero cuando se toca el rótulo.
 */
export default function Campo({ rotulo, ayuda, grupo = false, className = '', children }) {
  const Contenedor = grupo ? 'div' : 'label';
  return (
    <Contenedor className={`block space-y-1.5 ${className}`}>
      <span className="block text-sm font-medium text-slate-700">{rotulo}</span>
      {children}
      {ayuda && <span className="block text-sm text-slate-500">{ayuda}</span>}
    </Contenedor>
  );
}
