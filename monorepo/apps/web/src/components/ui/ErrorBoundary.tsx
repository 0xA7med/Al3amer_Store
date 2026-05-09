import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-[300px] flex items-center justify-center p-8">
                    <div className="glass-panel rounded-xl p-8 max-w-md w-full text-center">
                        <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl text-red-400">error_outline</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">حدث خطأ غير متوقع</h3>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            عذراً، حدث خطأ أثناء تحميل هذه الصفحة. حاول تحديث الصفحة أو العودة لاحقاً.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={this.handleRetry}
                                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                إعادة المحاولة
                            </button>
                            <button onClick={() => window.location.href = '/'}
                                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all border border-white/10">
                                العودة للرئيسية
                            </button>
                        </div>
                        {this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-500 font-bold">
                                    تفاصيل الخطأ
                                </summary>
                                <pre className="mt-2 p-3 rounded-lg bg-black/30 text-xs text-red-400 overflow-auto max-h-32 leading-relaxed">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
