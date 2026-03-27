export function ErrorMessage({ error, onRetry }) {
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
      }}>⚠️</div>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '8px',
      }}>Something went wrong</h3>
      <p style={{
        maxWidth: '400px',
        marginBottom: '24px',
        fontSize: '14px',
      }}>
        {error?.message || 'Unable to load data. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 24px',
            background: '#e85d26',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.3s',
          }}
          onMouseEnter={(e) => e.target.style.background = '#d64f1f'}
          onMouseLeave={(e) => e.target.style.background = '#e85d26'}
        >
          Try Again ↻
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
