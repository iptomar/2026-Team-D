import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TABS = [
    { key: 'published', label: 'Publicados', emptyHint: 'Nenhum formulário publicado.' },
    { key: 'draft', label: 'Rascunhos', emptyHint: 'Nenhum rascunho.' },
    { key: 'archived', label: 'Arquivados', emptyHint: 'Sem formulários arquivados.' },
];

// Lista oficial de categorias baseada na Issue #181
const CATEGORIAS = [
    "Académicos", "Secretaria", "Recursos Humanos",
    "Pedidos Internos", "Declarações", "Requerimentos", "Geral"
];

const normalizeText = (value) =>
    (value || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const getStatus = (form) => (form.status || form.Status || 'Draft').toString().toLowerCase();

const getAudienceList = (form) => {
    const raw = form.audience || form.Audience || [];
    return Array.isArray(raw) ? raw.map(normalizeText) : [normalizeText(raw)];
};

const matchesCargo = (form, cargo) => {
    if (cargo === 'todos') return true;
    const audience = getAudienceList(form);

    const hasTeacher = audience.includes('teacher') || audience.includes('professor') || audience.includes('professores');
    const hasStaff = audience.includes('staff') || audience.includes('funcionario') || audience.includes('funcionarios');
    const hasStudent = audience.includes('aluno') || audience.includes('alunos') || audience.includes('student');

    if (cargo === 'professores') return hasTeacher;
    if (cargo === 'funcionarios') return hasStaff;
    if (cargo === 'alunos') return hasStudent;
    return true;
};

export default function AdminDashboard() {
    const navigate = useNavigate();

    // Tab ativa: 'published' | 'draft' | 'archived'
    const [activeTab, setActiveTab] = useState('published');

    // Estatísticas (dados em tempo real do backend)
    const [stats, setStats] = useState({
        totalForms: 0,
        publishedForms: 0,
        draftedForms: 0,
        archivedForms: 0,
    });
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filtros
    const [selectedCargo, setSelectedCargo] = useState('todos');
    const [selectedCategory, setSelectedCategory] = useState('todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDate, setSortDate] = useState('newest');

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const formsPerPage = 12;

    const loadStats = async () => {
        try {
            setIsStatsLoading(true);
            const res = await fetch('http://localhost:5208/api/Forms/stats');
            if (!res.ok) throw new Error('Erro ao obter estatísticas');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Erro a carregar stats:', err);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const loadForms = async (tab) => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5208/api/Forms?status=${tab}`);
            if (!response.ok) throw new Error('Erro ao procurar formulários');
            const data = await response.json();
            setForms(data);
        } catch (error) {
            console.error('Erro na integração:', error);
            setForms([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        loadForms(activeTab);
        setCurrentPage(1);
    }, [activeTab]);

    const filteredAndSortedForms = useMemo(() => {
        const filtered = forms
            .filter((form) => matchesCargo(form, selectedCargo))
            .filter((form) => {
                if (selectedCategory === 'todas') return true;
                const formCat = (form.category || form.Category || 'Geral').toLowerCase();
                return formCat === selectedCategory.toLowerCase();
            })
            .filter((form) => {
                const term = normalizeText(searchTerm.trim());
                if (!term) return true;

                const title = normalizeText(form.title || form.Title || '');
                const description = normalizeText(form.description || form.Description || '');
                const searchableText = `${title} ${description}`;

                const tokens = term.split(/\s+/).filter(Boolean);
                const words = searchableText.split(/[^a-z0-9]+/).filter(Boolean);
                return tokens.every((token) => words.some((word) => word.startsWith(token)));
            });

        return [...filtered].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.CreatedAt || 0).getTime();
            const dateB = new Date(b.createdAt || b.CreatedAt || 0).getTime();
            return sortDate === 'oldest' ? dateA - dateB : dateB - dateA;
        });
    }, [forms, selectedCargo, selectedCategory, searchTerm, sortDate]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedForms.length / formsPerPage));
    const paginatedForms = filteredAndSortedForms.slice(
        (currentPage - 1) * formsPerPage,
        currentPage * formsPerPage,
    );

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    // O useEffect agora "ouve" as mudanças da categoria também
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCargo, selectedCategory, sortDate]);

    const removeFormFromList = (id) =>
        setForms((prev) => prev.filter((f) => (f.id ?? f.Id) !== id));

    const handleDelete = async (id) => {
        if (!window.confirm('Tens a certeza que queres eliminar este formulário?')) return;
        try {
            const response = await fetch(`http://localhost:5208/api/Forms/${id}`, { method: 'DELETE' });
            if (response.ok) {
                removeFormFromList(id);
                loadStats();
            } else {
                alert('Erro ao eliminar formulário.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível ligar ao servidor.');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const response = await fetch(`http://localhost:5208/api/Forms/${id}/duplicate`, { method: 'POST' });
            if (!response.ok) throw new Error('Erro ao duplicar formulário');
            const copy = await response.json();
            alert(`Cópia criada em rascunho: "${copy.title || copy.Title}".`);
            loadStats();
            if (activeTab === 'draft') {
                setForms((prev) => [copy, ...prev]);
            }
        } catch (error) {
            console.error('Erro ao duplicar:', error);
            alert('Não foi possível duplicar o formulário.');
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Tens a certeza que queres arquivar este formulário?')) return;
        try {
            const response = await fetch(`http://localhost:5208/api/Forms/${id}/archive`, { method: 'PATCH' });
            if (!response.ok) throw new Error('Erro ao arquivar');
            removeFormFromList(id);
            loadStats();
        } catch (error) {
            console.error('Erro ao arquivar:', error);
            alert('Não foi possível arquivar o formulário.');
        }
    };

    const handleUnarchive = async (id) => {
        if (!window.confirm('Reativar este formulário? Vai voltar para rascunhos para validação.')) return;
        try {
            const response = await fetch(`http://localhost:5208/api/Forms/${id}/unarchive`, { method: 'PATCH' });
            if (!response.ok) throw new Error('Erro ao reativar');
            removeFormFromList(id);
            loadStats();
        } catch (error) {
            console.error('Erro ao reativar:', error);
            alert('Não foi possível reativar o formulário.');
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-8 flex flex-col">
            {/* Cabeçalho */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-text-h">Formulários</h2>
                    <p className="mt-2 text-lg text-text">Gestão dos formulários da plataforma</p>
                </div>

                <Link
                    to="/CreateForm"
                    className="inline-flex w-fit items-center justify-center rounded-md bg-accent px-5 py-2 font-semibold text-white transition-all hover:bg-emerald-700"
                >
                    + Novo Formulário
                </Link>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Publicados" value={isStatsLoading ? '—' : stats.publishedForms} hint="Disponíveis para preenchimento" />
                <StatCard label="Rascunhos" value={isStatsLoading ? '—' : stats.draftedForms} hint="Em preparação pela administração" accent="amber" />
                <StatCard label="Arquivados" value={isStatsLoading ? '—' : stats.archivedForms} hint="Fora de circulação" accent="gray" />
            </div>

            {/* Tabs */}
            <div className="border-b border-accent-border">
                <nav className="-mb-px flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${isActive
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-text hover:border-accent-border hover:text-text-h'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Filtros */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="search-form" className="font-medium text-text-h">Pesquisar</label>
                    <input
                        id="search-form"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nome ou palavras-chave"
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-accent focus:outline-none"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="category-filter" className="font-medium text-text-h">Categoria</label>
                    <select
                        id="category-filter"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-accent focus:outline-none"
                    >
                        <option value="todas">Todas as categorias</option>
                        {CATEGORIAS.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="cargo-filter" className="font-medium text-text-h">Cargo</label>
                    <select
                        id="cargo-filter"
                        value={selectedCargo}
                        onChange={(e) => setSelectedCargo(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-accent focus:outline-none"
                    >
                        <option value="todos">Todos</option>
                        <option value="professores">Professores</option>
                        <option value="funcionarios">Funcionários</option>
                        <option value="alunos">Alunos</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="date-sort" className="font-medium text-text-h">Data de criação</label>
                    <select
                        id="date-sort"
                        value={sortDate}
                        onChange={(e) => setSortDate(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-accent focus:outline-none"
                    >
                        <option value="newest">Mais novos primeiro</option>
                        <option value="oldest">Mais velhos primeiro</option>
                    </select>
                </div>
            </div>

            {/* Listagem */}
            <div className="rounded-lg flex-1 flex flex-col">
                {isLoading ? (
                    <div className="text-center py-12 text-text">A carregar formulários...</div>
                ) : filteredAndSortedForms.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
                        <p className="text-xl font-semibold text-text-h">Nenhum formulário encontrado</p>
                        <p className="mt-2 text-text">
                            {TABS.find((t) => t.key === activeTab)?.emptyHint}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {paginatedForms.map((form) => (
                                <FormCard
                                    key={form.id ?? form.Id}
                                    form={form}
                                    tab={activeTab}
                                    onOpen={(id) => navigate(`/ViewForm/${id}`)}
                                    onEdit={(id) => navigate(`/edit-form/${id}`)}
                                    onDuplicate={handleDuplicate}
                                    onArchive={handleArchive}
                                    onUnarchive={handleUnarchive}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-auto pt-6 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-md border border-accent-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-text">Página {currentPage} de {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-md border border-accent-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, hint, accent }) {
    const valueClass =
        accent === 'amber' ? 'text-amber-600'
            : accent === 'gray' ? 'text-gray-600'
                : 'text-accent';
    return (
        <div className="rounded-lg border border-accent-border p-6 bg-white">
            <h3 className="text-sm font-medium text-text-h">{label}</h3>
            <p className="text-xs text-text mt-1">{hint}</p>
            <div className={`mt-4 text-3xl font-bold ${valueClass}`}>{value}</div>
        </div>
    );
}

function FormCard({ form, tab, onOpen, onEdit, onDuplicate, onArchive, onUnarchive, onDelete }) {
    const id = form.id ?? form.Id;
    const title = form.title || form.Title || 'Sem título';
    const description = form.description || form.Description || 'Sem descrição';
    const status = getStatus(form);

    const category = form.category || form.Category || 'Geral';

    const badge = {
        published: 'bg-green-50 text-green-700 border-green-100',
        draft: 'bg-amber-50 text-amber-700 border-amber-100',
        archived: 'bg-gray-100 text-gray-600 border-gray-200',
    }[status] || 'bg-gray-100 text-gray-600 border-gray-200';

    const badgeLabel = { published: 'Publicado', draft: 'Rascunho', archived: 'Arquivado' }[status] || status;

    const stop = (handler) => (e) => {
        e.stopPropagation();
        handler();
    };

    return (
        <div
            onClick={() => onOpen(id)}
            className="group flex flex-col h-full rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md hover:border-accent transition-all cursor-pointer bg-white"
        >
            <div className="mb-2">
                <span className="inline-block rounded-full bg-blue-50 border border-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    {category}
                </span>
            </div>

            <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="font-bold text-lg text-text-h group-hover:text-accent transition-colors">
                    {title}
                </h3>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${badge}`}>
                    {badgeLabel}
                </span>
            </div>

            <p className="text-sm text-text mt-2 line-clamp-3 flex-grow">{description}</p>

            <div className="mt-4 flex flex-wrap justify-end gap-x-4 gap-y-2 border-t border-accent-border pt-4">
                {tab === 'archived' ? (
                    <>
                        <button
                            onClick={stop(() => onUnarchive(id))}
                            className="text-sm font-semibold text-accent transition-colors hover:opacity-80"
                        >
                            ↺ Desarquivar
                        </button>
                        <button
                            onClick={stop(() => onDelete(id))}
                            className="text-sm font-semibold text-red-500 transition-colors hover:text-red-700"
                        >
                            Eliminar
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={stop(() => onEdit(id))}
                            className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                        >
                            Editar
                        </button>
                        <button
                            onClick={stop(() => onDuplicate(id))}
                            className="text-sm font-semibold text-text transition-colors hover:text-accent"
                        >
                            Duplicar
                        </button>
                        <button
                            onClick={stop(() => onArchive(id))}
                            className="text-sm font-semibold text-gray-600 transition-colors hover:text-gray-800"
                        >
                            Arquivar
                        </button>
                        <button
                            onClick={stop(() => onDelete(id))}
                            className="text-sm font-semibold text-red-500 transition-colors hover:text-red-700"
                        >
                            Eliminar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}