import { Component, type ReactNode } from 'react';

interface State { failed: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="notice" role="alert">
        <p>Something went wrong.</p>
        <button className="reload" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}
