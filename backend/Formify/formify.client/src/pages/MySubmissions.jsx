import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5208/api/Submissions/me';

const normalizeText = (value) =>
    (value || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const formatDate = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
};

export default function MySubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortDate, setSortDate] = useState('newest');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                const response = await fetch(API_URL, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (response.status === 401) {
                    setError('Sessão expirada. Inicia sessão novamente.');
                    setSubmissions([]);
                    return;
                }

                if (!response.ok) throw new Error('Erro ao obter submissões');

                const data = await response.json();
                setSubmissions(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Erro ao carregar submissões:', e);
                setError('Não foi possível carregar as tuas submissões.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    const filteredAndSorted = useMemo(() => {
        const term = normalizeText(searchTerm.trim());

        const filtered = submissions.filter((s) => {
            if (!term) return true;
            const title = normalizeText(s.formTitle);
            const description = normalizeText(s.formDescription);
            const tokens = term.split(/\s+/).filter(Boolean);
            const words = `${title} ${description}`.split(/[^a-z0-9]+/).filter(Boolean);
            return tokens.every((tok) => words.some((w) => w.startsWith(tok)));
        });

        return [...filtered].sort((a, b) => {
            const dateA = new Date(a.submittedAt || 0).getTime();
            const dateB = new Date(b.submittedAt || 0).getTime();
            return sortDate === 'oldest' ? dateA - dateB : dateB - dateA;
        });
    }, [submissions, searchTerm, sortDate]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortDate]);

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-8 flex flex-col">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-text-h">Os meus formulários</h2>
                <p className="text-lg text-text">Histórico de formulários que já preencheste</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 my-2">
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-text-h">Pesquisar</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nome do formulário..."
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-accent focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-text-h">Ordenar por</label>
                    <select
                        value={sortDate}
                        onChange={(e) => setSortDate(e.target.value)}
                        className="rounded-md border border-accent-border bg-white p-2 focus:border-accent focus:outline-none"
                    >
                        <option value="newest">Mais recentes</option>
                        <option value="oldest">Mais antigos</option>
                    </select>
                </div>
            </div>

            <div className="rounded-lg flex-1 flex flex-col">
                {isLoading ? (
                    <div className="text-center py-12 text-text">A carregar submissões...</div>
                ) : error ? (
                    <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50 px-8 py-12 text-center">
                        <p className="text-xl font-semibold text-red-700">{error}</p>
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
                        <p className="text-xl font-semibold text-text-h">Ainda não preencheste formulários</p>
                        <p className="mt-2 text-text">As tuas submissões vão aparecer aqui assim que responderes ao primeiro formulário.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {paginated.map((s) => (
                                <Link
                                    key={s.id}
                                    to={`/meus-formularios/${s.id}`}
                                    className="group flex flex-col h-full rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md hover:border-accent transition-all bg-white"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="font-bold text-lg text-text-h group-hover:text-accent transition-colors">
                                            {s.formTitle}
                                        </h3>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className="rounded-full bg-accent-bg px-3 py-1 text-xs font-semibold text-accent">
                                                {s.status || 'Submetido'}
                                            </span>
                                            {s.isStale && (
                                                <span
                                                    className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200"
                                                    title="O formulário foi alterado desde a tua submissão"
                                                >
                                                    Desatualizado
                                                </span>
                                            )}
                                            {s.formArchived && (
                                                <span
                                                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 border border-gray-200"
                                                    title="O formulário já não está disponível"
                                                >
                                                    Arquivado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {s.formDescription && (
                                        <p className="text-sm text-text line-clamp-3 flex-grow">{s.formDescription}</p>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                                        <span className="text-xs text-text">{formatDate(s.submittedAt)}</span>
                                        <span className="text-sm font-semibold text-accent group-hover:text-emerald-700">
                                            Ver detalhes →
                                        </span>
                                    </div>
                                </Link>
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
