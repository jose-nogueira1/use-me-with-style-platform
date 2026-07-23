import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected application error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <h1>Não foi possível abrir esta página.</h1>
            <p>Tente novamente. Se o problema continuar, volte à página inicial.</p>
            <a href="/">Voltar ao início</a>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
