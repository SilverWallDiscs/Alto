import React, { useState } from 'react';
import { useStore, useDispatch, ACTIONS } from '../../store/store';

const VIDEO_EFFECTS = [
  { id: 'brightness', name: 'Brightness', icon: '☀', category: 'Color', params: { value: 0 } },
  { id: 'contrast', name: 'Contrast', icon: '◑', category: 'Color', params: { value: 0 } },
  { id: 'saturation', name: 'Saturation', icon: '🎨', category: 'Color', params: { value: 0 } },
  { id: 'hue', name: 'Hue Rotate', icon: '🌈', category: 'Color', params: { degrees: 0 } },
  { id: 'blur', name: 'Blur', icon: '💧', category: 'Blur', params: { radius: 5 } },
  { id: 'sharpen', name: 'Sharpen', icon: '💎', category: 'Blur', params: { amount: 1 } },
  { id: 'vignette', name: 'Vignette', icon: '🔲', category: 'Stylize', params: { amount: 0.5 } },
  { id: 'grayscale', name: 'Grayscale', icon: '⬜', category: 'Color', params: { amount: 1 } },
  { id: 'sepia', name: 'Sepia', icon: '📜', category: 'Color', params: { amount: 1 } },
  { id: 'invert', name: 'Invert', icon: '🔄', category: 'Color', params: {} },
  { id: 'noise', name: 'Film Grain', icon: '🌫', category: 'Stylize', params: { amount: 0.3 } },
  { id: 'glow', name: 'Glow', icon: '✨', category: 'Stylize', params: { radius: 10, strength: 0.5 } },
  { id: 'lut', name: 'Color Grade', icon: '🎞', category: 'Color', params: { preset: 'none' } },
  { id: 'crop', name: 'Crop', icon: '✂', category: 'Transform', params: { top: 0, right: 0, bottom: 0, left: 0 } },
  { id: 'scale', name: 'Scale/Zoom', icon: '🔍', category: 'Transform', params: { x: 1, y: 1 } },
  { id: 'rotate', name: 'Rotate', icon: '🔃', category: 'Transform', params: { degrees: 0 } },
  { id: 'flip', name: 'Flip', icon: '↔', category: 'Transform', params: { horizontal: false, vertical: false } },
  { id: 'chroma', name: 'Chroma Key', icon: '🟩', category: 'Keying', params: { color: '#00ff00', threshold: 0.3 } },
  { id: 'luma', name: 'Luma Key', icon: '⬛', category: 'Keying', params: { threshold: 0.5 } },
  { id: 'speed', name: 'Speed', icon: '⚡', category: 'Time', params: { rate: 1 } },
  { id: 'reverse', name: 'Reverse', icon: '⏪', category: 'Time', params: {} },
  { id: 'freeze', name: 'Freeze Frame', icon: '❄', category: 'Time', params: { at: 0 } },
];

const AUDIO_EFFECTS = [
  { id: 'volume', name: 'Volume', icon: '🔊', params: { level: 1 } },
  { id: 'pan', name: 'Pan', icon: '↔', params: { value: 0 } },
  { id: 'equalizer', name: 'Equalizer', icon: '🎛', params: { bass: 0, mid: 0, treble: 0 } },
  { id: 'compressor', name: 'Compressor', icon: '📉', params: { threshold: -20, ratio: 4 } },
  { id: 'reverb', name: 'Reverb', icon: '🏛', params: { room: 0.5, wet: 0.3 } },
  { id: 'delay', name: 'Delay', icon: '📡', params: { time: 0.25, feedback: 0.3 } },
  { id: 'chorus', name: 'Chorus', icon: '🎵', params: { depth: 0.5, rate: 1.5 } },
  { id: 'pitch', name: 'Pitch Shift', icon: '🎼', params: { semitones: 0 } },
  { id: 'noise-red', name: 'Noise Reduction', icon: '🔇', params: { strength: 0.5 } },
  { id: 'fade', name: 'Fade In/Out', icon: '📈', params: { fadeIn: 0.5, fadeOut: 0.5 } },
];

const TRANSITIONS = [
  { id: 'cut', name: 'Cut', icon: '✂', duration: 0 },
  { id: 'dissolve', name: 'Dissolve', icon: '💧', duration: 0.5 },
  { id: 'fade-black', name: 'Fade to Black', icon: '⬛', duration: 0.7 },
  { id: 'fade-white', name: 'Fade to White', icon: '⬜', duration: 0.7 },
  { id: 'wipe-left', name: 'Wipe Left', icon: '◀', duration: 0.5 },
  { id: 'wipe-right', name: 'Wipe Right', icon: '▶', duration: 0.5 },
  { id: 'wipe-up', name: 'Wipe Up', icon: '▲', duration: 0.5 },
  { id: 'wipe-down', name: 'Wipe Down', icon: '▼', duration: 0.5 },
  { id: 'slide-left', name: 'Slide Left', icon: '⬅', duration: 0.5 },
  { id: 'slide-right', name: 'Slide Right', icon: '➡', duration: 0.5 },
  { id: 'zoom-in', name: 'Zoom In', icon: '🔍', duration: 0.5 },
  { id: 'zoom-out', name: 'Zoom Out', icon: '🔎', duration: 0.5 },
  { id: 'spin', name: 'Spin', icon: '🌀', duration: 0.6 },
  { id: 'flip-h', name: 'Flip Horizontal', icon: '↔', duration: 0.5 },
  { id: 'flip-v', name: 'Flip Vertical', icon: '↕', duration: 0.5 },
  { id: 'push-left', name: 'Push Left', icon: '⇐', duration: 0.5 },
  { id: 'push-right', name: 'Push Right', icon: '⇒', duration: 0.5 },
  { id: 'iris', name: 'Iris', icon: '👁', duration: 0.6 },
  { id: 'clock', name: 'Clock Wipe', icon: '🕐', duration: 0.7 },
  { id: 'glitch', name: 'Glitch', icon: '📺', duration: 0.4 },
  { id: 'film-burn', name: 'Film Burn', icon: '🔥', duration: 0.8 },
  { id: 'cross-zoom', name: 'Cross Zoom', icon: '✚', duration: 0.6 },
  { id: 'morph', name: 'Morph', icon: '🌊', duration: 0.7 },
  { id: 'light-leak', name: 'Light Leak', icon: '💡', duration: 0.6 },
];

export default function EffectsPanel({ mode = 'effects' }) {
  const { state } = useStore();
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const selectedClip = state.selectedClipIds[0]
    ? state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipIds[0])
    : null;

  const isAudioMode = mode === 'audio';
  const isTransitionMode = mode === 'transitions';

  const items = isTransitionMode ? TRANSITIONS : isAudioMode ? AUDIO_EFFECTS : VIDEO_EFFECTS;
  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || i.category === category;
    return matchSearch && matchCat;
  });

  const handleApply = (item) => {
    if (!selectedClip) return;
    if (isTransitionMode) {
      dispatch(ACTIONS.ADD_TRANSITION, { clipId: selectedClip.id, transition: { type: item.id, name: item.name, duration: item.duration } });
    } else {
      dispatch(ACTIONS.ADD_EFFECT, { clipId: selectedClip.id, effect: { type: item.id, name: item.name, params: { ...item.params } } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-section">
        <input placeholder={`Search ${mode}…`} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
        {!isTransitionMode && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{ padding: '2px 7px', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (category === c ? 'var(--accent)' : 'var(--border)'), background: category === c ? 'var(--accent-glow)' : 'transparent', color: category === c ? 'var(--accent-bright)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font)' }}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {!selectedClip && (
        <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', background: 'rgba(124,92,252,0.05)', margin: 8, borderRadius: 'var(--radius)', border: '1px solid var(--border-accent)' }}>
          Select a clip on the timeline to apply {mode}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isTransitionMode ? 'repeat(2, 1fr)' : '1fr', gap: 4 }}>
          {filtered.map(item => (
            <EffectCard
              key={item.id}
              item={item}
              canApply={!!selectedClip}
              onApply={() => handleApply(item)}
              compact={isTransitionMode}
            />
          ))}
        </div>
      </div>

      {/* Applied effects on selected clip */}
      {selectedClip && !isTransitionMode && (selectedClip.effects?.length > 0) && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 8 }}>
          <div className="panel-section-title">Applied Effects</div>
          {selectedClip.effects.map(e => (
            <AppliedEffect key={e.id} effect={e} clipId={selectedClip.id} dispatch={dispatch} />
          ))}
        </div>
      )}
    </div>
  );
}

function EffectCard({ item, canApply, onApply, compact }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '8px' : '8px 10px',
        borderRadius: 'var(--radius-sm)',
        background: hover ? 'var(--bg-hover)' : 'var(--bg-elevated)',
        border: '1px solid ' + (hover ? 'var(--border-strong)' : 'var(--border)'),
        cursor: canApply ? 'pointer' : 'default',
        opacity: canApply ? 1 : 0.5,
        transition: 'all 0.12s',
        flexDirection: compact ? 'column' : 'row',
        textAlign: compact ? 'center' : 'left',
      }}
      onClick={canApply ? onApply : undefined}
    >
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.3, color: 'var(--accent-bright)', flexShrink: 0, minWidth: compact ? 22 : 18, textAlign: 'center' }}>{item.name.slice(0,2).toUpperCase()}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
        {item.category && !compact && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.category}</div>}
        {item.duration !== undefined && compact && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.duration}s</div>}
      </div>
      {hover && canApply && !compact && (
        <span style={{ fontSize: 10, color: 'var(--accent-bright)', flexShrink: 0 }}>Apply →</span>
      )}
    </div>
  );
}

function AppliedEffect({ effect, clipId, dispatch }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 4, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <span style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)' }}>{effect.name}</span>
        <button onClick={e => { e.stopPropagation(); dispatch(ACTIONS.REMOVE_EFFECT, { clipId, effectId: effect.id }); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>✕</button>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && effect.params && Object.keys(effect.params).length > 0 && (
        <div style={{ padding: '0 8px 8px' }}>
          {Object.entries(effect.params).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 60, textTransform: 'capitalize' }}>{key}</label>
              {typeof val === 'boolean' ? (
                <input type="checkbox" checked={val} onChange={e => dispatch(ACTIONS.UPDATE_EFFECT, { clipId, effectId: effect.id, params: { [key]: e.target.checked } })} />
              ) : typeof val === 'number' ? (
                <>
                  <input type="range" min={key === 'degrees' || key === 'semitones' ? -180 : key === 'rate' ? 0.1 : 0} max={key === 'degrees' || key === 'semitones' ? 180 : key === 'rate' ? 4 : 2} step={0.01} value={val} onChange={e => dispatch(ACTIONS.UPDATE_EFFECT, { clipId, effectId: effect.id, params: { [key]: +e.target.value } })} style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>{val.toFixed(2)}</span>
                </>
              ) : (
                <input value={val} onChange={e => dispatch(ACTIONS.UPDATE_EFFECT, { clipId, effectId: effect.id, params: { [key]: e.target.value } })} style={{ flex: 1 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
