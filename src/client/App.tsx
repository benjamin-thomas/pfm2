import { useState, useEffect } from 'react';
import type { Status } from '@shared/async';

type HealthData = {
  status: string;
  timestamp: number;
};

function App() {
  const [health, setHealth] = useState<Status<HealthData>>({ kind: 'Loading' });

  useEffect(() => {
    fetch('/health')
      .then(res => res.json())
      .then((data: HealthData) => setHealth({ kind: 'Loaded', ...data }))
      .catch(err => setHealth({ kind: 'Error', error: err.message }));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>PFM2 - Personal Finance Manager</h1>
      <p>
        Backend health:{' '}
        {(() => {
          switch (health.kind) {
            case 'Loading':
              return 'Loading...';
            case 'Loaded':
              return `${health.status} (${new Date(health.timestamp).toISOString()})`;
            case 'Error':
              return `Error: ${health.error}`;
            default: {
              const _exhaustive: never = health;
              return _exhaustive;
            }
          }
        })()}
      </p>
    </div>
  );
}

export default App;
