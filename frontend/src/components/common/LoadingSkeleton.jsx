export function LoadingSkeleton({ type = 'default' }) {
  // Simple/safe loading screen
  if (type === 'full-page') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0d1720',
        color: '#e8f0fe',
        fontSize: '16px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            marginBottom: '20px',
            fontSize: '12px',
            color: '#52b788',
            animation: 'pulse 1.5s infinite',
          }}>
            ⚙️ Initializing...
          </div>
          <div style={{ marginBottom: '20px' }}>Loading TrafficWatch</div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card" style={{
            height: '200px',
            background: 'linear-gradient(90deg, #1a2535 0%, #2a3548 50%, #1a2535 100%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s infinite',
            borderRadius: '8px',
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
export default LoadingSkeleton;
export function TableLoadingSkeleton() {
  return (
    <div style={{ padding: '24px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {[1, 2, 3, 4, 5].map(i => (
            <tr key={i} style={{ borderBottom: '1px solid #2a3548' }}>
              {[1, 2, 3, 4, 5].map(j => (
                <td key={j} style={{
                  padding: '12px',
                  height: '20px',
                  background: 'linear-gradient(90deg, #1a2535 0%, #2a3548 50%, #1a2535 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'pulse 1.5s infinite',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
