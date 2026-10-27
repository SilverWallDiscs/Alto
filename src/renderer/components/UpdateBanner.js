import React, { useState } from 'react';

export default function UpdateBanner({ info, onDismiss }) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await window.alto?.installUpdate();
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(124,92,252,0.15), rgba(124,92,252,0.08))',
      borderBottom: '1px solid var(--border-accent)',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
      animation: 'slide-in 0.3s ease',
    }}>
      <span style={{ fontSize: 16 }}>🚀</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
          Alto {info?.version} is ready to install
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
          Update downloaded from GitHub
        </span>
      </div>
      <button
        className="btn btn-primary"
        onClick={handleInstall}
        disabled={installing}
        style={{ fontSize: 11 }}
      >
        {installing ? '⟳ Restarting…' : 'Install & Restart'}
      </button>
      <button
        className="btn-icon"
        onClick={onDismiss}
        style={{ fontSize: 16, flexShrink: 0 }}
        title="Dismiss"
      >✕</button>
    </div>
  );
}
