/**
 * Fechas del negocio.
 *
 * Todas las fechas de la base son DATEONLY ('AAAA-MM-DD'): un check-in, un
 * cobro. Se comparan como texto, que en ese formato ordena igual que las
 * fechas, y nunca se convierten a Date: new Date('2026-03-10') es la medianoche
 * UTC, que en Argentina todavía es el día anterior.
 *
 * "Hoy" es siempre el día en el complejo, no el del servidor: Render corre en
 * UTC, que a partir de las 21 h de Argentina ya es mañana.
 */

const ZONA_HORARIA = 'America/Argentina/San_Luis';

/** Hoy en Argentina, como 'AAAA-MM-DD'. */
function fechaDeHoy(ahora = new Date()) {
  // en-CA formatea justo como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(ahora);
}

/** Suma (o resta) días a una fecha 'AAAA-MM-DD'. */
function sumarDias(fecha, dias) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

/** Primer día del mes y primer día del mes siguiente, para filtrar con >= y <. */
function rangoDelMes(mes, anio) {
  const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const siguiente = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
  return { inicio, fin: siguiente };
}

export { fechaDeHoy, sumarDias, rangoDelMes };
