export default function ConfirmDialog({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 320, textAlign: 'center' }}>
        <p style={{ marginTop: 0 }}>{mensaje}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={onCancelar} style={{ padding: '8px 16px' }}>Revisar</button>
          <button onClick={onConfirmar} style={{ padding: '8px 16px', fontWeight: 'bold' }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}