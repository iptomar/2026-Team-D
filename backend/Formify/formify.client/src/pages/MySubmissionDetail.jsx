import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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

const formatAnswer = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
};

export default function MySubmissionDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5208/api/Submissions/me/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (response.status === 401) {
                    setError('Sessão expirada. Inicia sessão novamente.');
                    return;
                }
                if (response.status === 403) {
                    setError('Não tens permissão para ver esta submissão.');
                    return;
                }
                if (response.status === 404) {
                    setError('Submissão não encontrada.');
                    return;
                }
                if (!response.ok) throw new Error('Erro ao obter detalhe');

                const json = await response.json();
                setData(json);
            } catch (e) {
                console.error('Erro ao carregar detalhe:', e);
                setError('Não foi possível carregar o detalhe da submissão.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const fields = data?.form?.fields || data?.form?.Fields || [];
    const answers = data?.answers || {};

    // Constrói linhas (pergunta, resposta) percorrendo os campos do formulário pela
    // ordem original. Para garantir cobertura, depois acrescenta respostas extra
    // cuja chave não corresponda a nenhum campo conhecido.
    const knownIds = new Set(fields.map((f) => f.id || f.Id));
    const orderedRows = fields
        .filter((f) => (f.type || f.Type) !== 'section')
        .map((f) => {
            const fid = f.id || f.Id;
            return {
                key: fid,
                label: f.label || f.Label || fid,
                value: answers[fid],
            };
        });
    const extraRows = Object.entries(answers)
        .filter(([k]) => !knownIds.has(k))
        .map(([k, v]) => ({ key: k, label: k, value: v }));

    const rows = [...orderedRows, ...extraRows];

    return (
        <div className="space-y-6">
            <Link
                to="/meus-formularios"
                className="inline-flex w-fit items-center gap-2 font-semibold text-accent transition-all hover:opacity-80"
            >
                ← Voltar
            </Link>

            {isLoading ? (
                <div className="text-center py-12 text-text">A carregar detalhe...</div>
            ) : error ? (
                <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50 px-8 py-12 text-center">
                    <p className="text-xl font-semibold text-red-700">{error}</p>
                </div>
            ) : data ? (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-text-h">
                                {data.form?.title || data.form?.Title || '(Formulário removido)'}
                            </h2>
                            {(data.form?.description || data.form?.Description) && (
                                <p className="mt-2 text-text">
                                    {data.form?.description || data.form?.Description}
                                </p>
                            )}
                        </div>
                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent-bg px-3 py-1 text-sm font-semibold text-accent">
                            {data.status || 'Submetido'}
                        </span>
                    </div>

                    <div className="rounded-lg border border-accent-border bg-white p-4 text-sm text-text">
                        <span className="font-semibold text-text-h">Submetido a:</span>{' '}
                        {formatDate(data.submittedAt)}
                    </div>

                    <div className="rounded-lg border border-accent-border bg-white shadow-sm">
                        <h3 className="border-b border-accent-border px-6 py-4 text-lg font-bold text-text-h">
                            Respostas
                        </h3>

                        {rows.length === 0 ? (
                            <p className="px-6 py-8 text-center text-text">Esta submissão não tem respostas registadas.</p>
                        ) : (
                            <dl className="divide-y divide-gray-100">
                                {rows.map((row) => (
                                    <div key={row.key} className="grid gap-1 px-6 py-4 sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-semibold text-text-h sm:col-span-1">{row.label}</dt>
                                        <dd className="whitespace-pre-wrap text-sm text-text sm:col-span-2">
                                            {formatAnswer(row.value)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}
