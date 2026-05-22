import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfessorDashboard() {
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortDate, setSortDate] = useState('newest');

    const [currentPage, setCurrentPage] = useState(1);
    const formsPerPage = 12;

    const navigate = useNavigate();

    useEffect(() => {
        const fetchForms = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('http://localhost:5208/api/Forms');
                if (!response.ok) throw new Error('Erro ao procurar formulários');

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
        (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const filteredForms = forms
        .filter(form => ((form.status || form.Status || '').toString().toLowerCase()) === 'published')
        .filter(form => {
            const rawAudience = form.audience || form.Audience || [];
            const audienceArray = Array.isArray(rawAudience) ? rawAudience.map(normalizeText) : [normalizeText(rawAudience)];

            return audienceArray.includes('teacher') ||
                audienceArray.includes('professor') ||
                audienceArray.includes('professores');
        })
        .filter(form => {
            const term = normalizeText(searchTerm.trim());
            if (!term) return true;

            const title = normalizeText(form.title || form.Title || '');
            const description = normalizeText(form.description || form.Description || '');
            const searchableText = `${title} ${description}`;

            const tokens = term.split(/\s+/).filter(Boolean);
            const words = searchableText.split(/[^a-z0-9]+/).filter(Boolean);

            return tokens.every(token => words.some(word => word.startsWith(token)));
        });

    const filteredAndSortedForms = [...filteredForms].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.CreatedAt || 0).getTime();
        return sortDate === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedForms.length / formsPerPage));
    const paginatedForms = filteredAndSortedForms.slice((currentPage - 1) * formsPerPage, currentPage * formsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortDate]);

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-8 flex flex-col">
            <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-text-h">Área do Docente</h2>
                <p className="text-lg text-text">Formulários disponíveis para preenchimento</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 my-6">
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-text-h">Pesquisar</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nome do formulário..."
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-text-h">Ordenar por</label>
                    <select
                        value={sortDate}
                        onChange={(e) => setSortDate(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="newest">Mais recentes</option>
                        <option value="oldest">Mais antigos</option>
                    </select>
                </div>
            </div>

            <div className="rounded-lg flex-1 flex flex-col">
                {isLoading ? (
                    <div className="text-center py-12 text-text">A carregar formulários...</div>
                ) : filteredAndSortedForms.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
                        <p className="text-xl font-semibold text-text-h">Nenhum formulário disponível</p>
                        <p className="mt-2 text-text">De momento não existem formulários para o seu cargo.</p>
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
                                        onClick={() => navigate(`/respond/${id}`)}
                                        className="group flex flex-col h-full rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-white"
                                    >
                                        <h3 className="font-bold text-lg text-text-h group-hover:text-blue-600 transition-colors mb-3">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-text line-clamp-3 flex-grow">{description}</p>

                                        <div className="mt-4 pt-4 border-t border-gray-100 mt-auto">
                                            <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-2">
                                                Responder →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

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
                    </>
                )}
            </div>
        </div>
    );
}