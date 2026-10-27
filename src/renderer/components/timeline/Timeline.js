import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useStore, useDispatch, ACTIONS } from '../../store/store';

const TRACK_LABEL_W = 160;

export default function Timeline() {
  const { state } = useStore();
  const dispatch = useDispatch();
  const scrollRef = useRef();
  const [dragging, setDragging] = useState(null); // { clipId, offsetSec, origTrackId }

  const pxToSec = (px) => px / state.zoom;
  const secToPx = (s) => s * state.zoom;

  // Ruler click → set playhead
  const handleRulerClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    dispatch(ACTIONS.SET_PLAYHEAD, Math.max(0, pxToSec(x)));
  }, [state.zoom]);

  // Drop media onto track
  const handleTrackDrop = useCallback((e, trackId) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/alto-media');
    if (!raw) return;
    const media = JSON.parse(raw);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0) - TRACK_LABEL_W;
    const startTime = Math.max(0, pxToSec(x));
    dispatch(ACTIONS.ADD_CLIP, {
      trackId,
      clip: {
        name: media.name,
        path: media.path,
        type: media.type,
        startTime,
        duration: media.duration || 5,
        sourceDuration: media.duration || 5,
        trimIn: 0,
        trimOut: 0,
      },
    });
  }, [state.zoom]);

  const totalW = Math.max(secToPx(state.duration) + 200, 800);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Timeline toolbar */}
      <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
        <button className="btn-icon" title="Add Video Track" onClick={() => dispatch(ACTIONS.ADD_TRACK, { type: 'video' })} style={{ fontSize: 12, padding: '3px 8px' }}>+ Video</button>
        <button className="btn-icon" title="Add Audio Track" onClick={() => dispatch(ACTIONS.ADD_TRACK, { type: 'audio' })} style={{ fontSize: 12, padding: '3px 8px' }}>+ Audio</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tracks: {state.tracks.length}</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Track labels column */}
        <div style={{ width: TRACK_LABEL_W, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'hidden', background: 'var(--bg-surface)' }}>
          {/* Ruler placeholder */}
          <div style={{ height: 28, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }} />
          {state.tracks.map(track => (
            <TrackLabel key={track.id} track={track} dispatch={dispatch} />
          ))}
        </div>

        {/* Scrollable tracks area */}
        <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>
          {/* Ruler */}
          <Ruler
            totalW={totalW}
            zoom={state.zoom}
            duration={state.duration}
            playhead={state.playhead}
            onClick={handleRulerClick}
          />

          {/* Tracks */}
          <div style={{ position: 'relative', width: totalW }}>
            {state.tracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                zoom={state.zoom}
                selectedClipIds={state.selectedClipIds}
                playhead={state.playhead}
                onDrop={handleTrackDrop}
                dispatch={dispatch}
              />
            ))}
            {/* Playhead line */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: secToPx(state.playhead),
              width: 2, background: 'var(--accent)',
              pointerEvents: 'none', zIndex: 10,
              boxShadow: '0 0 6px var(--accent-glow)',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Ruler({ totalW, zoom, duration, playhead, onClick }) {
  const stepSec = zoom < 50 ? 10 : zoom < 100 ? 5 : zoom < 200 ? 2 : 1;
  const ticks = [];
  for (let s = 0; s <= duration + stepSec; s += stepSec) {
    ticks.push(s);
  }
  const fmt = (s) => {
    const m = Math.floor(s/60), sec = Math.floor(s%60);
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  return (
    <div
      onClick={onClick}
      style={{ height: 28, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', position: 'relative', cursor: 'crosshair', userSelect: 'none', width: totalW, flexShrink: 0 }}
    >
      {ticks.map(s => (
        <div key={s} style={{ position: 'absolute', left: s * zoom, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ width: 1, height: s % (stepSec*5) === 0 ? 12 : 6, background: 'var(--border-strong)', marginTop: 2 }} />
          {s % (stepSec*5) === 0 && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 2, marginTop: 1, whiteSpace: 'nowrap' }}>{fmt(s)}</span>
          )}
        </div>
      ))}
      {/* Playhead indicator on ruler */}
      <div style={{ position: 'absolute', top: 0, left: playhead * zoom - 6, width: 12, height: 12, background: 'var(--accent)', clipPath: 'polygon(50% 100%, 0 0, 100% 0)', zIndex: 5 }} />
    </div>
  );
}

function TrackLabel({ track, dispatch }) {
  return (
    <div style={{
      height: track.height || 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      gap: 4,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
    }}>
      <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: track.muted ? 'var(--text-muted)' : 'var(--text-primary)' }}>{track.name}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        <TrackBtn
          title="Mute (M)"
          active={track.muted}
          activeColor="var(--warning)"
          onClick={() => dispatch(ACTIONS.SET_TRACK_MUTE, { trackId: track.id, value: !track.muted })}
        >M</TrackBtn>
        <TrackBtn
          title="Solo (S)"
          active={track.solo}
          activeColor="var(--success)"
          onClick={() => dispatch(ACTIONS.SET_TRACK_SOLO, { trackId: track.id, value: !track.solo })}
        >S</TrackBtn>
        <TrackBtn
          title="Lock (L)"
          active={track.locked}
          activeColor="var(--accent)"
          onClick={() => dispatch(ACTIONS.SET_TRACK_LOCK, { trackId: track.id, value: !track.locked })}
        >🔒</TrackBtn>
      </div>
    </div>
  );
}

function TrackBtn({ title, active, activeColor, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 18, height: 18, padding: 0, border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 9, fontWeight: 700,
        background: active ? (activeColor + '33') : 'var(--bg-elevated)',
        color: active ? activeColor : 'var(--text-muted)',
        transition: 'all 0.1s',
      }}
    >{children}</button>
  );
}

function TrackRow({ track, zoom, selectedClipIds, playhead, onDrop, dispatch }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isAudio = track.type === 'audio';
  const trackColor = isAudio ? 'var(--success)' : track.type === 'title' ? 'var(--warning)' : 'var(--accent)';

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e, track.id); }}
      style={{
        height: track.height || 48,
        borderBottom: '1px solid var(--border)',
        background: isDragOver ? 'rgba(124,92,252,0.05)' : (track.locked ? 'rgba(255,255,255,0.01)' : 'transparent'),
        position: 'relative',
        outline: isDragOver ? '1px dashed var(--accent)' : 'none',
      }}
    >
      {/* Lane lines */}
      {[0.33, 0.66].map(f => (
        <div key={f} style={{ position: 'absolute', top: `${f*100}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      ))}
      {/* Clips */}
      {track.clips.map(clip => (
        <Clip
          key={clip.id}
          clip={clip}
          zoom={zoom}
          trackHeight={track.height || 48}
          trackColor={trackColor}
          selected={selectedClipIds.includes(clip.id)}
          locked={track.locked}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}

function Clip({ clip, zoom, trackHeight, trackColor, selected, locked, dispatch }) {
  const [hover, setHover] = useState(false);
  const left = clip.startTime * zoom;
  const width = Math.max(clip.duration * zoom, 4);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!locked) dispatch(ACTIONS.SELECT_CLIP, clip.id);
  };

  const handleDblClick = (e) => {
    e.stopPropagation();
    dispatch(ACTIONS.SPLIT_CLIP, { clipId: clip.id, splitTime: clip.startTime + clip.duration / 2 });
  };

  const colorMap = { video: 'var(--accent)', audio: 'var(--success)', image: 'var(--warning)', title: '#f472b6' };
  const base = colorMap[clip.type] || 'var(--accent)';

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={clip.name}
      style={{
        position: 'absolute',
        left,
        top: 3,
        width,
        height: trackHeight - 6,
        borderRadius: 'var(--radius-sm)',
        background: selected ? `${base}55` : hover ? `${base}44` : `${base}33`,
        border: `1.5px solid ${selected ? base : hover ? base + 'aa' : base + '66'}`,
        overflow: 'hidden',
        cursor: locked ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        transition: 'border-color 0.1s, background 0.1s',
        boxShadow: selected ? `0 0 0 1px ${base}55` : 'none',
      }}
    >
      <div style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
        <span style={{ fontSize: 10, color: base, flexShrink: 0 }}>
          {clip.type === 'video' ? '🎬' : clip.type === 'audio' ? '🎵' : clip.type === 'image' ? '🖼' : 'T'}
        </span>
        {width > 50 && (
          <span style={{ fontSize: 10, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clip.name}
          </span>
        )}
      </div>
      {/* Audio waveform (decorative) */}
      {clip.type === 'audio' && width > 40 && (
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} width={width} height={trackHeight - 6}>
          {Array.from({ length: Math.floor(width / 3) }, (_, i) => {
            const h = 4 + Math.abs(Math.sin(i * 0.8 + clip.id.charCodeAt(0))) * (trackHeight/2 - 6);
            return <rect key={i} x={i*3} y={(trackHeight/2-h/2-3)} width={2} height={h} fill={base} />;
          })}
        </svg>
      )}
      {/* Transition indicator */}
      {clip.transitionIn && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min(30, width/3), background: 'linear-gradient(90deg,rgba(255,255,255,0.15),transparent)', pointerEvents: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }} />
      )}
      {/* Effect badge */}
      {clip.effects?.length > 0 && (
        <div style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 8, background: 'var(--accent)', color: '#fff', padding: '1px 3px', borderRadius: 2 }}>FX{clip.effects.length}</div>
      )}
    </div>
  );
}
