import React, { useState } from 'react';
import { useStore, useDispatch, ACTIONS } from '../store/store';

export default function InspectorPanel() {
  const { state } = useStore();
  const dispatch = useDispatch();

  const selectedClip = state.selectedClipIds[0]
    ? state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipIds[0])
    : null;

  if (!selectedClip) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Inspector</div>
        <ProjectInfo state={state} dispatch={dispatch} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Select a clip to inspect</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>Clip Inspector</div>
      <ClipInspector clip={selectedClip} dispatch={dispatch} state={state} />
    </div>
  );
}

function ProjectInfo({ state, dispatch }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
      <div className="panel-section-title">Project</div>
      <PropRow label="Name">
        <input
          value={state.projectName}
          onChange={e => dispatch(ACTIONS.SET_PROJECT_NAME, e.target.value)}
          style={{ width: '100%' }}
        />
      </PropRow>
      <PropRow label="Duration">{formatTime(state.duration)}</PropRow>
      <PropRow label="Tracks">{state.tracks.length}</PropRow>
      <PropRow label="Clips">{state.tracks.reduce((s, t) => s + t.clips.length, 0)}</PropRow>
      <PropRow label="Zoom">{state.zoom}px/s</PropRow>
    </div>
  );
}

function ClipInspector({ clip, dispatch, state }) {
  const track = state.tracks.find(t => t.clips.some(c => c.id === clip.id));
  const [tab, setTab] = useState('properties');

  return (
    <>
      {/* Clip header */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 10, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: clip.type === 'video' ? 'rgba(124,92,252,0.2)' : clip.type === 'audio' ? 'rgba(34,211,160,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: clip.type === 'video' ? 'var(--accent-bright)' : clip.type === 'audio' ? 'var(--success)' : 'var(--warning)', letterSpacing: 0.5 }}>
              {clip.type === 'video' ? 'VID' : clip.type === 'audio' ? 'AUD' : 'IMG'}
            </span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{clip.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{clip.type} • {track?.name}</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
          {['properties','effects','color'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '3px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: tab === t ? 'var(--bg-elevated)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font)', fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'properties' && <ClipProperties clip={clip} dispatch={dispatch} />}
      {tab === 'effects' && <ClipEffects clip={clip} dispatch={dispatch} />}
      {tab === 'color' && <ClipColor clip={clip} dispatch={dispatch} />}
    </>
  );
}

function ClipProperties({ clip, dispatch }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
      <PropRow label="Start">{formatTime(clip.startTime || 0)}</PropRow>
      <PropRow label="Duration">{formatTime(clip.duration || 0)}</PropRow>
      <PropRow label="Trim In">
        <input type="number" min={0} max={clip.sourceDuration || clip.duration} step={0.01} value={(clip.trimIn || 0).toFixed(2)} onChange={e => dispatch(ACTIONS.TRIM_CLIP, { clipId: clip.id, trimIn: +e.target.value })} style={{ width: 70 }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>s</span>
      </PropRow>
      <PropRow label="Trim Out">
        <input type="number" min={0} max={clip.sourceDuration || clip.duration} step={0.01} value={(clip.trimOut || 0).toFixed(2)} onChange={e => dispatch(ACTIONS.TRIM_CLIP, { clipId: clip.id, trimOut: +e.target.value })} style={{ width: 70 }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>s</span>
      </PropRow>
      <PropRow label="Path"><span style={{ fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{clip.path || '—'}</span></PropRow>
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => dispatch(ACTIONS.SPLIT_CLIP, { clipId: clip.id, splitTime: clip.startTime + clip.duration / 2 })}>Split</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => dispatch(ACTIONS.REMOVE_CLIP, [clip.id])}>Delete</button>
      </div>
    </div>
  );
}

function ClipEffects({ clip, dispatch }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
      <div className="panel-section-title" style={{ marginBottom: 8 }}>Active Effects ({clip.effects?.length || 0})</div>
      {(!clip.effects || clip.effects.length === 0) ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No effects. Add from the Effects panel.</div>
      ) : (
        clip.effects.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, flex: 1 }}>{e.name}</span>
            <button onClick={() => dispatch(ACTIONS.REMOVE_EFFECT, { clipId: clip.id, effectId: e.id })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        ))
      )}
      {clip.transitionIn && (
        <div style={{ marginTop: 8 }}>
          <div className="panel-section-title">Transition In</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0' }}>
            <span style={{ flex: 1, fontSize: 11 }}>{clip.transitionIn.name} ({clip.transitionIn.duration}s)</span>
            <button onClick={() => dispatch(ACTIONS.REMOVE_TRANSITION, { clipId: clip.id })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipColor({ clip, dispatch }) {
  const colorEffect = clip.effects?.find(e => ['brightness','contrast','saturation','hue','grayscale','sepia','lut'].includes(e.type));

  const adjust = (type, name, key, min, max, step, val) => {
    const existing = clip.effects?.find(e => e.type === type);
    if (existing) {
      dispatch(ACTIONS.UPDATE_EFFECT, { clipId: clip.id, effectId: existing.id, params: { [key]: val } });
    } else {
      dispatch(ACTIONS.ADD_EFFECT, { clipId: clip.id, effect: { type, name, params: { [key]: val } } });
    }
  };

  const getVal = (type, key, def) => clip.effects?.find(e => e.type === type)?.params?.[key] ?? def;

  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
      <div className="panel-section-title" style={{ marginBottom: 10 }}>Color Correction</div>
      {[
        { type: 'brightness', name: 'Brightness', key: 'value', min: -1, max: 1, step: 0.01, def: 0 },
        { type: 'contrast', name: 'Contrast', key: 'value', min: -1, max: 1, step: 0.01, def: 0 },
        { type: 'saturation', name: 'Saturation', key: 'value', min: -1, max: 1, step: 0.01, def: 0 },
        { type: 'hue', name: 'Hue Rotate', key: 'degrees', min: -180, max: 180, step: 1, def: 0 },
      ].map(({ type, name, key, min, max, step, def }) => {
        const val = getVal(type, key, def);
        return (
          <div key={type} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{val.toFixed(2)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val} onChange={e => adjust(type, name, key, min, max, step, +e.target.value)} style={{ width: '100%' }} />
          </div>
        );
      })}
      <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }} onClick={() => {
        ['brightness','contrast','saturation','hue'].forEach(type => {
          const e = clip.effects?.find(ef => ef.type === type);
          if (e) dispatch(ACTIONS.REMOVE_EFFECT, { clipId: clip.id, effectId: e.id });
        });
      }}>Reset Color</button>
    </div>
  );
}

function PropRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 60 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, display: 'flex', alignItems: 'center' }}>{children}</span>
    </div>
  );
}

function formatTime(s) {
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
