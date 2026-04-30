import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * AdminDashboard Component
 *
 * Página principal para visualização dos formulários publicados.
 *
 * Funcionalidades:
 * - Lista apenas formulários publicados;
 * - Permite pesquisar por nome/descrição;
 * - Permite filtrar por público-alvo/cargo;
 * - Permite ordenar por data de criação;
 * - Permite paginar os resultados;
 * - Permite eliminar formulários.
 */
export default function AdminDashboard() {
    // Lista de formulários carregados a partir do backend
    const [forms, setForms] = useState([]);

    // Estado de carregamento da página
    const [isLoading, setIsLoading] = useState(true);

    // Filtros da listagem
    const [selectedCargo, setSelectedCargo] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDate, setSortDate] = useState('newest');

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const formsPerPage = 12;

    // Carrega os formulários quando a página é aberta
    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await fetch('http://localhost:5208/api/Forms');

                if (!response.ok) {
                    throw new Error('Erro ao procurar formulários');
                }

                const data = await response.json();

                // Guarda todos os formulários no estado.
                // A filtragem dos publicados é feita mais abaixo.
                setForms(data);
            } catch (error) {
                console.error('Erro na integração:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForms();
    }, []);

    // Normaliza texto para facilitar pesquisas e comparações.
    // Remove acentos, transforma em minúsculas e evita erros com null/undefined.
    const normalizeText = (value) =>
        (value || '')
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    // Verifica se o formulário está publicado.
    // No modelo atual, StatusDrafted = true significa rascunho.
    // Logo, publicado significa StatusDrafted = false.
    const isPublished = (form) => {
        const statusDrafted = form.statusDrafted ?? form.StatusDrafted;

        return statusDrafted === false;
    };

    // Obtém o público-alvo do formulário num formato normalizado.
    const getAudience = (form) => {
        const rawAudience = form.audience || form.Audience || [];

        if (Array.isArray(rawAudience)) {
            return rawAudience.map(normalizeText);
        }

        return [normalizeText(rawAudience)];
    };

    // Verifica se o formulário corresponde ao cargo/público-alvo selecionado.
    const matchesCargo = (form) => {
        if (selectedCargo === 'todos') return true;

        const audience = getAudience(form);

        // Aceita valores antigos e novos:
        // - teacher/staff
        // - professor/funcionario
        // - professores/funcionarios
        const hasTeacher =
            audience.includes('teacher') ||
            audience.includes('professor') ||
            audience.includes('professores');

        const hasStaff =
            audience.includes('staff') ||
            audience.includes('funcionario') ||
            audience.includes('funcionarios');

        const hasBoth = hasTeacher && hasStaff;

        if (selectedCargo === 'professores') {
            return hasTeacher || hasBoth;
        }

        if (selectedCargo === 'funcionarios') {
            return hasStaff || hasBoth;
        }

        return true;
    };

    // Aplica os filtros:
    // 1. Apenas formulários publicados;
    // 2. Filtro por público-alvo/cargo;
    // 3. Pesquisa por título ou descrição.
    const filteredForms = forms
        .filter(isPublished)
        .filter(matchesCargo)
        .filter((form) => {
            const term = normalizeText(searchTerm.trim());

            if (!term) return true;

            const title = normalizeText(form.title || form.Title || '');
            const description = normalizeText(form.description || form.Description || '');
            const searchableText = `${title} ${description}`;

            const tokens = term.split(/\s+/).filter(Boolean);
            const words = searchableText.split(/[^a-z0-9]+/).filter(Boolean);

            return tokens.every((token) =>
                words.some((word) => word.startsWith(token))
            );
        });

    // Ordena os formulários por data de criação.
    const filteredAndSortedForms = [...filteredForms].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.CreatedAt || 0).getTime();

        if (sortDate === 'oldest') {
            return dateA - dateB;
        }

        return dateB - dateA;
    });

    // Calcula a paginação.
    const totalPages = Math.max(1, Math.ceil(filteredAndSortedForms.length / formsPerPage));
    const indexOfLastForm = currentPage * formsPerPage;
    const indexOfFirstForm = indexOfLastForm - formsPerPage;
    const paginatedForms = filteredAndSortedForms.slice(indexOfFirstForm, indexOfLastForm);

    // Sempre que os filtros mudam, volta à primeira página.
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCargo, sortDate]);

    // Garante que a página atual nunca fica acima do número total de páginas.
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Elimina um formulário no backend e atualiza a lista local.
    const handleDelete = async (id) => {
        const confirmacao = window.confirm('Tens a certeza que queres eliminar este formulário?');

        if (!confirmacao) return;

        try {
            const response = await fetch(`http://localhost:5208/api/Forms/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove o formulário da lista no ecrã imediatamente.
                setForms(forms.filter(form => form.id !== id && form.Id !== id));
            } else {
                alert('Erro ao eliminar formulário.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível ligar ao servidor.');
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-8 flex flex-col">
            {/* Cabeçalho da página */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-text-h">Formulários</h2>
                    <p className="mt-2 text-lg text-text">
                        Listagem dos formulários publicados
                    </p>
                </div>

                <Link
                    to="/CreateForm"
                    className="inline-flex w-fit items-center justify-center rounded-md bg-green-600 px-5 py-2 font-semibold text-white transition-all hover:bg-green-700"
                >
                    + Novo Formulário
                </Link>
            </div>

            {/* Filtros */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                    <label htmlFor="search-form" className="font-medium text-text-h">
                        Pesquisar
                    </label>
                    <input
                        id="search-form"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nome ou palavras-chave"
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="cargo-filter" className="font-medium text-text-h">
                        Cargo
                    </label>
                    <select
                        id="cargo-filter"
                        value={selectedCargo}
                        onChange={(e) => setSelectedCargo(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="todos">Todos</option>
                        <option value="professores">Professores</option>
                        <option value="funcionarios">Funcionários</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="date-sort" className="font-medium text-text-h">
                        Data de criação
                    </label>
                    <select
                        id="date-sort"
                        value={sortDate}
                        onChange={(e) => setSortDate(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="newest">Mais novos primeiro</option>
                        <option value="oldest">Mais velhos primeiro</option>
                    </select>
                </div>
            </div>

            {/* Secção de formulários */}
            <div className="rounded-lg flex-1 flex flex-col">
                {isLoading ? (
                    <div className="text-center py-12 text-text">
                        A carregar formulários...
                    </div>
                ) : filteredAndSortedForms.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
                        <p className="text-xl font-semibold text-text-h">
                            Nenhum formulário publicado encontrado
                        </p>
                        <p className="mt-2 text-text">
                            Tenta ajustar os filtros ou publica um formulário.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid auto-rows-max gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {paginatedForms.map((form) => {
                                const id = form.id || form.Id;
                                const title = form.title || form.Title || 'Sem título';
                                const description = form.description || form.Description || 'Sem descrição';

                                return (
                                    <div
                                        key={id}
                                        className="rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <h3 className="font-bold text-lg text-text-h">
                                                {title}
                                            </h3>

                                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                Publicado
                                            </span>
                                        </div>

                                        <p className="text-sm text-text mt-2">
                                            {description}
                                        </p>

                                        <button
                                            onClick={() => handleDelete(id)}
                                            className="mt-4 text-red-500 hover:text-red-700 transition-colors"
                                            title="Eliminar"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Paginação */}
                        <div className="mt-auto pt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-md border border-accent-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="text-sm text-text">
                                Página {currentPage} de {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-md border border-accent-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Próxima
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}