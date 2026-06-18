import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function FloatingField({ id, label, type = 'text', value, onChange, autoComplete }) {
    const isPassword = type === 'password';
    const [show, setShow] = useState(false);
    const actualType = isPassword && show ? 'text' : type;

    return (
        <div className="relative">
            <input
                id={id}
                type={actualType}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                placeholder=" "
                className={`peer w-full rounded border border-border ${isPassword ? 'pr-10' : ''} px-3 pb-2 pt-5 outline-none transition-colors focus:border-accent`}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-3 top-2 text-xs text-text transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-text peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-accent"
            >
                {label}
            </label>
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    aria-label={show ? 'Ocultar password' : 'Mostrar password'}
                    aria-pressed={show}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    {show ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 4.7A10.9 10.9 0 0 1 12 4.5c5 0 9 4 10 7.5a12.4 12.4 0 0 1-3.6 4.7M6.5 6.5C4.3 8 2.7 10 2 12c1 3.5 5 7.5 10 7.5 1.6 0 3-.3 4.3-.9" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2 12s3.6-7.5 10-7.5S22 12 22 12s-3.6 7.5-10 7.5S2 12 2 12z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) { setError('Username e password são obrigatórios.'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                // guardar token simples no localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', data.username);
                // toast de sucesso
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Login efetuado com sucesso', type: 'success' } }));
                // redirecionar conforme role
                if (data.role === 'professor') navigate('/professor');
                else if (['funcionario', 'rh', 'gri', 'secretaria','dircurso'].includes(data.role)) {
                    navigate('/funcionario');
                }
                else if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'aluno') navigate('/aluno');
                else navigate('/');
            } else {
                const data = await res.json();
                setError(data?.error || 'Credenciais inválidas.');
            }
        } catch {
            setError('Erro de rede.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-white p-8 shadow-custom">
                <Link
                    to="/"
                    className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
                >
                    ← Voltar à página inicial
                </Link>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-accent">Iniciar sessão</h1>
                    <p className="mt-2 text-sm text-text">Introduza as suas credenciais.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <FloatingField id="login-username" label="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
                    <FloatingField id="login-password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />

                    {error && <div className="text-red-600">{error}</div>}

                    <button disabled={loading} type="submit" className="w-full rounded bg-accent px-4 py-2 text-white">{loading ? 'A processar...' : 'Iniciar sessão'}</button>
                </form>

                <Link to="/register" className="block w-full rounded-lg border border-accent-border px-4 py-2 text-center text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent">Criar conta</Link>
            </div>
        </div>
    );
}
