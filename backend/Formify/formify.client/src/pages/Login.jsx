import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
                else if (data.role === 'funcionario') navigate('/funcionario');
                else if (data.role === 'admin') navigate('/admin');
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
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-white p-8 shadow-custom">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-accent">Iniciar sessão</h1>
                    <p className="mt-2 text-sm text-text">Introduza as suas credenciais.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input className="w-full rounded border px-3 py-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <input type="password" className="w-full rounded border px-3 py-2" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

                    {error && <div className="text-red-600">{error}</div>}

                    <button disabled={loading} type="submit" className="w-full rounded bg-accent px-4 py-2 text-white">{loading ? 'A processar...' : 'Iniciar sessão'}</button>
                </form>

                <Link to="/register" className="block w-full rounded-lg border border-accent-border px-4 py-2 text-center text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent">Criar conta</Link>
            </div>
        </div>
    );
}
