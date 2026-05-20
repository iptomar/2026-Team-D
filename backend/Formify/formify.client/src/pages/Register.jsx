import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function FloatingField({ id, label, type = 'text', value, onChange, autoComplete }) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                placeholder=" "
                className="peer w-full rounded border border-border px-3 pb-2 pt-5 outline-none transition-colors focus:border-accent"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-3 top-2 text-xs text-text transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-text peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-accent"
            >
                {label}
            </label>
        </div>
    );
}

export default function Register() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [role, setRole] = useState('professor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        if (!name || !username || !password || !confirm) return 'Todos os campos são obrigatórios.';
        if (password.length < 8) return 'A password deve ter pelo menos 8 caracteres.';
        if (password !== confirm) return 'As passwords não coincidem.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (v) { setError(v); return; }
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password, role })
            });

            if (res.ok) {
                // iniciar sessão automaticamente
                const loginRes = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (loginRes.ok) {
                    const data = await loginRes.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('username', data.username);
                    // toast de sucesso
                    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Registo efetuado com sucesso', type: 'success' } }));
                    // redirecionar conforme role
                    if (data.role === 'professor') navigate('/professor');
                    else if (data.role === 'funcionario') navigate('/funcionario');
                    else if (data.role === 'admin') navigate('/admin');
                    else navigate('/');
                } else {
                    navigate('/login');
                }
            } else {
                const data = await res.json();
                setError(data?.error || data?.message || 'Erro ao registar.');
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
                    <h1 className="text-3xl font-bold text-accent">Criar conta</h1>
                    <p className="mt-2 text-sm text-text">Preencha os dados para criar a sua conta.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <FloatingField id="register-name" label="Nome" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                    <FloatingField id="register-username" label="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
                    <FloatingField id="register-password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                    <FloatingField id="register-confirm" label="Confirmar Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />

                    <label className="block text-sm">Função</label>
                    <select className="w-full rounded border px-3 py-2" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="professor">Professor</option>
                        <option value="funcionario">Funcionário</option>
                    </select>

                    {error && <div className="text-red-600">{error}</div>}

                    <button disabled={loading} type="submit" className="w-full rounded bg-accent px-4 py-2 text-white">
                        {loading ? 'A processar...' : 'Criar conta'}
                    </button>
                </form>

                <Link to="/login" className="block w-full rounded-lg border border-accent-border px-4 py-2 text-center text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent">Já tem conta? Iniciar sessão</Link>
            </div>
        </div>
    );
}
