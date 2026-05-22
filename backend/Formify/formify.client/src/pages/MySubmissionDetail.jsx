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

const isEmpty = (value) =>
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

function AnswerValue({ field, value }) {
    const type = (field.type || field.Type || 'text').toLowerCase();

    if (isEmpty(value)) {
        return <p className="text-sm italic text-gray-400">Sem resposta</p>;
    }

    switch (type) {
        case 'textarea':
            return (
                <p className="whitespace-pre-wrap text-sm text-text-h">
                    {String(value)}
                </p>
            );

        case 'checkbox': {
            const items = Array.isArray(value) ? value : [value];
            return (
                <ul className="space-y-1">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-text-h">
                            <span
                                className="flex h-4 w-4 items-center justify-center rounded border border-accent bg-accent text-[10px] text-white"
                                aria-hidden="true"
                            >
                                ✓
                            </span>
                            {String(item)}
                        </li>
                    ))}
                </ul>
            );
        }

        case 'radio':
        case 'dropdown':
            return (
                <span className="inline-flex items-center rounded-md bg-accent-bg px-3 py-1 text-sm font-medium text-accent">
                    {String(value)}
                </span>
            );

        case 'date': {
            let formatted = String(value);
            try {
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    formatted = d.toLocaleDateString('pt-PT');
                }
            } catch {
                // mantém o valor original
            }
            return <p className="text-sm text-text-h">{formatted}</p>;
        }

        default:
            return <p className="text-sm text-text-h">{String(value)}</p>;
    }
}

function TableAnswer({ field, answers }) {
    const columns = field.options || field.Options || [];
    const rowCount = field.tableRowCount || field.TableRowCount || 1;
    const fId = field.id || field.Id;

    return (
        <div className="overflow-x-auto rounded-lg border border-accent-border">
            <table className="w-full border-collapse text-sm">
                <thead className="bg-accent-bg/40">
                    <tr>
                        <th className="border-b border-accent-border px-3 py-2 text-center text-xs font-semibold text-text-h">
                            Nº
                        </th>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className="border-b border-accent-border px-3 py-2 text-left text-xs font-semibold text-text-h"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rowCount }).map((_, r) => (
                        <tr key={r} className="border-b border-gray-100 last:border-b-0">
                            <td className="px-3 py-2 text-center text-xs text-text">
                                {r + 1}
                            </td>
                            {columns.map((_, c) => {
                                const cellId = `${fId}-r${r}-c${c}`;
                                const cell = answers[cellId];
                                return (
                                    <td key={c} className="px-3 py-2 text-sm text-text-h">
                                        {isEmpty(cell) ? (
                                            <span className="italic text-gray-400">—</span>
                                        ) : (
                                            String(cell)
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

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

    // Respostas com chaves que não correspondem a nenhum campo do formulário
    // (por ex. células de tabela, cujo id é "<fieldId>-r<x>-c<y>"). Estas
    // ficam de fora do fluxo normal e só aparecem se houver respostas órfãs.
    const fieldIds = new Set(fields.map((f) => f.id || f.Id));
    const tableCellPrefixes = fields
        .filter((f) => (f.type || f.Type) === 'table')
        .map((f) => `${f.id || f.Id}-r`);

    const orphanAnswers = Object.entries(answers).filter(([key]) => {
        if (fieldIds.has(key)) return false;
        // Ignora chaves de células de tabela conhecidas; já são renderizadas
        // dentro do componente da tabela.
        return !tableCellPrefixes.some((p) => key.startsWith(p));
    });

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
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-bg px-3 py-1 text-sm font-semibold text-accent">
                                {data.status || 'Submetido'}
                            </span>
                            {data.isStale && (
                                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                    Desatualizado
                                </span>
                            )}
                            {data.formArchived && (
                                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                    Arquivado
                                </span>
                            )}
                        </div>
                    </div>

                    {data.isStale && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <strong>Nota:</strong> este formulário foi alterado pelo administrador depois da tua
                            submissão (versão atual <strong>{data.currentFormVersion}</strong>, versão da tua
                            resposta <strong>{data.formVersion}</strong>). As perguntas e respostas mostradas em baixo
                            podem não corresponder exatamente à versão atual do formulário.
                        </div>
                    )}

                    {data.formArchived && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                            <strong>Nota:</strong> este formulário foi arquivado pelo administrador e já não está
                            disponível para novas submissões. A tua resposta continua acessível como histórico.
                        </div>
                    )}

                    <div className="rounded-lg border border-accent-border bg-white p-4 text-sm text-text">
                        <span className="font-semibold text-text-h">Submetido a:</span>{' '}
                        {formatDate(data.submittedAt)}
                    </div>

                    {/* Respostas com o mesmo layout em grid do formulário original */}
                    <div className="rounded-lg border border-accent-border bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="mb-6 border-b border-accent-border pb-4 text-lg font-bold text-text-h">
                            Respostas
                        </h3>

                        {fields.length === 0 && orphanAnswers.length === 0 ? (
                            <p className="py-4 text-center text-text">
                                Esta submissão não tem respostas registadas.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                                {fields.map((field) => {
                                    const type = (field.type || field.Type || 'text').toLowerCase();
                                    const fId = field.id || field.Id;
                                    const label = field.label || field.Label || fId;
                                    const width = field.width || field.Width || 'full';
                                    const isHalf = width === 'half' && type !== 'section';
                                    const span = isHalf ? 'sm:col-span-1' : 'col-span-1 sm:col-span-2';

                                    if (type === 'section') {
                                        return (
                                            <div key={fId} className="col-span-1 mt-4 sm:col-span-2">
                                                <div className="flex items-center gap-4">
                                                    <h4 className="whitespace-nowrap text-sm font-bold uppercase tracking-widest text-text-h">
                                                        {label}
                                                    </h4>
                                                    <div className="h-px w-full bg-accent-border" />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={fId} className={`${span} flex flex-col gap-2`}>
                                            <label className="text-sm font-semibold text-text-h">
                                                {label}
                                            </label>
                                            {type === 'table' ? (
                                                <TableAnswer field={field} answers={answers} />
                                            ) : (
                                                <div className="rounded-md border border-accent-border bg-accent-bg/30 p-3">
                                                    <AnswerValue field={field} value={answers[fId]} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {orphanAnswers.length > 0 && (
                                    <div className="col-span-1 mt-6 border-t border-accent-border pt-6 sm:col-span-2">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text">
                                            Outras respostas
                                        </p>
                                        <dl className="space-y-2">
                                            {orphanAnswers.map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4"
                                                >
                                                    <dt className="text-sm font-semibold text-text-h">{key}</dt>
                                                    <dd className="whitespace-pre-wrap text-sm text-text sm:col-span-2">
                                                        {Array.isArray(value)
                                                            ? value.join(', ')
                                                            : typeof value === 'object'
                                                                ? JSON.stringify(value)
                                                                : String(value)}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}
