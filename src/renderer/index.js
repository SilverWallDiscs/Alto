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
      return (
        <div style={{
          background: '#1a0010', color: '#ff6b6b', padding: 40,
          fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap',
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto'
        }}>
          {'Alto failed to render\n\n' + this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

// Hide the loading indicator once React takes over
const loadingEl = document.getElementById('loading');
if (loadingEl) loadingEl.style.display = 'none';

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
