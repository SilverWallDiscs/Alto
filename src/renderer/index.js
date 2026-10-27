import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Alto render error:', error, info);
  }
  render() {
    if (this.state.error) {
      const s = this.state.error.stack || String(this.state.error);
      return React.createElement('div', {
        style: {
          background: '#0f0f13', color: '#ff6b6b', padding: 40,
          fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap',
          position: 'fixed', inset: 0, overflow: 'auto'
        }
      }, 'Alto failed to render\n\n' + s);
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root'));
root.render(
  React.createElement(ErrorBoundary, null,
    React.createElement(App, null)
  )
);

// Hide splash screen once React renders
if (typeof window.__hideSplash === 'function') {
  window.__hideSplash();
}
