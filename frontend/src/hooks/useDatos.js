import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos de la API para una pantalla.
 *
 *   const { datos, cargando, error, recargar } = useDatos(cargar);
 *
 * `cargar` es una función que devuelve una promesa. Tiene que ser estable:
 * declarada fuera del componente o con useCallback. Cuando cambia (otro mes,
 * otra reserva), `cargando` vuelve a true hasta que llegan los datos nuevos.
 *
 * `recargar()` vuelve a pedir los datos sin pasar por `cargando`: la pantalla
 * queda donde estaba y se actualiza sola, sin mostrar la pantalla de carga ni
 * volver arriba de todo después de, por ejemplo, registrar un cobro.
 */
function useDatos(cargar) {
  // `para` recuerda qué función trajo los datos: si no es la actual, todavía se está cargando
  const [estado, setEstado] = useState({ para: null, datos: null, error: null });
  const vigente = useRef(cargar);

  useEffect(() => {
    vigente.current = cargar;
  }, [cargar]);

  const recargar = useCallback(async () => {
    try {
      const datos = await cargar();
      // Si mientras tanto se pidió otra cosa (se cambió de mes), esta respuesta ya no sirve
      if (vigente.current === cargar) setEstado({ para: cargar, datos, error: null });
    } catch (error) {
      if (vigente.current === cargar) {
        // En una recarga fallida se conservan los datos que ya se veían
        setEstado((anterior) => ({ para: cargar, datos: anterior.para === cargar ? anterior.datos : null, error }));
      }
    }
  }, [cargar]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos: estado.datos, error: estado.error, cargando: estado.para !== cargar, recargar };
}

export { useDatos };
