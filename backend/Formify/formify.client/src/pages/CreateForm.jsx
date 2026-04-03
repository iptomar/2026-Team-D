import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateForm() {
    // 1. Estados para guardar o que o utilizador escreve
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');

    // estado para guardar mensagens de erro do campo nome
    const [erroNome, setErroNome] = useState('');

    const navigate = useNavigate(); // Para voltarmos à página inicial depois de gravar

    // 2. Função que corre ao submeter o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();

        let formValido = true;
        setErroNome('');

        if (nome.trim() === '') {
            setErroNome('O nome do formulário é obrigatório.');
            formValido = false;
        }

        if (!formValido) return;

        try {
            const response = await fetch('http://localhost:5208/api/forms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: nome,
                    description: descricao,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro do backend:', errorText);
                alert('Erro ao criar formulário.');
                return;
            }

            const data = await response.json();
            console.log('Formulário criado com sucesso:', data);

            alert('Formulário criado com sucesso!');
            navigate('/');
        } catch (error) {
            console.error('Erro de ligação ao backend:', error);
            alert('Não foi possível ligar ao backend.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <Link
                    to="/"
                    className="inline-flex w-fit items-center gap-2 font-semibold text-accent transition-all hover:opacity-80"
                >
                    ← Voltar
                </Link>
                <h2 className="text-3xl font-bold text-text-h">Novo Formulário</h2>
            </div>

            <div className="space-y-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-accent-border bg-accent-bg p-6">

                    <div className="flex flex-col gap-2">
                        <label htmlFor="nome" className="font-medium text-text-h">
                            Nome do Formulário <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Pedido de Aquisição de Material"
                            className={`rounded-md border p-2 focus:outline-none ${erroNome ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                        />
                        {erroNome && (
                            <span className="text-red-500 text-sm">{erroNome}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="descricao" className="font-medium text-text-h">
                            Descrição
                        </label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o propósito deste formulário (opcional)..."
                            rows="4"
                            className="rounded-md border border-accent-border p-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white transition-all hover:bg-blue-700"
                        >
                            Guardar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}