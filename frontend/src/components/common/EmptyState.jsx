export function EmptyState({ icon = '🌿', title = 'No Data', message = 'Nothing to display right now' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      minHeight: '300px',
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '16px',
        animation: 'float 3s ease-in-out infinite',
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '8px',
      }}>
        {title}
      </h3>
      <p style={{
        maxWidth: '400px',
        fontSize: '14px',
      }}>
        {message}
      </p>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

export default EmptyState;
