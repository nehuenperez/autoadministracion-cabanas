/**
 * Clases de Tailwind compartidas por botones y campos, para que se vean igual
 * en toda la app. Escritas completas para que Tailwind las encuentre.
 */

// Los fondos de color son de tono 700 en adelante: con texto blanco dan un
// contraste de al menos 4,5:1, el mínimo recomendado para que se lea bien.
const VARIANTES_DE_BOTON = {
  primario: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
  exito: 'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900',
  whatsapp: 'bg-green-700 text-white hover:bg-green-800 active:bg-green-900',
  secundario: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  suave: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
  peligro: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:bg-rose-200',
  fantasma: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
};

// Alto mínimo de 44 px en adelante: es lo cómodo para tocar con el dedo
const TAMANOS_DE_BOTON = {
  normal: 'min-h-12 px-4 text-[15px] gap-2',
  chico: 'min-h-11 px-3 text-sm gap-1.5',
};

/** Las clases de un botón, para usarlas en un <button>, un <Link> o un <a>. */
function clasesDeBoton({ variante = 'primario', tamano = 'normal', ancho = false, className = '' } = {}) {
  return [
    'inline-flex items-center justify-center rounded-xl font-semibold transition-colors cursor-pointer select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTES_DE_BOTON[variante],
    TAMANOS_DE_BOTON[tamano],
    ancho ? 'w-full' : '',
    className,
  ].join(' ');
}

/**
 * Clases de los campos de texto. La letra es de 16 px a propósito: con menos,
 * el iPhone agranda la pantalla cada vez que se toca un campo.
 */
const claseDeCampo =
  'w-full min-h-12 px-3.5 text-base text-slate-900 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 ' +
  'focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 transition disabled:bg-slate-50 disabled:text-slate-400';

export { clasesDeBoton, claseDeCampo };
