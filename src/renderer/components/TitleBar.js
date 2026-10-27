import React, { useState, useEffect } from 'react';

export default function TitleBar({ projectName }) {
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    if (!window.alto) return;
    const check = async () => setIsMax(await window.alto.isMaximized());
    check();
  }, []);

  return (
    <div style={{
      height: 38,
      background: 'var(--bg-surface)',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      WebkitAppRegion: 'drag',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', WebkitAppRegion: 'no-drag' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.5 }}>Alto</span>
      </div>

      {/* Project name */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-secondary)', fontSize: 12 }}>
        {projectName}
      </div>

      {/* Window controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', WebkitAppRegion: 'no-drag' }}>
        <WinBtn color="#ffbd2e" onClick={() => window.alto?.minimize()} title="Minimize">−</WinBtn>
        <WinBtn color="#28c840" onClick={async () => { await window.alto?.maximize(); setIsMax(m => !m); }} title={isMax ? 'Restore' : 'Maximize'}>{isMax ? '❐' : '□'}</WinBtn>
        <WinBtn color="#ff5f57" onClick={() => window.alto?.close()} title="Close">×</WinBtn>
      </div>
    </div>
  );
}

function WinBtn({ color, onClick, title, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 46,
        height: 38,
        background: hover ? color + '33' : 'transparent',
        border: 'none',
        color: hover ? color : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
