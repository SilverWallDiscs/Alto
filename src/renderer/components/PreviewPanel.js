import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore, useDispatch, ACTIONS } from '../store/store';

// SVG icons — no emojis
const Icon = {
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
    </svg>
  ),
  Pause: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="4" height="12" rx="1"/>
      <rect x="9" y="2" width="4" height="12" rx="1"/>
    </svg>
  ),
  SkipBack: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="2" width="2" height="12" rx="1"/>
      <path d="M13 2.5L5 8l8 5.5V2.5z"/>
    </svg>
  ),
  SkipFwd: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="12" y="2" width="2" height="12" rx="1"/>
      <path d="M3 2.5L11 8 3 13.5V2.5z"/>
    </svg>
  ),
  StepBack: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 2.5L3 8l8 5.5V2.5z"/>
      <rect x="2" y="3" width="1.5" height="10" rx="0.5"/>
    </svg>
  ),
  StepFwd: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 2.5L13 8 5 13.5V2.5z"/>
      <rect x="12.5" y="3" width="1.5" height="10" rx="0.5"/>
    </svg>
  ),
  Volume: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 6h3l5-4v12l-5-4H2V6zm11.3 1.7a4 4 0 010 4.6"/>
    </svg>
  ),
};

function formatTC(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const fr = Math.floor((s % 1) * 30);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}:${String(fr).padStart(2,'0')}`;
}

export default function PreviewPanel() {
  const { state } = useStore();
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);
  const isSyncingRef = useRef(false);
  const [volume, setVolume] = useState(1);

  // Find the active video clip at the current playhead
  const activeVideoClip = state.tracks
    .filter(t => t.type === 'video' || t.type === 'image')
    .flatMap(t => t.clips)
    .find(c => c.type === 'video' && state.playhead >= c.startTime && state.playhead < c.startTime + c.duration);

  const videoSrc = activeVideoClip
    ? (activeVideoClip.path.startsWith('file://') ? activeVideoClip.path : `file:///${activeVideoClip.path.replace(/\\/g, '/')}`)
    : null;

  // Sync video element src
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!videoSrc) {
      v.src = '';
      return;
    }
    if (v.currentSrc !== videoSrc) {
      v.src = videoSrc;
      v.load();
    }
  }, [videoSrc]);

  // Sync video element time when store playhead changes (not during playback)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc || isSyncingRef.current) return;
    const clipTime = state.playhead - (activeVideoClip?.startTime || 0) + (activeVideoClip?.trimIn || 0);
    const target = Math.max(0, clipTime);
    if (Math.abs(v.currentTime - target) > 0.1) {
      v.currentTime = target;
    }
  }, [state.playhead, videoSrc]);

  // Volume
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // Playback loop
  useEffect(() => {
    if (state.isPlaying) {
      const v = videoRef.current;
      if (v && videoSrc && v.paused) v.play().catch(() => {});

      lastTickRef.current = performance.now();
      const tick = (now) => {
        const dt = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;

        // If video is playing, read its actual time to stay in sync
        if (v && videoSrc && !v.paused && activeVideoClip) {
          isSyncingRef.current = true;
          const realTime = activeVideoClip.startTime + v.currentTime - (activeVideoClip.trimIn || 0);
          dispatch(ACTIONS.SET_PLAYHEAD, Math.min(realTime, state.duration));
          isSyncingRef.current = false;
        } else {
          // No video — advance timeline clock
          const next = state.playhead + dt;
          if (next >= state.duration) {
            dispatch(ACTIONS.SET_PLAYHEAD, 0);
            dispatch(ACTIONS.SET_PLAYING, false);
          } else {
            dispatch(ACTIONS.SET_PLAYHEAD, next);
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      if (v && !v.paused) v.pause();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [state.isPlaying]);

  const togglePlay = useCallback(() => dispatch(ACTIONS.SET_PLAYING, !state.isPlaying), [state.isPlaying]);
  const goToStart = useCallback(() => { dispatch(ACTIONS.SET_PLAYING, false); dispatch(ACTIONS.SET_PLAYHEAD, 0); }, []);
  const goToEnd = useCallback(() => { dispatch(ACTIONS.SET_PLAYING, false); dispatch(ACTIONS.SET_PLAYHEAD, state.duration); }, [state.duration]);
  const stepBack = useCallback(() => dispatch(ACTIONS.SET_PLAYHEAD, Math.max(0, state.playhead - 1/30)), [state.playhead]);
  const stepFwd = useCallback(() => dispatch(ACTIONS.SET_PLAYHEAD, Math.min(state.duration, state.playhead + 1/30)), [state.playhead, state.duration]);

  const progress = state.duration > 0 ? (state.playhead / state.duration) : 0;

  const handleScrub = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * state.duration;
    dispatch(ACTIONS.SET_PLAYING, false);
    dispatch(ACTIONS.SET_PLAYHEAD, t);
  }, [state.duration]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111115', minHeight: 0 }}>
      {/* Viewer */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, background: '#000', overflow: 'hidden' }}>
        {videoSrc ? (
          <video
            ref={videoRef}
            style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '16/9', display: 'block' }}
            preload="auto"
            onEnded={() => { dispatch(ACTIONS.SET_PLAYING, false); dispatch(ACTIONS.SET_PLAYHEAD, 0); }}
          />
        ) : (
          <div ref={videoRef} style={{ display: 'none' }} />
        )}

        {/* Empty state */}
        {!videoSrc && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', userSelect: 'none' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>No clip at playhead</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>Drag media onto the timeline to begin</div>
          </div>
        )}

        {/* Timecode overlay */}
        <div style={{ position: 'absolute', bottom: 10, right: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, pointerEvents: 'none' }}>
          {formatTC(state.playhead)}
        </div>
      </div>

      {/* Scrub bar */}
      <div style={{ padding: '6px 12px 2px' }}>
        <div
          onMouseDown={handleScrub}
          style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer', position: 'relative', overflow: 'visible' }}
        >
          <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', borderRadius: 2, pointerEvents: 'none' }} />
          <div style={{
            position: 'absolute', top: '50%', left: `${progress * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: '#fff', boxShadow: '0 0 6px rgba(124,92,252,0.8)',
            pointerEvents: 'none'
          }} />
        </div>
      </div>

      {/* Transport controls */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 10px 8px', gap: 2 }}>
        <CtrlBtn title="Go to start (Home)" onClick={goToStart}><Icon.SkipBack /></CtrlBtn>
        <CtrlBtn title="Step back one frame" onClick={stepBack}><Icon.StepBack /></CtrlBtn>

        <button
          onClick={togglePlay}
          title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: state.isPlaying ? 'rgba(124,92,252,0.15)' : 'var(--accent)',
            border: state.isPlaying ? '1.5px solid var(--accent)' : 'none',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s', margin: '0 2px',
          }}
        >
          {state.isPlaying ? <Icon.Pause /> : <Icon.Play />}
        </button>

        <CtrlBtn title="Step forward one frame" onClick={stepFwd}><Icon.StepFwd /></CtrlBtn>
        <CtrlBtn title="Go to end" onClick={goToEnd}><Icon.SkipFwd /></CtrlBtn>

        <div style={{ flex: 1 }} />

        {/* Timecode */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-primary)', letterSpacing: 1 }}>{formatTC(state.playhead)}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>{formatTC(state.duration)}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Icon.Volume />
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(+e.target.value)}
            style={{ width: 64 }}
          />
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28, height: 28, background: 'transparent', border: 'none',
        color: 'var(--text-secondary)', borderRadius: 4, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {children}
    </button>
  );
}
