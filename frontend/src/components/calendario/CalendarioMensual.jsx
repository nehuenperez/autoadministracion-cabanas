import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CalendarioMensual({ reservas = [], cabanas = [], pagosPorReserva = {} }) {
  const navigate = useNavigate();
  const [mesActual, setMesActual] = useState(new Date());

  const obtenerFechaLocalString = (dateInstance = new Date()) => {
    const tzOffset = dateInstance.getTimezoneOffset() * 60000;
    const localTime = new Date(dateInstance.getTime() - tzOffset);
    return localTime.toISOString().split('T')[0];
  };

  const [diaSeleccionadoStr, setDiaSeleccionadoStr] = useState(obtenerFechaLocalString());

  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function cambiarMes(factor) {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + factor, 1));
  }

  const formatearRangoAmigable = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '';
    const [, mIn, dIn] = checkIn.split('-').map(Number);
    const [, mOut, dOut] = checkOut.split('-').map(Number);
    
    if (mIn === mOut) {
      return `Del ${dIn} al ${dOut} de ${nombresMeses[mIn - 1]}`;
    } else {
      return `Del ${dIn} de ${nombresMeses[mIn - 1]} al ${dOut} de ${nombresMeses[mOut - 1]}`;
    }
  };

  function obtenerConfiguracionSemaforo(reserva) {
    if (!reserva) return { bgCell: 'bg-slate-50', textClass: 'text-slate-400', label: 'Desconocido', badge: 'bg-slate-100 text-slate-600' };

    const pagos = pagosPorReserva[reserva.id] || [];
    const totalPagado = pagos.reduce((acum, p) => acum + Number(p.monto), 0);
    const saldoPendiente = Number(reserva.montoTotal) - totalPagado;

    if (reserva.estado === 'Abortada') {
      return { bgCell: 'bg-white', textClass: 'text-slate-400 font-normal line-through', label: 'Abortada', badge: 'bg-slate-100 text-slate-400' };
    }
    
    if (reserva.estado === 'Finalizada') {
      return { bgCell: 'bg-slate-100/70 border-slate-200/80', textClass: 'text-slate-400 font-medium line-through decoration-slate-300', label: 'Finalizada', badge: 'bg-slate-100 text-slate-500' };
    }

    if (totalPagado === 0) {
      return { 
        bgCell: 'bg-rose-50/90 border-rose-200', 
        textClass: 'text-rose-700 font-bold line-through decoration-rose-300', 
        label: 'Sin Seña / Revisar', 
        badge: 'bg-rose-50 text-rose-700 border-rose-100' 
      };
    }
    
    if (saldoPendiente <= 0) {
      return { bgCell: 'bg-emerald-50/80 border-emerald-100', textClass: 'text-emerald-700 font-bold line-through decoration-emerald-400', label: 'Pagada', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }

    try {
      const [anio, mes, dia] = reserva.fechaCheckIn.split('-').map(Number);
      const checkInFecha = new Date(anio, mes - 1, dia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      checkInFecha.setHours(0, 0, 0, 0);

      const diferenciaDias = (checkInFecha - hoy) / (1000 * 60 * 60 * 24);

      // Check-in pasado con saldo: es rojo (olvido de cobro), igual que en el detalle
      if (diferenciaDias < 0) {
        return { bgCell: 'bg-rose-50/90 border-rose-200', textClass: 'text-rose-700 font-bold line-through decoration-rose-300', label: 'Saldo pendiente', badge: 'bg-rose-50 text-rose-700 border-rose-100' };
      }
      if (diferenciaDias <= 1) {
        return { bgCell: 'bg-amber-50/90 border-amber-200', textClass: 'text-amber-800 font-bold line-through decoration-amber-400', label: 'Cobrar hoy', badge: 'bg-amber-50 text-amber-700 border-amber-100' };
      }
    } catch { /* si la fecha no se puede interpretar, se cae al estilo por defecto de abajo */ }
    
    return { bgCell: 'bg-sky-50/80 border-sky-100', textClass: 'text-sky-700 font-bold line-through decoration-sky-400', label: 'Señada', badge: 'bg-sky-50 text-sky-700 border-sky-100' };
  }

  function obtenerEstadoDiaPorCabana(fechaStr, cabanaId) {
    const target = new Date(fechaStr + 'T00:00:00');
    let ocupacion = null;
    const movimientos = [];

    if (!Array.isArray(reservas)) return { ocupacion, movimientos };

    reservas.forEach(r => {
      if (!r || !r.fechaCheckIn || !r.fechaCheckOut || Number(r.cabanaId) !== Number(cabanaId)) return;

      const entrada = new Date(r.fechaCheckIn + 'T00:00:00');
      const salida = new Date(r.fechaCheckOut + 'T00:00:00');

      const esCheckIn = r.fechaCheckIn === fechaStr;
      const esCheckOut = r.fechaCheckOut === fechaStr;
      const esEstadia = target > entrada && target < salida;

      if (esCheckIn || esCheckOut || esEstadia) {
        let tipo = 'estadia';
        if (esCheckIn) tipo = 'ingreso';
        if (esCheckOut) tipo = 'egreso';

        const configSemaforo = obtenerConfiguracionSemaforo(r);

        if ((esCheckIn || esEstadia) && r.estado !== 'Abortada') {
          ocupacion = configSemaforo;
        }

        movimientos.push({
          reserva: r,
          tipo,
          semaforo: configSemaforo
        });
      }
    });

    return { ocupacion, movimientos };
  }

  function generarDiasGrid(cabanaId) {
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    let inicioSemana = primerDia.getDay();
    inicioSemana = inicioSemana === 0 ? 6 : inicioSemana - 1;

    const celdas = [];

    for (let i = 0; i < inicioSemana; i++) {
      celdas.push(<div key={`blank-${cabanaId}-${i}`} className="p-1 bg-slate-50/30 border border-slate-100/40"></div>);
    }

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const strFecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const { ocupacion, movimientos } = obtenerEstadoDiaPorCabana(strFecha, cabanaId);
      
      const esHoy = obtenerFechaLocalString() === strFecha;
      const esSeleccionado = diaSeleccionadoStr === strFecha;

      let estiloCelda = "bg-white text-slate-700 hover:bg-slate-50";
      let estiloTexto = "text-xs font-bold text-slate-700";

      if (ocupacion) {
        estiloCelda = `${ocupacion.bgCell} border-l-2`;
        estiloTexto = `${ocupacion.textClass} text-xs`;
      }

      const tieneIngreso = movimientos.some(m => m.tipo === 'ingreso' && m.reserva?.estado !== 'Abortada');
      const tieneEgreso = movimientos.some(m => m.tipo === 'egreso' && m.reserva?.estado !== 'Abortada');

      celdas.push(
        <button
          type="button"
          key={`day-${cabanaId}-${d}`}
          onClick={() => setDiaSeleccionadoStr(strFecha)}
          className={`p-1 min-h-[48px] border border-slate-100 flex flex-col justify-between items-center relative transition-all cursor-pointer focus:outline-hidden ${estiloCelda} ${
            esSeleccionado ? 'ring-2 ring-blue-600/80 z-10 rounded-lg' : ''
          }`}
        >
          <span className={`${estiloTexto} ${
            esHoy ? 'bg-slate-950 text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black' : ''
          }`}>
            {d}
          </span>

          <div className="flex gap-1 justify-center items-center h-2 mb-0.5 w-full">
            {tieneIngreso && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            {tieneEgreso && <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />}
          </div>
        </button>
      );
    }

    return celdas;
  }

  const [, selMes, selDia] = diaSeleccionadoStr.split('-');

  return (
    <div className="space-y-4">
      
      {/* Selector de Mes Global */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/70 flex justify-between items-center shadow-xs">
        <button type="button" onClick={() => cambiarMes(-1)} className="p-2 font-bold text-slate-400 hover:text-slate-900 text-sm focus:outline-hidden cursor-pointer">←</button>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {nombresMeses[mesActual.getMonth()]} {mesActual.getFullYear()}
        </span>
        <button type="button" onClick={() => cambiarMes(1)} className="p-2 font-bold text-slate-400 hover:text-slate-900 text-sm focus:outline-hidden cursor-pointer">→</button>
      </div>

      {/* Renderizado de Calendarios + Agendas Individuales */}
      <div className="space-y-6">
        {cabanas.map((cabana) => {
          const { movimientos } = obtenerEstadoDiaPorCabana(diaSeleccionadoStr, cabana.id);

          return (
            <div key={cabana.id} className="space-y-3">
              
              {/* Bloque Calendario */}
              <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-xs p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">{cabana.nombre}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calendario</span>
                </div>

                <div className="grid grid-cols-7 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                  <div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sa</div><div>Do</div>
                </div>

                <div className="grid grid-cols-7 bg-slate-50/20">
                  {generarDiasGrid(cabana.id)}
                </div>
              </div>

              {/* AGENDA INDIVIDUAL: Con textos corregidos a presente (INGRESA / EGRESA) */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Agenda: {selDia}/{selMes}
                  </span>
                  <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">
                    {movimientos.length} {movimientos.length === 1 ? 'Movimiento' : 'Movimientos'}
                  </span>
                </div>

                {movimientos.length === 0 ? (
                  <p className="text-[11px] font-medium text-slate-400 py-2.5 text-center bg-slate-50/40 rounded-lg border border-dashed border-slate-100">
                    Sin check-in ni check-out para esta unidad hoy.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {movimientos.map((ev, i) => {
                      if (!ev?.reserva) return null;
                      const titular = ev.reserva.Huespeds?.find(h => h.ReservaHuesped?.role === 'titular' || h.ReservaHuesped?.rol === 'titular');

                      return (
                        <div 
                          key={i}
                          onClick={() => navigate(`/reservas/${ev.reserva.id}`)}
                          className="p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs cursor-pointer active:scale-[0.995] transition-all"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {/* TEXTOS CORREGIDOS A TIEMPO PRESENTE AQUÍ */}
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-xs ${
                                ev.tipo === 'ingreso' ? 'bg-emerald-600 text-white' :
                                ev.tipo === 'egreso' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {ev.tipo === 'ingreso' ? 'INGRESA' : 'EGRESA'}
                              </span>
                            </div>
                            <p className="font-bold text-slate-700 capitalize">
                              {titular ? `${titular.nombre} ${titular.apellido}` : '👤 Sin responsable asignado'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {formatearRangoAmigable(ev.reserva.fechaCheckIn, ev.reserva.fechaCheckOut)}
                            </p>
                          </div>

                          <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-md shrink-0 ${ev.semaforo.badge}`}>
                            {ev.semaforo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Guía de Referencia Completa */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/70 shadow-xs flex flex-col gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span><span>Tranquilidad</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span>Cobrar hoy</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span>Al día</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>Revisar / Sin Seña</span></div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9px] text-slate-400 capitalize">
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span><span>● Check-in (Entra)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span><span>● Check-out (Sale)</span></div>
        </div>
      </div>

    </div>
  );
}