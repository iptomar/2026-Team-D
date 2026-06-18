import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RespondForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [tableRowCounts, setTableRowCounts] = useState({});

    const currentUser = localStorage.getItem('username') || 'Utilizador';
    const currentRole = localStorage.getItem('role') || 'Role';

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await fetch(`/api/Forms/${id}`);
                if (!response.ok) throw new Error('Formulário não encontrado.');

                const data = await response.json();

                // Só formulários publicados aceitam respostas (não rascunhos nem arquivados)
                const status = (data.status || data.Status || '').toString().toLowerCase();
                if (status !== 'published') {
                    const message = status === 'archived'
                        ? 'Este formulário foi arquivado e já não aceita respostas.'
                        : 'Este formulário não aceita respostas.';
                    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'error' } }));
                    navigate(-1);
                    return;
                }

                // Normalizar os campos retornados pela API
                const initialRowCounts = {};
                const fieldsNormalizados = (data.fields || data.Fields || []).map(f => {
                    const type = (f.type || f.Type || 'text').toLowerCase();
                    const widthFormatado = f.width || f.Width || 'full';
                    const fId = f.id || f.Id;

                    if (type === 'table') {
                        const rows = f.tableRowCount || f.TableRowCount || f.tableRows || 1;
                        initialRowCounts[fId] = rows;
                        return {
                            ...f,
                            id: fId,
                            type: 'table',
                            width: widthFormatado,
                            tableColumns: f.options || f.Options || [],
                            tableRows: rows
                        };
                    }

                    return {
                        ...f,
                        id: fId,
                        type: type,
                        width: widthFormatado,
                        options: f.options || f.Options || []
                    };
                });

                setFormData({ ...data, fields: fieldsNormalizados });
                setTableRowCounts(initialRowCounts);

                // Preparar objeto de respostas vazio
                const initialAnswers = {};
                fieldsNormalizados.forEach(field => {
                    if (field.type !== 'section') {
                        initialAnswers[field.id] = field.type === 'checkbox' ? [] : '';
                    }
                });
                setAnswers(initialAnswers);

            } catch (error) {
                console.error(error);
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Erro ao carregar o formulário.', type: 'error' } }));
                navigate(-1);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchForm();
    }, [id, navigate]);

    const handleAddRow = (fieldId) => {
        setTableRowCounts(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] || 1) + 1
        }));
    };

    const handleRemoveRow = (fieldId, rIndex, columnsCount) => {
        const currentRows = tableRowCounts[fieldId] || 1;
        if (currentRows <= 1) return;

        setTableRowCounts(prev => ({
            ...prev,
            [fieldId]: currentRows - 1
        }));

        setAnswers(prev => {
            const newAnswers = { ...prev };
            // Shift values for subsequent rows up
            for (let r = rIndex; r < currentRows; r++) {
                for (let c = 0; c < columnsCount; c++) {
                    const currentCellId = `${fieldId}-r${r}-c${c}`;
                    const nextCellId = `${fieldId}-r${r + 1}-c${c}`;
                    
                    if (r === currentRows - 1) {
                        delete newAnswers[currentCellId];
                    } else {
                        if (prev[nextCellId] !== undefined) {
                            newAnswers[currentCellId] = prev[nextCellId];
                        } else {
                            delete newAnswers[currentCellId];
                        }
                    }
                }
            }
            return newAnswers;
        });
    };

    // Atualiza o estado das respostas à medida que o utilizador escreve
    const handleAnswerChange = (fieldId, value, type = 'text') => {
        setAnswers(prev => {
            if (type === 'checkbox') {
                const currentArray = prev[fieldId] || [];
                if (currentArray.includes(value)) {
                    return { ...prev, [fieldId]: currentArray.filter(v => v !== value) };
                } else {
                    return { ...prev, [fieldId]: [...currentArray, value] };
                }
            }
            return { ...prev, [fieldId]: value };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            
            const token = localStorage.getItem('token');

            
            const response = await fetch(`http://localhost:5208/api/Forms/${id}/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(answers) 
            });

            if (response.ok) {
               
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Respostas submetidas com sucesso!', type: 'success' } }));
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Por favor aguarde aprovação do seu pedido.', type: 'warning' } }));
                navigate(-1);
            } else {
               
                const errorData = await response.json();
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: errorData.message || 'Acesso negado ou erro ao submeter.', type: 'error' } }));
            }
        } catch (error) {
            console.error('Erro na submissão:', error);
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Não foi possível ligar ao servidor.', type: 'error' } }));
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-20 text-center text-text font-medium">A preparar o formulário...</div>;
    if (!formData) return null;

    const fields = formData.fields || formData.Fields || [];
    const title = formData.title || formData.Title || 'Formulário Sem Título';
    const description = formData.description || formData.Description || '';

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 text-accent font-semibold hover:text-emerald-700 transition-colors"
            >
                ← Voltar
            </button>

            <div className="bg-white rounded-xl shadow-custom border border-accent-border p-8">
                <header className="mb-8 border-b border-gray-100 pb-6 text-center">
                    <h1 className="text-3xl font-bold text-text-h mb-2">{title}</h1>
                    <p className="text-text whitespace-pre-wrap">{description}</p>
                    <div className="mt-4 flex justify-center gap-2">
                        <span className="text-xs font-semibold text-accent bg-accent-bg py-1 px-3 rounded-full">
                            Autenticado como: {currentUser}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 py-1 px-3 rounded-full uppercase">
                            {currentRole}
                        </span>
                    </div>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2"
                >
                    {fields.map((field) => {
                        const type = field.type || field.Type;
                        const label = field.label || field.Label;
                        const fId = field.id || field.Id;
                        const req = field.required || field.Required;
                        const options = field.options || field.Options || [];
                        const width = field.width || field.Width || 'full';
                        const colSpan = width === 'half' && type !== 'section'
                            ? 'sm:col-span-1'
                            : 'col-span-1 sm:col-span-2';

                        if (type === 'section') {
                            return (
                                <div key={fId} className="col-span-1 pt-6 border-t border-gray-100 sm:col-span-2">
                                    <h2 className="text-xl font-bold text-text-h">{label}</h2>
                                    {(field.description || field.Description) && (
                                        <p className="text-sm text-text mt-1">{field.description || field.Description}</p>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={fId} className={`${colSpan} flex flex-col gap-2`}>
                                <label className="font-semibold text-text-h">
                                    {label} {req && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {['text', 'number', 'date'].includes(type) && (
                                    <input
                                        type={type}
                                        required={req}
                                        placeholder={field.placeholder || field.Placeholder}
                                        value={answers[fId] || ''}
                                        onChange={(e) => handleAnswerChange(fId, e.target.value)}
                                        className="rounded-md border border-gray-300 p-3 focus:border-accent focus:ring-1 focus:ring-accent w-full"
                                    />
                                )}

                                {type === 'textarea' && (
                                    <textarea
                                        required={req}
                                        placeholder={field.placeholder || field.Placeholder}
                                        value={answers[fId] || ''}
                                        onChange={(e) => handleAnswerChange(fId, e.target.value)}
                                        rows={4}
                                        className="rounded-md border border-gray-300 p-3 focus:border-accent focus:ring-1 focus:ring-accent w-full resize-y"
                                    />
                                )}

                                {type === 'dropdown' && (
                                    <select
                                        required={req}
                                        value={answers[fId] || ''}
                                        onChange={(e) => handleAnswerChange(fId, e.target.value)}
                                        className="rounded-md border border-gray-300 p-3 focus:border-accent focus:ring-1 focus:ring-accent w-full bg-white"
                                    >
                                        <option value="" disabled hidden>{field.placeholder || field.Placeholder || 'Selecione uma opção...'}</option>
                                        {options.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}

                                {type === 'radio' && (
                                    <div className="flex flex-col gap-2 mt-1">
                                        {options.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors w-fit pr-6">
                                                <input
                                                    type="radio"
                                                    name={`radio-${fId}`}
                                                    value={opt}
                                                    checked={answers[fId] === opt}
                                                    onChange={(e) => handleAnswerChange(fId, e.target.value)}
                                                    required={req && !answers[fId]}
                                                    className="w-4 h-4 text-accent border-gray-300 focus:ring-accent cursor-pointer"
                                                />
                                                <span className="text-gray-700 text-sm select-none">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {type === 'checkbox' && (
                                    <div className="flex flex-col gap-2 mt-1">
                                        {options.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors w-fit pr-6">
                                                <input
                                                    type="checkbox"
                                                    value={opt}
                                                    checked={(answers[fId] || []).includes(opt)}
                                                    onChange={(e) => handleAnswerChange(fId, e.target.value, 'checkbox')}
                                                    className="w-4 h-4 rounded text-accent border-gray-300 focus:ring-accent cursor-pointer"
                                                />
                                                <span className="text-gray-700 text-sm select-none">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {type === 'table' && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="w-full border-collapse text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-gray-600 w-16 text-center">Nº</th>
                                                        {(field.tableColumns || []).map((col, cIndex) => (
                                                            <th key={cIndex} className="px-4 py-3 font-semibold text-gray-600">{col}</th>
                                                        ))}
                                                        <th className="px-4 py-3 font-semibold text-gray-600 w-20 text-center">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {Array.from({ length: tableRowCounts[fId] || 1 }).map((_, rIndex) => (
                                                        <tr key={rIndex} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-gray-400 font-medium text-xs text-center">{rIndex + 1}</td>
                                                            {(field.tableColumns || []).map((col, cIndex) => {
                                                                const cellId = `${fId}-r${rIndex}-c${cIndex}`;
                                                                return (
                                                                    <td key={cIndex} className="p-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Resposta..."
                                                                            value={answers[cellId] || ''}
                                                                            onChange={(e) => handleAnswerChange(cellId, e.target.value)}
                                                                            required={req}
                                                                            className="w-full rounded border-gray-300 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent"
                                                                        />
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveRow(fId, rIndex, (field.tableColumns || []).length)}
                                                                    disabled={(tableRowCounts[fId] || 1) <= 1}
                                                                    className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-red-50 transition-colors"
                                                                    title="Remover Linha"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mx-auto">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex justify-start">
                                            <button
                                                type="button"
                                                onClick={() => handleAddRow(fId)}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-emerald-700 transition-colors bg-accent-bg/50 px-3 py-1.5 rounded border border-accent/20 hover:bg-accent-bg"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                Adicionar Linha
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="col-span-1 pt-8 border-t border-gray-100 flex justify-end sm:col-span-2">
                        <button
                            type="submit"
                            className="bg-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm hover:shadow"
                        >
                            Submeter Resposta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}