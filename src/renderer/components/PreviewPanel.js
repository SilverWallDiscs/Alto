import React, { useRef, useEffect, useState } from 'react';
import { useStore, useDispatch, ACTIONS } from '../store/store';

export default function PreviewPanel() {
  const { state } = useStore();
  const dispatch = useDispatch();
  const rafRef = useRef();
  const lastTickRef = useRef();
  const [volume, setVolume] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (state.isPlaying) {
      lastTickRef.current = performance.now();
      const tick = (now) => {
        const dt = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        const next = state.playhead + dt;
        if (next >= state.duration) {
          dispatch(ACTIONS.SET_PLAYHEAD, 0);
          dispatch(ACTIONS.SET_PLAYING, false);
        } else {
          dispatch(ACTIONS.SET_PLAYHEAD, next);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [state.isPlaying]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 30);
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}:${String(frames).padStart(2,'0')}`;
  };

  const togglePlay = () => dispatch(ACTIONS.SET_PLAYING, !state.isPlaying);
  const goToStart = () => { dispatch(ACTIONS.SET_PLAYING, false); dispatch(ACTIONS.SET_PLAYHEAD, 0); };
  const goToEnd = () => { dispatch(ACTIONS.SET_PLAYING, false); dispatch(ACTIONS.SET_PLAYHEAD, state.duration); };
  const stepBack = () => dispatch(ACTIONS.SET_PLAYHEAD, Math.max(0, state.playhead - 1/30));
  const stepForward = () => dispatch(ACTIONS.SET_PLAYHEAD, Math.min(state.duration, state.playhead + 1/30));

  const progress = state.duration > 0 ? state.playhead / state.duration : 0;
  const activeClips = state.tracks.flatMap(t =>
    t.clips.filter(c => state.playhead >= c.startTime && state.playhead < c.startTime + c.duration)
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', minHeight: 0 }}>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: 8 }}>
        <PreviewCanvas activeClips={activeClips} playhead={state.playhead} />
        {showInfo && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.75)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#0f0', lineHeight: 1.8 }}>
            <div>Time: {formatTime(state.playhead)}</div>
            <div>Active: {activeClips.length} clip(s)</div>
            <div>Duration: {formatTime(state.duration)}</div>
            <div>Zoom: {state.zoom}px/s</div>
          </div>
        )}
        <button onClick={() => setShowInfo(v => !v)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: showInfo ? 'var(--accent-bright)' : 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '2px 7px', cursor: 'pointer', fontSize: 11 }}>i</button>
      </div>

      {/* Scrubber */}
      <div style={{ padding: '0 16px 4px' }}>
        <div
          style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, cursor: 'pointer', position: 'relative' }}
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            dispatch(ACTIONS.SET_PLAYHEAD, ((e.clientX - r.left) / r.width) * state.duration);
          }}
        >
          <div style={{ height: '100%', width: (progress*100)+'%', background: 'linear-gradient(90deg,var(--accent-dim),var(--accent-bright))', borderRadius: 3 }} />
          <div style={{ position: 'absolute', top: '50%', left: (progress*100)+'%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px var(--accent-glow)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 12px', gap: 6 }}>
        <CtrlBtn title="Start (Home)" onClick={goToStart}>⏮</CtrlBtn>
        <CtrlBtn title="Step back" onClick={stepBack}>⏪</CtrlBtn>
        <button onClick={togglePlay} title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: state.isPlaying ? 'var(--shadow-accent)' : 'none', transition: 'all 0.15s' }}>
          {state.isPlaying ? '⏸' : '▶'}
        </button>
        <CtrlBtn title="Step forward" onClick={stepForward}>⏩</CtrlBtn>
        <CtrlBtn title="End" onClick={goToEnd}>⏭</CtrlBtn>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          <span style={{ color: 'var(--accent-bright)' }}>{formatTime(state.playhead)}</span>
          <span style={{ color: 'var(--text-muted)' }}> / {formatTime(state.duration)}</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 14 }}>🔊</span>
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(+e.target.value)} style={{ width: 70 }} />
      </div>
    </div>
  );
}

function CtrlBtn({ title, onClick, children }) {
  return <button title={title} onClick={onClick} className="btn-icon" style={{ fontSize: 18, padding: 6 }}>{children}</button>;
}

function PreviewCanvas({ activeClips, playhead }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height);
    if (activeClips.length === 0) {
      const g = ctx.createLinearGradient(0,0,0,height);
      g.addColorStop(0,'#0f0f20'); g.addColorStop(1,'#1a0a2e');
      ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
      ctx.fillStyle = 'rgba(124,92,252,0.15)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Alto', width/2, height/2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '13px sans-serif';
      ctx.fillText('Drag media to the timeline to begin', width/2, height/2 + 10);
      return;
    }
    activeClips.filter(c => c.type !== 'audio').forEach((clip, i) => {
      const hue = (i * 80 + 200) % 360;
      const g = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
      g.addColorStop(0, `hsla(${hue},60%,25%,0.9)`);
      g.addColorStop(1, `hsla(${hue},40%,10%,1)`);
      ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
      ctx.fillStyle = `hsla(${hue},70%,70%,0.8)`; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(clip.name || 'Video', width/2, height/2);
    });
  }, [activeClips, playhead]);
  return <canvas ref={canvasRef} width={854} height={480} style={{ maxWidth:'100%', maxHeight:'100%', aspectRatio:'16/9', background:'#000', borderRadius:'var(--radius)', boxShadow:'0 0 40px rgba(0,0,0,0.8)' }} />;
}
