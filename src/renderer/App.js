import React, { useEffect, useState, useCallback } from 'react';
import { StoreProvider, useStore, useDispatch, ACTIONS } from './store/store';
import TitleBar from './components/TitleBar';
import Toolbar from './components/toolbar/Toolbar';
import MediaPanel from './components/MediaPanel';
import PreviewPanel from './components/PreviewPanel';
import InspectorPanel from './components/InspectorPanel';
import Timeline from './components/timeline/Timeline';
import EffectsPanel from './components/effects/EffectsPanel';
import ExportModal from './components/ExportModal';
import UpdateBanner from './components/UpdateBanner';
import './styles.css';

function AppInner() {
  const { state } = useStore();
  const dispatch = useDispatch();
  const [showExport, setShowExport] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [inspectorWidth, setInspectorWidth] = useState(260);

  // Menu event listeners
  useEffect(() => {
    if (!window.alto) return;

    const handlers = {
      'menu-new-project': () => { if (confirm('Start a new project?')) dispatch(ACTIONS.NEW_PROJECT); },
      'menu-import-media': (paths) => handleImportMedia(paths),
      'menu-export': () => setShowExport(true),
      'menu-undo': () => dispatch(ACTIONS.UNDO),
      'menu-redo': () => dispatch(ACTIONS.REDO),
      'menu-split': () => dispatch(ACTIONS.SPLIT_CLIP, { clipId: state.selectedClipIds[0], splitTime: state.playhead }),
      'updater:available': (info) => setUpdateInfo(info),
    };

    Object.entries(handlers).forEach(([ch, fn]) => window.alto.on(ch, fn));
    return () => Object.keys(handlers).forEach(ch => window.alto.off(ch, handlers[ch]));
  }, [state.selectedClipIds, state.playhead]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch(ACTIONS.UNDO); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); dispatch(ACTIONS.REDO); }
      if (e.key === ' ') { e.preventDefault(); dispatch(ACTIONS.SET_PLAYING, !state.isPlaying); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedClipIds.length) dispatch(ACTIONS.REMOVE_CLIP, state.selectedClipIds);
      }
      if (e.key === 'Home') dispatch(ACTIONS.SET_PLAYHEAD, 0);
      if (e.key === 'End') dispatch(ACTIONS.SET_PLAYHEAD, state.duration);
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        if (state.selectedClipIds[0]) dispatch(ACTIONS.SPLIT_CLIP, { clipId: state.selectedClipIds[0], splitTime: state.playhead });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '=') dispatch(ACTIONS.SET_ZOOM, state.zoom * 1.25);
      if ((e.metaKey || e.ctrlKey) && e.key === '-') dispatch(ACTIONS.SET_ZOOM, state.zoom * 0.8);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.isPlaying, state.selectedClipIds, state.playhead, state.duration, state.zoom]);

  const handleImportMedia = useCallback(async (paths) => {
    if (!paths?.length) return;
    const mediaItems = paths.map(p => {
      const name = p.split(/[\\/]/).pop();
      const ext = name.split('.').pop().toLowerCase();
      const type = ['mp4','mov','avi','mkv','webm','wmv','flv'].includes(ext) ? 'video'
        : ['mp3','wav','aac','flac','ogg','m4a'].includes(ext) ? 'audio'
        : 'image';
      return { id: Math.random().toString(36).slice(2), name, path: p, type, duration: type === 'image' ? 5 : 10 };
    });
    dispatch(ACTIONS.ADD_MEDIA, mediaItems);
  }, [dispatch]);

  const handleDropFiles = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).map(f => f.path);
    if (files.length) handleImportMedia(files);
  }, [handleImportMedia]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDropFiles}
    >
      <TitleBar projectName={state.projectName} />
      {updateInfo && <UpdateBanner info={updateInfo} onDismiss={() => setUpdateInfo(null)} />}
      <Toolbar onExport={() => setShowExport(true)} onImport={handleImportMedia} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left panel */}
        <div style={{ width: sidebarWidth, minWidth: 200, maxWidth: 400, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <PanelTabs activePanel={state.activePanel} dispatch={dispatch} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {state.activePanel === 'media' && <MediaPanel onImport={handleImportMedia} />}
            {state.activePanel === 'effects' && <EffectsPanel />}
            {state.activePanel === 'transitions' && <EffectsPanel mode="transitions" />}
            {state.activePanel === 'audio' && <EffectsPanel mode="audio" />}
          </div>
        </div>

        {/* Center: preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <PreviewPanel />
        </div>

        {/* Right: inspector */}
        <div style={{ width: inspectorWidth, minWidth: 200, maxWidth: 380, borderLeft: '1px solid var(--border)', background: 'var(--bg-panel)', overflow: 'auto' }}>
          <InspectorPanel />
        </div>
      </div>

      {/* Timeline */}
      <div style={{ height: 280, borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0 }}>
        <Timeline />
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}

function PanelTabs({ activePanel, dispatch }) {
  const tabs = [
    { id: 'media', label: 'Media' },
    { id: 'effects', label: 'Effects' },
    { id: 'transitions', label: 'Transitions' },
    { id: 'audio', label: 'Audio' },
  ];
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => dispatch(ACTIONS.SET_ACTIVE_PANEL, t.id)}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: activePanel === t.id ? 'var(--bg-panel)' : 'transparent',
            border: 'none',
            borderBottom: activePanel === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: activePanel === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '11px',
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
