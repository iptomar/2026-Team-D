import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateForm() {
    // Estados para guardar o que o utilizador escreve
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    // Estado que guarda a lista de campos do formulário (cada campo tem label, tipo, etc.)
    const [fields, setFields] = useState([]); // comentario ju

    // estado para guardar mensagens de erro do campo nome
    const [erroNome, setErroNome] = useState('');

    //state hook para prevenir double-submits
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate(); // Para voltarmos à página inicial depois de gravar

    // Função que adiciona um novo campo ao formulário
    const adicionarCampo = () => {
        const novoCampo = {
            id: Date.now().toString(), // ID único para identificar o campo
            type: "text", //fieldType.toString.trim,// Tipo de campo (por agora sempre texto) //É preciso fazer validação 
            label: "", // Alterado: agora começa vazio para não ter de apagar texto
            placeholder: "",    //(tem de editar esta parte)
            required: false,
            options: []
        };
        // Atualiza o estado adicionando o novo campo à lista existente
        setFields([...fields, novoCampo]);
    };

    // Função que altera o label (nome visível) de um campo específico
    const alterarLabel = (id, novoLabel) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, label: novoLabel } : campo // Atualiza apenas o campo correspondente
        );
        // Atualiza o estado com os novos valores
        setFields(novosCampos);
    };

    
    const alterarTipo = (id, novoTipo) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, type: novoTipo } : campo
        );
        setFields(novosCampos);
    };

    const alterarObrigatorio = (id) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, required: !campo.required } : campo
        );
        setFields(novosCampos);
    };

    // 2. Função que corre ao submeter o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true); // Desativa o botão
        setErroNome('');

        let formValido = true;
        setErroNome('');

        if (nome.trim() === '') {
            setErroNome('O nome do formulário é obrigatório.');
            setIsLoading(false);
            formValido = false;
        }

        if (!formValido) return;
        console.log('Campos no estado antes de enviar:', fields);
        console.log('Título:', nome);
        console.log('Descrição:', descricao);

        try {
            const isFinal = e.nativeEvent.submitter.id === "save-final";
            const response = await fetch('http://localhost:5208/api/Forms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Title: nome,
                    Description: descricao,
                    StatusDraft: !isFinal, // Se o botão que disparou o evento for o de "Guardar", então o form será guardado como !Draft
                    Fields: fields // envia só os labels
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro do backend:', errorText);
                alert('Erro ao criar formulário.');
                setIsLoading(false); // Reativa o botão
                return;
            }

            const data = await response.json();
            console.log('Formulário criado com sucesso:', data);

            alert('Formulário criado com sucesso!');
            navigate('/');
        } catch (error) {
            console.error('Erro de ligação ao backend:', error);
            alert('Não foi possível ligar ao backend.');
            setIsLoading(false); // Reativa o botão 
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
                    {/* Botão que permite adicionar novos campos ao formulário */}
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={adicionarCampo}
                            className="rounded-md bg-gray-200 px-4 py-2 font-semibold transition-all hover:bg-gray-300"
                        >
                            + Adicionar Campo
                        </button>
                    </div>

                    {/* Lista de campos adicionados dinamicamente*/}
                    {fields.map((campo) => (
                        <div key={campo.id} className="flex flex-col gap-2 mt-4">

                            <div className="flex flex-col gap-2">
                                <label className="font-medium">Nome do campo</label>
                                <input
                                    type="text"
                                    value={campo.label}
                                    onChange={(e) => alterarLabel(campo.id, e.target.value)}
                                    className="rounded-md border p-2"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-medium">Tipo de Dados</label>
                                <select
                                    value={campo.type}
                                    onChange={(e) => alterarTipo(campo.id, e.target.value)}
                                    className="rounded-md border border-accent-border p-2 focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
                                >
                                    <option value="text">Texto (Resposta Curta)</option>
                                    <option value="number">Número</option>
                                    <option value="date">Data</option>
                                    <option value="dropdown">Menu Suspenso (Opções)</option>
                                </select>
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={campo.required}
                                    onChange={() => alterarObrigatorio(campo.id)}
                                    className="h-4 w-4 rounded border-accent-border"
                                />
                                Campo obrigatório
                            </label>

                        </div>
                    ))}

                    <div className="mt-6 flex justify-end gap-4 border-t border-accent-border pt-4">
                        <button
                            disabled={isLoading}
                            type="submit"
                            id="save-draft"
                            className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                        >
                            Guardar como Rascunho
                        </button>

                        <button
                            disabled={isLoading}
                            id="save-final"
                            type="submit"
                            className="rounded-md bg-green-600 px-6 py-2 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50"
                        >
                            Publicar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}