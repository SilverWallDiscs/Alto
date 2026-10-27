import React, { useState } from 'react';
import { useStore } from '../store/store';

const PRESETS = [
  { id: 'youtube-1080', name: 'YouTube 1080p', icon: '▶', codec: 'h264', resolution: '1920x1080', fps: 30, bitrate: '8M', audio: 'aac' },
  { id: 'youtube-4k', name: 'YouTube 4K', icon: '▶', codec: 'h264', resolution: '3840x2160', fps: 30, bitrate: '35M', audio: 'aac' },
  { id: 'instagram', name: 'Instagram Square', icon: '📷', codec: 'h264', resolution: '1080x1080', fps: 30, bitrate: '6M', audio: 'aac' },
  { id: 'instagram-reel', name: 'Instagram Reel', icon: '📱', codec: 'h264', resolution: '1080x1920', fps: 30, bitrate: '6M', audio: 'aac' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', codec: 'h264', resolution: '1080x1920', fps: 30, bitrate: '6M', audio: 'aac' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', codec: 'h264', resolution: '1280x720', fps: 30, bitrate: '5M', audio: 'aac' },
  { id: 'custom', name: 'Custom', icon: '⚙', codec: 'h264', resolution: '1920x1080', fps: 30, bitrate: '8M', audio: 'aac' },
];

const CODECS = ['h264', 'h265', 'vp9', 'av1', 'prores'];
const RESOLUTIONS = ['3840x2160','2560x1440','1920x1080','1280x720','854x480','640x360'];
const FORMATS = ['mp4','mov','webm','mkv','avi'];

export default function ExportModal({ onClose }) {
  const { state } = useStore();
  const [preset, setPreset] = useState('youtube-1080');
  const [custom, setCustom] = useState({ codec:'h264', resolution:'1920x1080', fps:30, bitrate:'8M', audio:'aac', format:'mp4' });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [outputPath, setOutputPath] = useState('');

  const activePreset = PRESETS.find(p => p.id === preset);

  const handleExport = async () => {
    if (!window.alto) return;
    const result = await window.alto.saveFile({
      defaultPath: `${state.projectName || 'alto-export'}.mp4`,
      filters: [{ name: 'Video', extensions: ['mp4','mov','mkv','webm'] }],
    });
    if (result.canceled) return;
    setOutputPath(result.filePath);
    setExporting(true);
    // Simulate export progress (real FFmpeg export would happen here via IPC)
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 100) { p = 100; clearInterval(interval); setDone(true); }
      setProgress(Math.min(100, p));
    }, 150);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !exporting && onClose()}>
      <div className="modal" style={{ minWidth: 520, maxHeight: '85vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2>Export Video</h2>
          {!exporting && <button className="btn-icon" onClick={onClose} style={{ fontSize: 18 }}>✕</button>}
        </div>

        <div className="modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Export Complete!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{outputPath}</div>
            </div>
          ) : exporting ? (
            <div style={{ padding: '24px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Exporting…</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{Math.round(progress)}%</div>
              </div>
              <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-dim), var(--accent-bright))', borderRadius: 4, transition: 'width 0.1s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>Estimated time remaining: {Math.round((100 - progress) / 15)}s</div>
            </div>
          ) : (
            <>
              {/* Presets */}
              <div style={{ marginBottom: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>Preset</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {PRESETS.map(p => (
                    <button key={p.id} onClick={() => setPreset(p.id)} style={{ padding: '8px 6px', borderRadius: 'var(--radius-sm)', border: '1.5px solid ' + (preset === p.id ? 'var(--accent)' : 'var(--border)'), background: preset === p.id ? 'var(--accent-glow)' : 'var(--bg-elevated)', color: preset === p.id ? 'var(--accent-bright)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.12s' }}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom settings */}
              {preset === 'custom' ? (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
                  <div className="label" style={{ marginBottom: 8 }}>Custom Settings</div>
                  {[
                    ['Format', 'format', FORMATS],
                    ['Codec', 'codec', CODECS],
                    ['Resolution', 'resolution', RESOLUTIONS],
                  ].map(([label, key, options]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>{label}</span>
                      <select value={custom[key]} onChange={e => setCustom(v => ({ ...v, [key]: e.target.value }))} style={{ flex: 1 }}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>FPS</span>
                    <input type="number" min={1} max={120} value={custom.fps} onChange={e => setCustom(v => ({ ...v, fps: +e.target.value }))} style={{ width: 70 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>Bitrate</span>
                    <input value={custom.bitrate} onChange={e => setCustom(v => ({ ...v, bitrate: e.target.value }))} style={{ width: 70 }} placeholder="8M" />
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
                  <div className="label" style={{ marginBottom: 8 }}>Settings</div>
                  {activePreset && Object.entries({ Resolution: activePreset.resolution, FPS: activePreset.fps, Codec: activePreset.codec, Bitrate: activePreset.bitrate, Audio: activePreset.audio }).map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {done ? (
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          ) : exporting ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Exporting, please wait…</span>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleExport}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
