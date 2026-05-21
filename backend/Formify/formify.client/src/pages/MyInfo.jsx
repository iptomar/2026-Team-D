import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyInfo() {
    const navigate = useNavigate();

    const [showPersonalInfo, setShowPersonalInfo] = useState(false);

    const [user, setUser] = useState({
        username: '',
        role: '',
        name: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const username = localStorage.getItem('username');
                const token = localStorage.getItem('token');

                if (!username || !token) return;

                const response = await fetch(
                    `/api/Auth/user/${username}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Erro ao buscar utilizador');
                }

                const data = await response.json();

                setUser({
                    username: data.username,
                    role: data.role,
                    name: data.name
                });

            } catch (error) {
                console.error(error);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="space-y-6">

            <div className="max-w-xl mx-auto py-4">
                <h2 className="text-2xl font-bold">
                    As minhas informações
                </h2>

                <div className="bg-white rounded p-4 shadow mt-3">

                    <p><strong>Nome:</strong> {user.name}</p>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Função:</strong> {user.role}</p>

                    <div className="mt-3 flex gap-2">

                        <button
                            onClick={() => setShowPersonalInfo(!showPersonalInfo)}
                            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            {showPersonalInfo ? 'Ocultar' : 'Ver'} Informações Pessoais
                        </button>

                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Logout
                        </button>

                    </div>
                </div>

                {showPersonalInfo && (
                    <div className="bg-white rounded p-4 shadow mt-4 border-l-4 border-blue-500">

                        <h3 className="text-xl font-semibold mb-4">
                            Informações de Registo
                        </h3>

                        <div className="space-y-3">

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">
                                        Nome
                                    </label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border">
                                        {user.name}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-600">
                                        Username
                                    </label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border">
                                        {user.username}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">
                                        Função
                                    </label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border">
                                        {user.role}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="mt-4 pt-4 border-t">

                            <button
                                className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                                onClick={() => setShowPersonalInfo(false)}
                            >
                                Fechar
                            </button>

                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}