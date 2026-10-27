import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ACTIONS = {
  // Project
  NEW_PROJECT: 'NEW_PROJECT',
  LOAD_PROJECT: 'LOAD_PROJECT',
  SET_PROJECT_NAME: 'SET_PROJECT_NAME',
  // Media
  ADD_MEDIA: 'ADD_MEDIA',
  REMOVE_MEDIA: 'REMOVE_MEDIA',
  // Timeline
  ADD_CLIP: 'ADD_CLIP',
  REMOVE_CLIP: 'REMOVE_CLIP',
  MOVE_CLIP: 'MOVE_CLIP',
  TRIM_CLIP: 'TRIM_CLIP',
  SPLIT_CLIP: 'SPLIT_CLIP',
  SELECT_CLIP: 'SELECT_CLIP',
  SELECT_CLIPS: 'SELECT_CLIPS',
  ADD_TRACK: 'ADD_TRACK',
  REMOVE_TRACK: 'REMOVE_TRACK',
  REORDER_TRACKS: 'REORDER_TRACKS',
  SET_TRACK_MUTE: 'SET_TRACK_MUTE',
  SET_TRACK_LOCK: 'SET_TRACK_LOCK',
  SET_TRACK_SOLO: 'SET_TRACK_SOLO',
  SET_TRACK_VOLUME: 'SET_TRACK_VOLUME',
  // Playback
  SET_PLAYHEAD: 'SET_PLAYHEAD',
  SET_PLAYING: 'SET_PLAYING',
  SET_ZOOM: 'SET_ZOOM',
  SET_DURATION: 'SET_DURATION',
  // Effects
  ADD_EFFECT: 'ADD_EFFECT',
  REMOVE_EFFECT: 'REMOVE_EFFECT',
  UPDATE_EFFECT: 'UPDATE_EFFECT',
  ADD_TRANSITION: 'ADD_TRANSITION',
  REMOVE_TRANSITION: 'REMOVE_TRANSITION',
  UPDATE_TRANSITION: 'UPDATE_TRANSITION',
  // Undo/Redo
  UNDO: 'UNDO',
  REDO: 'REDO',
  // UI
  SET_ACTIVE_PANEL: 'SET_ACTIVE_PANEL',
  SET_SELECTED_EFFECT_TYPE: 'SET_SELECTED_EFFECT_TYPE',
};

const defaultTrack = (type, index) => ({
  id: uuidv4(),
  name: type === 'video' ? `Video ${index}` : type === 'audio' ? `Audio ${index}` : `Title ${index}`,
  type,
  clips: [],
  muted: false,
  locked: false,
  solo: false,
  volume: 1,
  height: type === 'audio' ? 40 : 48,
});

const initialState = {
  projectName: 'Untitled Project',
  projectPath: null,
  mediaPool: [],
  tracks: [
    defaultTrack('video', 1),
    defaultTrack('video', 2),
    defaultTrack('audio', 1),
    defaultTrack('audio', 2),
  ],
  selectedClipIds: [],
  playhead: 0,
  isPlaying: false,
  duration: 60,
  zoom: 100, // pixels per second
  activePanel: 'media', // media | effects | transitions | audio | color
  history: [],
  future: [],
};

function recordHistory(state) {
  const snap = {
    tracks: JSON.parse(JSON.stringify(state.tracks)),
    duration: state.duration,
  };
  return {
    ...state,
    history: [...state.history.slice(-49), snap],
    future: [],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.NEW_PROJECT:
      return { ...initialState, tracks: initialState.tracks.map(t => ({ ...t, id: uuidv4(), clips: [] })) };

    case ACTIONS.SET_PROJECT_NAME:
      return { ...state, projectName: action.payload };

    case ACTIONS.ADD_MEDIA:
      return {
        ...state,
        mediaPool: [...state.mediaPool, ...action.payload.filter(m => !state.mediaPool.find(e => e.path === m.path))],
      };

    case ACTIONS.REMOVE_MEDIA:
      return { ...state, mediaPool: state.mediaPool.filter(m => m.id !== action.payload) };

    case ACTIONS.ADD_CLIP: {
      const s = recordHistory(state);
      const { trackId, clip } = action.payload;
      return {
        ...s,
        tracks: s.tracks.map(t => t.id === trackId
          ? { ...t, clips: [...t.clips, { ...clip, id: uuidv4(), effects: [], transitions: [] }] }
          : t
        ),
        duration: Math.max(s.duration, (clip.startTime || 0) + (clip.duration || 5)),
      };
    }

    case ACTIONS.REMOVE_CLIP: {
      const s = recordHistory(state);
      return {
        ...s,
        tracks: s.tracks.map(t => ({ ...t, clips: t.clips.filter(c => !action.payload.includes(c.id)) })),
        selectedClipIds: s.selectedClipIds.filter(id => !action.payload.includes(id)),
      };
    }

    case ACTIONS.MOVE_CLIP: {
      const s = recordHistory(state);
      const { clipId, newTrackId, newStartTime } = action.payload;
      let movedClip = null;
      const tracks = s.tracks.map(t => {
        const clip = t.clips.find(c => c.id === clipId);
        if (clip) movedClip = clip;
        return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
      });
      return {
        ...s,
        tracks: tracks.map(t =>
          t.id === newTrackId && movedClip
            ? { ...t, clips: [...t.clips, { ...movedClip, startTime: newStartTime }] }
            : t
        ),
      };
    }

    case ACTIONS.TRIM_CLIP: {
      const s = recordHistory(state);
      const { clipId, trimIn, trimOut } = action.payload;
      return {
        ...s,
        tracks: s.tracks.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === clipId
            ? { ...c, trimIn: trimIn ?? c.trimIn, trimOut: trimOut ?? c.trimOut,
                duration: (c.sourceDuration || c.duration) - (trimIn ?? c.trimIn ?? 0) - (trimOut ?? c.trimOut ?? 0) }
            : c
          ),
        })),
      };
    }

    case ACTIONS.SPLIT_CLIP: {
      const s = recordHistory(state);
      const { clipId, splitTime } = action.payload;
      const tracks = s.tracks.map(t => {
        const idx = t.clips.findIndex(c => c.id === clipId);
        if (idx === -1) return t;
        const clip = t.clips[idx];
        const relativeTime = splitTime - clip.startTime;
        if (relativeTime <= 0 || relativeTime >= clip.duration) return t;
        const left = { ...clip, duration: relativeTime, id: uuidv4() };
        const right = {
          ...clip,
          id: uuidv4(),
          startTime: splitTime,
          duration: clip.duration - relativeTime,
          trimIn: (clip.trimIn || 0) + relativeTime,
        };
        const newClips = [...t.clips];
        newClips.splice(idx, 1, left, right);
        return { ...t, clips: newClips };
      });
      return { ...s, tracks };
    }

    case ACTIONS.SELECT_CLIP:
      return { ...state, selectedClipIds: action.payload ? [action.payload] : [] };

    case ACTIONS.SELECT_CLIPS:
      return { ...state, selectedClipIds: action.payload };

    case ACTIONS.ADD_TRACK:
      return {
        ...state,
        tracks: [...state.tracks, defaultTrack(action.payload.type, state.tracks.filter(t => t.type === action.payload.type).length + 1)],
      };

    case ACTIONS.REMOVE_TRACK: {
      const s = recordHistory(state);
      return { ...s, tracks: s.tracks.filter(t => t.id !== action.payload) };
    }

    case ACTIONS.SET_TRACK_MUTE:
      return { ...state, tracks: state.tracks.map(t => t.id === action.payload.trackId ? { ...t, muted: action.payload.value } : t) };

    case ACTIONS.SET_TRACK_LOCK:
      return { ...state, tracks: state.tracks.map(t => t.id === action.payload.trackId ? { ...t, locked: action.payload.value } : t) };

    case ACTIONS.SET_TRACK_SOLO:
      return { ...state, tracks: state.tracks.map(t => t.id === action.payload.trackId ? { ...t, solo: action.payload.value } : t) };

    case ACTIONS.SET_TRACK_VOLUME:
      return { ...state, tracks: state.tracks.map(t => t.id === action.payload.trackId ? { ...t, volume: action.payload.value } : t) };

    case ACTIONS.SET_PLAYHEAD:
      return { ...state, playhead: action.payload };

    case ACTIONS.SET_PLAYING:
      return { ...state, isPlaying: action.payload };

    case ACTIONS.SET_ZOOM:
      return { ...state, zoom: Math.max(20, Math.min(500, action.payload)) };

    case ACTIONS.SET_DURATION:
      return { ...state, duration: Math.max(action.payload, 10) };

    case ACTIONS.ADD_EFFECT: {
      const { clipId, effect } = action.payload;
      const s = recordHistory(state);
      return {
        ...s,
        tracks: s.tracks.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === clipId
            ? { ...c, effects: [...(c.effects || []), { ...effect, id: uuidv4() }] }
            : c
          ),
        })),
      };
    }

    case ACTIONS.REMOVE_EFFECT: {
      const { clipId, effectId } = action.payload;
      const s = recordHistory(state);
      return {
        ...s,
        tracks: s.tracks.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === clipId
            ? { ...c, effects: (c.effects || []).filter(e => e.id !== effectId) }
            : c
          ),
        })),
      };
    }

    case ACTIONS.UPDATE_EFFECT: {
      const { clipId, effectId, params } = action.payload;
      return {
        ...state,
        tracks: state.tracks.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === clipId
            ? { ...c, effects: (c.effects || []).map(e => e.id === effectId ? { ...e, params: { ...e.params, ...params } } : e) }
            : c
          ),
        })),
      };
    }

    case ACTIONS.ADD_TRANSITION: {
      const { clipId, transition } = action.payload;
      const s = recordHistory(state);
      return {
        ...s,
        tracks: s.tracks.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === clipId
            ? { ...c, transitionIn: { ...transition, id: uuidv4() } }
            : c
          ),
        })),
      };
    }

    case ACTIONS.SET_ACTIVE_PANEL:
      return { ...state, activePanel: action.payload };

    case ACTIONS.UNDO: {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1];
      const future = [{ tracks: JSON.parse(JSON.stringify(state.tracks)), duration: state.duration }, ...state.future];
      return { ...state, tracks: prev.tracks, duration: prev.duration, history: state.history.slice(0, -1), future: future.slice(0, 50) };
    }

    case ACTIONS.REDO: {
      if (!state.future.length) return state;
      const next = state.future[0];
      const history = [...state.history, { tracks: JSON.parse(JSON.stringify(state.tracks)), duration: state.duration }];
      return { ...state, tracks: next.tracks, duration: next.duration, history: history.slice(-50), future: state.future.slice(1) };
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export function useDispatch() {
  const { dispatch } = useStore();
  return useCallback((type, payload) => dispatch({ type, payload }), [dispatch]);
}
