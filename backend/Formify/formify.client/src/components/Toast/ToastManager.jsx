import { useEffect, useState } from 'react';
import Toast from '../Toast';

export default function ToastManager() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (e) => {
            const { message, type = 'success', duration = 3000 } = e.detail || {};
            const id = Date.now() + Math.random();
            setToasts((t) => [...t, { id, message, type }]);
            // remove after duration
            setTimeout(() => {
                setToasts((t) => t.filter(x => x.id !== id));
            }, duration);
        };

        window.addEventListener('app:toast', handler);
        return () => window.removeEventListener('app:toast', handler);
    }, []);

    const handleClose = (id) => {
        setToasts((t) => t.filter(x => x.id !== id));
    };

    if (!toasts.length) return null;

    return (
        <div aria-live="polite" className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(t => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => handleClose(t.id)} />
            ))}
        </div>
    );
}
