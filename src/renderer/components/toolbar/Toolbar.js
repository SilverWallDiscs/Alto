import React, { useState } from 'react';
import { useStore, useDispatch, ACTIONS } from '../../store/store';

const TOOLS = [
  { id: 'select', label: 'Select (V)', icon: '↖', shortcut: 'v' },
  { id: 'blade', label: 'Blade/Cut (B)', icon: '✂', shortcut: 'b' },
  { id: 'hand', label: 'Hand/Pan (H)', icon: '✋', shortcut: 'h' },
  { id: 'zoom', label: 'Zoom (Z)', icon: '🔍', shortcut: 'z' },
  { id: 'trim', label: 'Trim (T)', icon: '◄►', shortcut: 't' },
  { id: 'text', label: 'Text (W)', icon: 'T', shortcut: 'w' },
];

export default function Toolbar({ onExport, onImport }) {
  const { state } = useStore();
  const dispatch = useDispatch();
  const [activeTool, setActiveTool] = useState('select');

  const handleImport = async () => {
    if (!window.alto) return;
    const result = await window.alto.openFile({
      filters: [
        { name: 'Video', extensions: ['mp4','mov','avi','mkv','webm','wmv','flv'] },
        { name: 'Audio', extensions: ['mp3','wav','aac','flac','ogg','m4a'] },
        { name: 'Image', extensions: ['png','jpg','jpeg','gif','bmp','webp'] },
        { name: 'All Media', extensions: ['mp4','mov','avi','mkv','webm','wmv','flv','mp3','wav','aac','flac','ogg','m4a','png','jpg','jpeg','gif','bmp','webp'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });
    if (!result.canceled) onImport(result.filePaths);
  };

  const canUndo = state.history.length > 0;
  const canRedo = state.future.length > 0;

  return (
    <div style={{
      height: 52,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 12px',
      flexShrink: 0,
    }}>
      {/* Project actions */}
      <Group>
        <TBtn title="New Project (Ctrl+N)" onClick={() => dispatch(ACTIONS.NEW_PROJECT)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
        </TBtn>
        <TBtn title="Import Media (Ctrl+I)" onClick={handleImport}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span style={{ fontSize: 11 }}>Import</span>
        </TBtn>
      </Group>

      <Divider />

      {/* Undo/Redo */}
      <Group>
        <TBtn title="Undo (Ctrl+Z)" onClick={() => dispatch(ACTIONS.UNDO)} disabled={!canUndo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
        </TBtn>
        <TBtn title="Redo (Ctrl+Shift+Z)" onClick={() => dispatch(ACTIONS.REDO)} disabled={!canRedo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>
        </TBtn>
      </Group>

      <Divider />

      {/* Edit tools */}
      <Group>
        {TOOLS.map(tool => (
          <TBtn
            key={tool.id}
            title={tool.label}
            active={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
          >
            <span style={{ fontSize: 14 }}>{tool.icon}</span>
          </TBtn>
        ))}
      </Group>

      <Divider />

      {/* Zoom */}
      <Group>
        <TBtn title="Zoom Out (Ctrl+-)" onClick={() => dispatch(ACTIONS.SET_ZOOM, state.zoom * 0.8)}>−</TBtn>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'center' }}>
          {Math.round(state.zoom / 100 * 100)}%
        </span>
        <TBtn title="Zoom In (Ctrl+=)" onClick={() => dispatch(ACTIONS.SET_ZOOM, state.zoom * 1.25)}>+</TBtn>
      </Group>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Export */}
      <button className="btn btn-primary" onClick={onExport} style={{ gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
    </div>
  );
}

function Group({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{children}</div>;
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 6px' }} />;
}

function TBtn({ title, onClick, active, disabled, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`btn-icon ${active ? 'active' : ''}`}
      style={{ fontSize: 13, opacity: disabled ? 0.35 : 1, padding: '5px 8px', gap: 4, display: 'flex', alignItems: 'center' }}
    >
      {children}
    </button>
  );
}
