import { Link } from 'react-router-dom';

export default function Login() {
    return (
        <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-white p-8 shadow-custom">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-accent">Iniciar sessão</h1>
                    <p className="mt-2 text-sm text-text">
                        Página em desenvolvimento.
                    </p>
                </div>

                <Link
                    to="/"
                    className="block w-full rounded-lg border border-accent-border px-4 py-2 text-center text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent"
                >
                    ← Voltar à página principal
                </Link>
            </div>
        </div>
    );
}
