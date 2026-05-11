import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateForm() {
    // Estados para guardar o que o utilizador escreve
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    // Estado que guarda a lista de campos do formulário (cada campo tem label, tipo, etc.)
    const [fields, setFields] = useState([]); // comentario ju
    const [audience, setAudience] = useState([]);

    // estado para guardar mensagens de erro do campo nome
    const [erroNome, setErroNome] = useState('');
    const [erroDescricao, setErroDescricao] = useState('');
    // Limpa qualquer erro anterior do público-alvo
    const [erroAudience, setErroAudience] = useState('');

    //state hook para prevenir double-submits
    const [isLoading, setIsLoading] = useState(false);

    // Guarda erros específicos de cada campo
    const [fieldErrors, setFieldErrors] = useState({}); 

    const navigate = useNavigate(); // Para voltarmos à página inicial depois de gravar

    // Função que adiciona um novo campo ao formulário
    const adicionarCampo = () => {
        const novoCampo = {
            id: Date.now().toString(), // ID único para identificar o campo
            type: "text", //fieldType.toString.trim,// Tipo de campo (por agora sempre texto) //É preciso fazer validação 
            label: "", // Alterado: começa vazio para não ter de apagar texto
            placeholder: "",    //(tem de editar esta parte)
            required: false,
            x: null,
            y: null,
            options: [],
            tableFixedRows: false, 
            tableRowCount: 1       
        };
        // Atualiza o estado adicionando o novo campo à lista existente
        setFields([...fields, novoCampo]);
    };
    const eliminarCampo = (id) => {
        const novosCampos = fields.filter(campo => campo.id !== id);
        setFields(novosCampos);
    };

    // Função que altera o label (nome visível) de um campo específico
    const alterarLabel = (id, novoLabel) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, label: novoLabel } : campo // Atualiza apenas o campo correspondente
        );
        // Atualiza o estado com os novos valores
        setFields(novosCampos);
    };

    const alterarPlaceholder = (id, novoPlaceholder) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, placeholder: novoPlaceholder } : campo
        );
        setFields(novosCampos);
    };

    
    const alterarTipo = (id, novoTipo) => {
        setFields(fields.map(campo => {
            if (campo.id === id) {
                // Se mudar para tabela e não houver colunas, cria a primeira
                const novasOpcoes = (novoTipo === 'table' && campo.options.length === 0)
                    ? [""]
                    : campo.options;

                return { ...campo, type: novoTipo, options: novasOpcoes };
            }
            return campo;
        }));
    };

    // Adiciona uma nova coluna (caixa de texto vazia) à lista de opções
    const adicionarColuna = (id) => {
        setFields(fields.map(c =>
            c.id === id ? { ...c, options: [...c.options, ""] } : c
        ));
    };

    // Atualiza o texto de uma coluna específica
    const alterarColuna = (id, index, valor) => {
        setFields(fields.map(c => {
            if (c.id === id) {
                const novasColunas = [...c.options];
                novasColunas[index] = valor;
                return { ...c, options: novasColunas };
            }
            return c;
        }));
    };


    // Remove uma coluna específica (garantindo que sobra sempre pelo menos 1)
    const removerColuna = (id, index) => {
        setFields(fields.map(c => {
            if (c.id === id) {
                // Só remove se houver mais do que uma coluna
                if (c.options.length > 1) {
                    const novasColunas = c.options.filter((_, i) => i !== index);
                    return { ...c, options: novasColunas };
                }
            }
            return c;
        }));
    };

    // Atualiza as configurações da tabela (o toggle das linhas e o número de linhas)
    const alterarConfigTabela = (id, propriedade, valor) => {
        setFields(fields.map(c =>
            c.id === id ? { ...c, [propriedade]: valor } : c
        ));
    };

    const alterarObrigatorio = (id) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, required: !campo.required } : campo
        );
        setFields(novosCampos);
    };

    const toggleAudience = (value) => {
        setAudience(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

     // Função que altera as opções de um campo dropdown específico
    const alterarOptions = (id, novasOptions) => {
        const listaOptions = novasOptions
            .split(',')
            .map(opcao => opcao.trim())
            .filter(opcao => opcao !== '');

        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, options: listaOptions } : campo
        );
        setFields(novosCampos);
    };

    // 2. Função que corre ao submeter o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true); // Desativa o botão
        setErroNome('');
        setErroDescricao('');
        setErroAudience('');

        let formValido = true;
        setErroNome('');
        setErroAudience('');
        setFieldErrors({});

        // 1. Validações base
        if (nome.trim() === '') {
            setErroNome('O nome do formulário é obrigatório.');
            formValido = false;
        }

        if (audience.length === 0) {
            setErroAudience("Tem de selecionar pelo menos um público-alvo.");
            formValido = false;
        }

        // 2. Validações dos campos dinâmicos (Erro individual por cada input)
        let novosErros = {};
        let camposValidos = true;

        fields.forEach(f => {
            let errosDoCampo = {
                label: !f.label || f.label.trim() === '',
                placeholder: !f.placeholder || f.placeholder.trim() === '',
                options: false
            };

            if (f.type === 'dropdown' && (f.options.length === 0 || f.options.some(opt => opt.trim() === ''))) {
                errosDoCampo.options = true;
            }
            if (f.type === 'table' && (f.options.length === 0 || f.options.some(col => col.trim() === ''))) {
                errosDoCampo.options = true;
            }

            if (errosDoCampo.label || errosDoCampo.placeholder || errosDoCampo.options) {
                novosErros[f.id] = errosDoCampo;
                camposValidos = false;
            }
        });

        // 3. Se algo falhar, PÁRA aqui e não vai para o try/catch
        if (!formValido || !camposValidos) {
            if (!camposValidos) setFieldErrors(novosErros);
            setIsLoading(false);
            return;
        }
        

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
                    Fields: fields, // envia só os labels
                    Audience: audience
                }),
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    if (errorData.errors) {
                        if (errorData.errors.Title) setErroNome(errorData.errors.Title[0]);
                        if (errorData.errors.Description) setErroDescricao(errorData.errors.Description[0]);
                    } else if (errorData.message) {
                        setErroNome(errorData.message);
                    }
                } else {
                    alert('Erro ao criar formulário.');
                }
                setIsLoading(false);
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
                            className={`rounded-md border p-2 focus:outline-none ${erroDescricao ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                        />
                        {erroDescricao && <span className="text-red-500 text-sm">{erroDescricao}</span>}
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-text-h">
                            Público-alvo
                        </label>

                        <div className="flex flex-col gap-2 rounded-md border border-accent-border bg-white p-3">

                            {/* Professores */}
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={audience.includes("teacher")}
                                    onChange={() => toggleAudience("teacher")}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                <span>Professores</span>
                            </label>

                            {/* Funcionários */}
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={audience.includes("staff")}
                                    onChange={() => toggleAudience("staff")}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                <span>Funcionários</span>
                            </label>

                            
                            {erroAudience && (
                            <span className="text-red-500 text-sm">
                                {erroAudience}
                            </span>
                        )}
                        </div>
                        
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

                    {/* Lista de campos adicionados dinamicamente */}
                    {fields.map((campo) => (
                        <div key={campo.id} className={`flex flex-col gap-4 mt-4 p-4 rounded-md border shadow-sm transition-all ${fieldErrors[campo.id] ? 'border-red-300 bg-red-50/30' : 'border-accent-border bg-white'}`}>

                            {/* 1. Nome do Campo */}
                            <div className="flex flex-col gap-2">
                                <label className="font-medium text-sm text-text-h">Nome do campo</label>
                                <input
                                    type="text"
                                    value={campo.label}
                                    placeholder="Ex: Endereço ..."
                                    onChange={(e) => alterarLabel(campo.id, e.target.value)}
                                    className={`rounded-md border p-2 focus:outline-none ${fieldErrors[campo.id]?.label ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                />
                                {fieldErrors[campo.id]?.label && <span className="text-red-500 text-sm">O nome do campo é obrigatório.</span>}
                            </div>

                            {/* 2. Placeholder (Texto de Exemplo) */}
                            <div className="flex flex-col gap-2">
                                <label className="font-medium text-sm text-text-h">Texto de Exemplo (Placeholder)</label>
                                <input
                                    type="text"
                                    value={campo.placeholder}
                                    onChange={(e) => alterarPlaceholder(campo.id, e.target.value)}
                                    placeholder="Ex: Insira o valor aqui..."
                                    className={`rounded-md border p-2 focus:outline-none ${fieldErrors[campo.id]?.placeholder ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                />
                                {fieldErrors[campo.id]?.placeholder && <span className="text-red-500 text-sm">O texto de exemplo é obrigatório.</span>}
                            </div>

                            {/* 3. Tipo de Dados */}
                            <div className="flex flex-col gap-2">
                                <label className="font-medium text-sm text-text-h">Tipo de Dados</label>
                                <select
                                    value={campo.type}
                                    onChange={(e) => alterarTipo(campo.id, e.target.value)}
                                    className="rounded-md border border-accent-border p-2 focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
                                >
                                    <option value="text">Texto (Resposta Curta)</option>
                                    <option value="number">Número</option>
                                    <option value="date">Data</option>
                                    <option value="dropdown">Menu Suspenso (Opções)</option>
                                    <option value="table">Tabela (Grelha)</option>
                                </select>
                            </div>

                            {/* CONFIGURAÇÃO DA TABELA (Só aparece se o tipo for 'table') */}
                            {campo.type === 'table' && (
                                <div className="flex flex-col gap-4 mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <p className="font-semibold text-sm text-text-h">Configuração da Tabela</p>

                                    {/* Caixas de texto das Colunas */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Colunas da Tabela</label>
                                        {campo.options.map((coluna, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={coluna}
                                                    onChange={(e) => alterarColuna(campo.id, idx, e.target.value)}
                                                    placeholder={`Nome da Coluna ${idx + 1}`}
                                                    className={`flex-1 rounded-md border p-2 text-sm focus:outline-none ${fieldErrors[campo.id]?.options && (!coluna || coluna.trim() === '') ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removerColuna(campo.id, idx)}
                                                    disabled={campo.options.length <= 1}
                                                    className="flex-shrink-0 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    title="Remover coluna"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                        {fieldErrors[campo.id]?.options && <span className="text-red-500 text-sm">Todas as colunas têm de ter um nome.</span>}
                                    </div>

                                    {/* Botão de Adicionar Coluna + Toggle de Linhas */}
                                    <div className="flex flex-wrap items-center gap-6 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => adicionarColuna(campo.id)}
                                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm px-4 py-2 rounded-md font-semibold transition"
                                        >
                                            + Adicionar Coluna
                                        </button>

                                        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                            <input
                                                type="checkbox"
                                                checked={campo.tableFixedRows}
                                                onChange={(e) => alterarConfigTabela(campo.id, 'tableFixedRows', e.target.checked)}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            Número fixo de linhas?
                                        </label>

                                        {/* Caixa de Número de Linhas (Só aparece se o toggle estiver ativo) */}
                                        {campo.tableFixedRows && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium">Nº de linhas:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={campo.tableRowCount}
                                                    onChange={(e) => alterarConfigTabela(campo.id, 'tableRowCount', parseInt(e.target.value) || 1)}
                                                    className="rounded-md border border-accent-border p-1 w-16 text-center focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* 4. Opções do Menu Suspenso */}
                            {campo.type === "dropdown" && (
                                <div className="flex flex-col gap-2">
                                    <label className="font-medium text-sm text-text-h">Opções do menu</label>
                                    <input
                                        type="text"
                                        value={campo.options.join(', ')}
                                        onChange={(e) => alterarOptions(campo.id, e.target.value)}
                                        placeholder="Ex: Opção 1, Opção 2, Opção 3, ..."
                                        className={`rounded-md border p-2 focus:outline-none ${fieldErrors[campo.id]?.options ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                    />
                                    {fieldErrors[campo.id]?.options ? (
                                        <span className="text-red-500 text-sm">As opções não podem estar vazias.</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Separe as opções por vírgulas.</span>
                                    )}
                                </div>
                            )}

                            <label className="inline-flex items-center gap-2 text-sm font-medium mt-2">
                                <input
                                    type="checkbox"
                                    checked={campo.required}
                                    onChange={() => alterarObrigatorio(campo.id)}
                                    className="h-4 w-4 rounded border-accent-border"
                                />
                                Campo obrigatório
                            </label>

                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={() => eliminarCampo(campo.id)}
                                    className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:border-red-300"
                                >
                                    🗑️ Eliminar campo
                                </button>
                            </div>

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