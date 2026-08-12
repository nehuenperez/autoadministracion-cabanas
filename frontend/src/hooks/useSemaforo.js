function useSemaforo(reserva) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const checkIn = new Date(reserva.fechaCheckIn);
  const horasHastaCheckIn = (checkIn - hoy) / (1000 * 60 * 60);

  const saldoPendiente = Number(reserva.saldoPendiente);

  // Verde: saldo en $0, sin importar el estado (cubre Pagada, Finalizada, o Señada con $0 desde el inicio)
  if (saldoPendiente <= 0) {
    return { color: 'verde', etiqueta: 'Saldo al día' };
  }

  // A partir de acá, solo aplica si todavía queda saldo pendiente
  if (reserva.estado === 'Señada') {
    if (checkIn < hoy) {
      return { color: 'rojo', etiqueta: 'Olvido de cobro: check-in pasado, saldo pendiente' };
    }
    if (horasHastaCheckIn <= 24) {
      return { color: 'amarillo', etiqueta: 'Recordar cobrar el saldo' };
    }
    return { color: 'azul', etiqueta: 'Tranquilidad, falta para el ingreso' };
  }

  // Casos por defecto (ej: Abortada) — un gris neutro, no forma parte de las 4 reglas centrales
  return { color: 'gris', etiqueta: reserva.estado };
}

export { useSemaforo };