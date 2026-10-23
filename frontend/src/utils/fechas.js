/**
 * Fechas en la interfaz.
 *
 * La API usa siempre 'AAAA-MM-DD'. Se comparan como texto (en ese formato
 * ordena igual que las fechas) y, cuando hace falta un Date, se arma con la
 * hora local. Nunca new Date('2026-03-10'): eso es la medianoche UTC, que en
 * Argentina todavía es el día anterior.
 */

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Date (hora local) → 'AAAA-MM-DD'. */
function aISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** 'AAAA-MM-DD' → Date a la medianoche local. */
function deISO(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function hoyISO(ahora = new Date()) {
  return aISO(ahora);
}

function sumarDias(texto, dias) {
  const fecha = deISO(texto);
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

/** Días enteros de `desde` a `hasta` (negativo si `hasta` ya pasó). */
function diasEntre(desde, hasta) {
  // Math.round absorbe la hora de diferencia de los cambios de horario
  return Math.round((deISO(hasta) - deISO(desde)) / 86400000);
}

/** '2026-03-10' → '10/03/2026' */
function formatearFecha(texto) {
  if (!texto) return '__ /__ /____';
  const [anio, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** 'Del 10 al 15 de Marzo' o 'Del 28 de Marzo al 2 de Abril' */
function formatearRango(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '';
  const [, mesIn, diaIn] = checkIn.split('-').map(Number);
  const [, mesOut, diaOut] = checkOut.split('-').map(Number);
  if (mesIn === mesOut) return `Del ${diaIn} al ${diaOut} de ${NOMBRES_MESES[mesIn - 1]}`;
  return `Del ${diaIn} de ${NOMBRES_MESES[mesIn - 1]} al ${diaOut} de ${NOMBRES_MESES[mesOut - 1]}`;
}

const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** '2026-10-23' → 'viernes 23 de octubre' */
function formatearDia(texto) {
  const fecha = deISO(texto);
  return `${NOMBRES_DIAS[fecha.getDay()]} ${fecha.getDate()} de ${NOMBRES_MESES[fecha.getMonth()].toLowerCase()}`;
}

/** '2026-10-21' → 'mié 21 oct' */
function formatearDiaCorto(texto) {
  const fecha = deISO(texto);
  return `${NOMBRES_DIAS[fecha.getDay()].slice(0, 3)} ${fecha.getDate()} ${NOMBRES_MESES[fecha.getMonth()].slice(0, 3).toLowerCase()}`;
}

/** Noches entre el check-in y el check-out: '4 noches', '1 noche'. */
function formatearNoches(checkIn, checkOut) {
  const noches = diasEntre(checkIn, checkOut);
  return `${noches} ${noches === 1 ? 'noche' : 'noches'}`;
}

/**
 * Las celdas de un mes para una grilla que arranca el lunes: primero `null`
 * por cada día vacío antes del 1, después cada fecha 'AAAA-MM-DD'.
 */
function diasDelMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1).getDay(); // 0 = domingo
  const vacios = primerDia === 0 ? 6 : primerDia - 1;
  const cantidad = new Date(anio, mes + 1, 0).getDate();
  return [
    ...Array(vacios).fill(null),
    ...Array.from({ length: cantidad }, (_, i) => aISO(new Date(anio, mes, i + 1))),
  ];
}

export {
  NOMBRES_MESES,
  aISO,
  deISO,
  hoyISO,
  sumarDias,
  diasEntre,
  formatearFecha,
  formatearRango,
  formatearDia,
  formatearDiaCorto,
  formatearNoches,
  diasDelMes,
};
