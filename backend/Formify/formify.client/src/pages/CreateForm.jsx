import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateForm() {
    // 1. Estados para guardar o que o utilizador escreve
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const navigate = useNavigate(); // Para voltarmos à página inicial depois de gravar

    // 2. Função que corre ao submeter o formulário
    const handleSubmit = (e) => {
        e.preventDefault();

        const novoFormulario = { nome, descricao };
        console.log("A preparar para enviar para o backend:", novoFormulario);

        // (A chamada à API do .NET vai entrar aqui mais tarde)

        alert('Formulário criado com sucesso! (Fase de Teste)');
        navigate('/'); // Redireciona o utilizador de volta para a lista
    };

    return (
        <div className="space-y-6">
            {/* Header da página com botão de voltar (Mantido do código do Sebas) */}
            <div className="flex flex-col gap-4">
                <Link
                    to="/"
                    className="inline-flex w-fit items-center gap-2 font-semibold text-accent transition-all hover:opacity-80"
                >
                    ← Voltar
                </Link>
                <h2 className="text-3xl font-bold text-text-h">Novo Formulário</h2>
            </div>

            {/* Container principal do formulário */}
            <div className="space-y-4">

                {/* Aqui começa a TUA parte - O Formulário que substitui o placeholder */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-accent-border bg-accent-bg p-6">

                    {/* Campo: Nome */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="nome" className="font-medium text-text-h">
                            Nome do Formulário <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            placeholder="Ex: Pedido de Aquisição de Material"
                            className="rounded-md border border-accent-border p-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Campo: Descrição */}
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

                    {/* Botão de Submeter */}
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