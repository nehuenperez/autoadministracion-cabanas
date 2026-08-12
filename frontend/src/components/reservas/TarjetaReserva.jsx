import { useSemaforo } from '../../hooks/useSemaforo.js';

const COLORES = {
  azul: '#3b82f6',
  amarillo: '#eab308',
  verde: '#22c55e',
  rojo: '#ef4444',
  gris: '#9ca3af',
};

export default function TarjetaReserva({ reserva, onClick }) {
  const { color, etiqueta } = useSemaforo(reserva);
  const titular = reserva.Huespeds?.find((h) => h.ReservaHuesped?.rol === 'titular');

  return (
    <div
      onClick={onClick}
      style={{
        borderLeft: `6px solid ${COLORES[color]}`,
        background: '#fff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{reserva.Cabana?.nombre}</strong>
        <span style={{ fontSize: 12, color: COLORES[color], fontWeight: 'bold' }}>{reserva.estado}</span>
      </div>
      <p style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 'bold' }}>
        {titular ? `${titular.nombre} ${titular.apellido}` : '⚠️ Sin titular registrado'}
      </p>
      <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>
        {reserva.fechaCheckIn} → {reserva.fechaCheckOut}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
        Saldo pendiente: ${Number(reserva.saldoPendiente).toLocaleString('es-AR')}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORES[color] }}>{etiqueta}</p>
    </div>
  );
}