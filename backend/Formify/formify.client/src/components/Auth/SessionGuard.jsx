import { useEffect } from 'react';

const AUTH_ME_URL = 'http://localhost:5208/api/auth/me';

/**
 * SessionGuard
 *
 * Valida o token JWT contra o backend uma vez no arranque da aplicação.
 * - 200: sincroniza role/username no localStorage com a resposta do servidor.
 * - 401: limpa a sessão (token inválido, expirado ou utilizador removido).
 * - Erro de rede: NÃO mexe na sessão — backend pode estar offline e queremos
 *   continuar a tratar o utilizador como logado para não estragar a UX.
 */
export default function SessionGuard() {
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const controller = new AbortController();

        const validate = async () => {
            try {
                const response = await fetch(AUTH_ME_URL, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('username');
                    window.dispatchEvent(new Event('app:logout'));
                    return;
                }

                if (!response.ok) return;

                const data = await response.json();
                if (data?.role) localStorage.setItem('role', data.role);
                if (data?.username) localStorage.setItem('username', data.username);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('Não foi possível validar a sessão (backend offline?).', error);
                }
            }
        };

        validate();
        return () => controller.abort();
    }, []);

    return null;
}
