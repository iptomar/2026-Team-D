export default function Toast({ message, type = 'info', onClose }) {
    const styles = {
        success: 'border-green-200 bg-green-50 text-green-800',
        error: 'border-red-200 bg-red-50 text-red-800',
        info: 'border-blue-200 bg-blue-50 text-blue-800',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    };

    return (
        <div
            className={`pointer-events-auto w-full rounded-lg border px-4 py-3 shadow-2xl ring-1 ring-black/5 backdrop-blur-sm ${styles[type] || styles.info}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <span className="text-sm font-semibold leading-none mt-0.5">
                    {type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}
                </span>
                <p className="flex-1 text-sm font-medium leading-5">{message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-2 text-xs font-semibold opacity-60 transition-opacity hover:opacity-100"
                    aria-label="Fechar notificação"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
