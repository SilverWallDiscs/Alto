import React, { useState, useRef } from 'react';
import { useStore, useDispatch, ACTIONS } from '../store/store';

export default function MediaPanel({ onImport }) {
  const { state } = useStore();
  const dispatch = useDispatch();
  const [view, setView] = useState('grid'); // grid | list
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef();

  const filtered = state.mediaPool.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.type === filter;
    return matchSearch && matchFilter;
  });

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).map(f => f.path);
    if (files.length) onImport(files);
  };

  const handleImportClick = async () => {
    if (!window.alto) return;
    const result = await window.alto.openFile({
      filters: [{ name: 'All Media', extensions: ['mp4','mov','avi','mkv','webm','wmv','flv','mp3','wav','aac','flac','ogg','m4a','png','jpg','jpeg','gif','bmp','webp'] }],
      properties: ['openFile', 'multiSelections'],
    });
    if (!result.canceled) onImport(result.filePaths);
  };

  const handleMediaDragStart = (e, media) => {
    e.dataTransfer.setData('application/alto-media', JSON.stringify(media));
  };

  const typeIcon = (type) => type === 'video' ? '🎬' : type === 'audio' ? '🎵' : '🖼';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search + filter bar */}
      <div className="panel-section" style={{ paddingBottom: 8 }}>
        <input
          placeholder="Search media…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['all','video','audio','image'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid ' + (filter === f ? 'var(--accent)' : 'var(--border)'),
                background: filter === f ? 'var(--accent-glow)' : 'transparent',
                color: filter === f ? 'var(--accent-bright)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'var(--font)',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {['grid','list'].map(v => (
            <button key={v} className={`btn-icon ${view === v ? 'active' : ''}`} onClick={() => setView(v)} style={{ padding: 4 }}>
              {v === 'grid' ? '▦' : '≡'}
            </button>
          ))}
        </div>
      </div>

      {/* Media list */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragging ? 'drag-over' : ''}
        style={{ flex: 1, overflowY: 'auto', padding: 8 }}
      >
        {filtered.length === 0 ? (
          <div
            onClick={handleImportClick}
            style={{
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.15s',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>📂</span>
            <span style={{ fontSize: 12, textAlign: 'center' }}>Drop media here<br/>or click to import</span>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {filtered.map(m => (
              <MediaCard key={m.id} media={m} onRemove={() => dispatch(ACTIONS.REMOVE_MEDIA, m.id)} onDragStart={handleMediaDragStart} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(m => (
              <MediaListItem key={m.id} media={m} onRemove={() => dispatch(ACTIONS.REMOVE_MEDIA, m.id)} onDragStart={handleMediaDragStart} typeIcon={typeIcon} />
            ))}
          </div>
        )}
      </div>

      {/* Import button */}
      <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost" onClick={handleImportClick} style={{ width: '100%', justifyContent: 'center' }}>
          + Import Media
        </button>
      </div>
    </div>
  );
}

function MediaCard({ media, onRemove, onDragStart }) {
  const [hover, setHover] = useState(false);
  const color = media.type === 'video' ? '#7c5cfc' : media.type === 'audio' ? '#22d3a0' : '#f59e0b';

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, media)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 'var(--radius)',
        background: hover ? 'var(--bg-hover)' : 'var(--bg-elevated)',
        border: '1px solid ' + (hover ? 'var(--border-strong)' : 'var(--border)'),
        cursor: 'grab',
        overflow: 'hidden',
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      <div style={{ height: 56, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 24 }}>{media.type === 'video' ? '🎬' : media.type === 'audio' ? '🎵' : '🖼'}</span>
      </div>
      <div style={{ padding: '4px 6px', fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {media.name}
      </div>
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '1px 4px', fontSize: 10 }}
        >✕</button>
      )}
    </div>
  );
}

function MediaListItem({ media, onRemove, onDragStart, typeIcon }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, media)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        background: hover ? 'var(--bg-hover)' : 'transparent',
        cursor: 'grab',
        transition: 'background 0.1s',
      }}
    >
      <span>{typeIcon(media.type)}</span>
      <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.name}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{media.duration?.toFixed(1)}s</span>
      {hover && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕</button>
      )}
    </div>
  );
}
