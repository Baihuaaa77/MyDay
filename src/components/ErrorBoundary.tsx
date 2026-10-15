import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("MyDay render error", error, info);
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-canvas px-4 text-center">
          <section className="card max-w-md p-6">
            <p className="text-4xl" aria-hidden>
              🌧️
            </p>
            <h1 className="mt-3 text-xl font-bold text-ink">页面遇到了一点问题</h1>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              请刷新页面重试。你的每日记录保存在本机浏览器中，不会因为刷新而被清空。
            </p>
            <p className="mt-3 break-all rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-ink-3">
              {this.state.error.message}
            </p>
            <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
