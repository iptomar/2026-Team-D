import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * AdminDashboard Component Unificado
 * Serve tanto para listar Formulários Publicados como Rascunhos.
 */
export default function AdminDashboard({ isDraft = false }) {
    // Lista de formulários carregados a partir do backend
    const [forms, setForms] = useState([]);

    // Estado de carregamento da página
    const [isLoading, setIsLoading] = useState(true);

    // Filtros da listagem
    const [selectedCargo, setSelectedCargo] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDate, setSortDate] = useState('newest');

    // Mensagem de confirmação
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        id: null
    });

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const formsPerPage = 12;

    const navigate = useNavigate();

    // ─── Textos Dinâmicos ───
    // Mudam dependendo se estamos a ver Rascunhos (isDraft = true) ou Publicados
    const pageTitle = isDraft ? "Formulários em Rascunho" : "Formulários";
    const pageSubtitle = isDraft ? "Listagem dos formulários por concluir" : "Listagem dos formulários publicados";
    const emptyMessage = isDraft ? "Nenhum rascunho encontrado" : "Nenhum formulário publicado encontrado";

    // Carrega os formulários quando a página é aberta
    useEffect(() => {
        const fetchForms = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('http://localhost:5208/api/Forms');

                if (!response.ok) {
                    throw new Error('Erro ao procurar formulários');
                }

                const data = await response.json();
                setForms(data);
            } catch (error) {
                console.error('Erro na integração:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForms();
    }, []);

    const normalizeText = (value) =>
        (value || '')
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    // ─── Filtro Magno ───
    // Verifica se o formulário corresponde ao separador atual (Rascunho vs Publicado)
    const isTargetStatus = (form) => {
        const statusDrafted = form.statusDrafted ?? form.StatusDrafted;
        return statusDrafted === isDraft;
    };

    const getAudience = (form) => {
        const rawAudience = form.audience || form.Audience || [];

        if (Array.isArray(rawAudience)) {
            return rawAudience.map(normalizeText);
        }

        return [normalizeText(rawAudience)];
    };

    const matchesCargo = (form) => {
        if (selectedCargo === 'todos') return true;

        const audience = getAudience(form);

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

    const filteredForms = forms
        .filter(isTargetStatus) // Agora filtra com base no isDraft!
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

    const filteredAndSortedForms = [...filteredForms].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.CreatedAt || 0).getTime();

        if (sortDate === 'oldest') {
            return dateA - dateB;
        }

        return dateB - dateA;
    });

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedForms.length / formsPerPage));
    const indexOfLastForm = currentPage * formsPerPage;
    const indexOfFirstForm = indexOfLastForm - formsPerPage;
    const paginatedForms = filteredAndSortedForms.slice(indexOfFirstForm, indexOfLastForm);

    // Repõe a página a 1 se mudarmos de separador (isDraft) ou alterarmos filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCargo, sortDate, isDraft]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const confirmMoveToDraft = async () => {
        const id = confirmModal.id;

        try {
            const form = forms.find(f => (f.id === id || f.Id === id));

            const response = await fetch(`http://localhost:5208/api/Forms/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...form,
                    statusDrafted: true
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar formulário');
            }

            setForms((prev) =>
                prev.map((f) =>
                    (f.id === id || f.Id === id)
                        ? { ...f, statusDrafted: true }
                        : f
                )
            );

            setConfirmModal({ open: false, id: null });

        } catch (error) {
            console.error(error);
            alert('Erro ao mover para rascunho');
        }
    };

    const handleDelete = async (id) => {
        const confirmacao = window.confirm('Tens a certeza que queres eliminar este formulário?');

        if (!confirmacao) return;

        try {
            const response = await fetch(`http://localhost:5208/api/Forms/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
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
                    {/* Títulos dinâmicos baseados no state isDraft */}
                    <h2 className="text-3xl font-bold text-text-h">{pageTitle}</h2>
                    <p className="mt-2 text-lg text-text">
                        {pageSubtitle}
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
            <div className="grid gap-4 sm:grid-cols-3 my-6">
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
                            {emptyMessage}
                        </p>
                        <p className="mt-2 text-text">
                            Tenta ajustar os filtros ou publica um formulário.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {paginatedForms.map((form) => {
                                const id = form.id || form.Id;
                                const title = form.title || form.Title || 'Sem título';
                                const description = form.description || form.Description || 'Sem descrição';

                                return (
                                    <div
                                        key={id}
                                        onClick={() => navigate(`/ViewForm/${id}`)}
                                        className="group flex flex-col h-full rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer bg-white"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <h3 className="font-bold text-lg text-text-h group-hover:text-green-700 transition-colors">
                                                {title}
                                            </h3>

                                            {/* Etiqueta Visual Dinâmica */}
                                            {isDraft ? (
                                                <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                                                    Rascunho
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700 border border-green-100">
                                                    Publicado
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-text mt-2 line-clamp-3 flex-grow">
                                            {description}
                                        </p>

                                        <div className="mt-4 flex justify-end gap-4 border-t border-accent-border pt-4 mt-auto">
                                            {isDraft ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/edit-form/${id}`);
                                                    }}
                                                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                                                >
                                                    ✏️ Editar
                                                </button>
                                            ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmModal({ open: true, id });
                                                        }}
                                                        className="flex items-center gap-1 text-sm font-semibold text-yellow-600 transition-colors hover:text-yellow-800"
                                                    >
                                                        ↩️ Tornar Rascunho
                                                    </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(id);
                                                }}
                                                className="flex items-center gap-1 text-sm font-semibold text-red-500 transition-colors hover:text-red-700"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
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
            {confirmModal.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
                        <h2 className="text-lg font-bold text-text-h">
                            Confirmar ação
                        </h2>

                        <p className="mt-2 text-text">
                            Tens a certeza que queres mover este formulário para rascunho?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal({ open: false, id: null })}
                                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={confirmMoveToDraft}
                                className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}