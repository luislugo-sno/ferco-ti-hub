import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Error inesperado al renderizar la vista.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturó un fallo de renderizado:', error, errorInfo);
  }

  handleResetAndGoHome = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
      return;
    }
    try {
      window.location.href = '/consultar';
    } catch {
      window.location.reload();
    }
  };

  handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl py-10 px-4">
          <div
            role="alert"
            className="rounded-md border border-slate-300 bg-white p-6 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-amber-300 bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Grupo Comercializadora Ferco • Hub Operativo TI/BI
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Se produjo una interrupción al cargar esta vista
                </h2>
                <p className="text-xs leading-relaxed text-slate-600">
                  El sistema protegió su sesión ante un dato inesperado. Puede volver a la
                  pantalla principal o recargar la aplicación de forma segura.
                </p>

                {this.state.errorMessage && (
                  <pre className="mt-2 overflow-x-auto rounded-sm border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700">
                    <code>Detalle: {this.state.errorMessage}</code>
                  </pre>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-9 sm:min-h-0"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Recargar Página</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndGoHome}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 sm:h-9 sm:min-h-0"
              >
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Recargar / Volver al inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
