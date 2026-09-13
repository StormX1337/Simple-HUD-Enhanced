import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Raccoon } from './art/Raccoon';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Fängt Fehler in der Oberfläche ab, damit statt einer weißen Seite eine
 * Erklärung mit Neustart-Knopf erscheint.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[bandit-bay] Fehler in der Oberfläche:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        data-testid="error-boundary"
        className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#12233f] p-6 text-center"
      >
        <Raccoon size={110} />
        <h1 className="mt-2 font-display text-2xl font-black text-[#ffd95e]">Ups, da klemmt was</h1>
        <p className="mt-1 max-w-sm text-sm text-white/75">
          Die Oberfläche ist gestolpert. Dein Spielstand liegt sicher auf dem Server – ein Neustart
          reicht.
        </p>
        <pre className="mt-3 max-h-28 w-full max-w-sm overflow-auto rounded-2xl bg-black/40 p-2 text-left text-[10px] text-white/60">
          {error.message}
        </pre>
        <button
          type="button"
          className="btn-gold mt-4 w-full max-w-xs py-3 text-lg"
          onClick={() => window.location.reload()}
        >
          Neu laden
        </button>
        <button
          type="button"
          className="btn-ghost mt-2 w-full max-w-xs text-sm"
          onClick={() => this.setState({ error: null })}
        >
          Trotzdem weiterspielen
        </button>
      </div>
    );
  }
}
