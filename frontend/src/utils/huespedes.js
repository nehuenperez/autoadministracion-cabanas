/** Los datos de un huésped que se cargan desde la app. */
const CAMPOS_HUESPED = ['nombre', 'apellido', 'dni', 'cuil', 'telefono', 'direccion', 'vehiculoModelo', 'vehiculoPatente'];

/**
 * Para dar de alta o vincular: sólo los campos con dato. El backend crea o
 * actualiza según el DNI, y un campo vacío no debe borrar lo que ya estaba
 * guardado de una visita anterior.
 */
function soloConDato(huesped) {
  const datos = {};
  for (const campo of CAMPOS_HUESPED) {
    const valor = String(huesped[campo] ?? '').trim();
    if (valor) datos[campo] = valor;
  }
  return datos;
}

export { CAMPOS_HUESPED, soloConDato };
