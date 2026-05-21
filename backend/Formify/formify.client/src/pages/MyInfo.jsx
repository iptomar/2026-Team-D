import { useEffect, useState } from 'react';

const ROLE_LABELS = {
    admin: 'Administrador',
    professor: 'Professor',
    funcionario: 'Funcionário',
};

const formatRole = (role) =>
    ROLE_LABELS[(role || '').toLowerCase()] || role || '—';

const getInitials = (name, username) => {
    const source = (name || username || '').trim();
    if (!source) return '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function MyInfo() {
    const [user, setUser] = useState({ username: '', role: '', name: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        const fetchUser = async () => {
            try {
                setIsLoading(true);
                setError('');

                const username = localStorage.getItem('username');
                const token = localStorage.getItem('token');
                if (!username || !token) {
                    setError('Sessão não encontrada.');
                    return;
                }

                const response = await fetch(`/api/Auth/user/${username}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (response.status === 401) {
                    setError('Sessão expirada. Inicia sessão novamente.');
                    return;
                }
                if (!response.ok) throw new Error('Erro ao obter utilizador');

                const data = await response.json();
                setUser({ username: data.username, role: data.role, name: data.name });
            } catch (e) {
                if (e.name === 'AbortError') return;
                console.error('Erro ao carregar perfil:', e);
                setError('Não foi possível carregar as tuas informações.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
        return () => controller.abort();
    }, []);

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-8 flex flex-col">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-text-h">Informações pessoais</h2>
                <p className="text-lg text-text">Os dados da tua conta no Formify</p>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-text">A carregar perfil...</div>
            ) : error ? (
                <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50 px-8 py-12 text-center">
                    <p className="text-xl font-semibold text-red-700">{error}</p>
                </div>
            ) : (
                <div className="mx-auto w-full max-w-2xl">
                    <div className="rounded-lg border border-accent-border bg-white shadow-sm">
                        <div className="flex items-center gap-4 border-b border-accent-border p-6">
                            <div
                                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white"
                                aria-hidden="true"
                            >
                                {getInitials(user.name, user.username)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="truncate text-xl font-bold text-text-h">
                                    {user.name || '—'}
                                </h3>
                                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-accent-bg px-3 py-1 text-xs font-semibold text-accent">
                                    {formatRole(user.role)}
                                </span>
                            </div>
                        </div>

                        <dl className="divide-y divide-gray-100">
                            <Row label="Nome" value={user.name} />
                            <Row label="Username" value={user.username} />
                            <Row label="Função" value={formatRole(user.role)} />
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="grid gap-1 px-6 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-semibold text-text-h sm:col-span-1">{label}</dt>
            <dd className="text-sm text-text sm:col-span-2">{value || '—'}</dd>
        </div>
    );
}
