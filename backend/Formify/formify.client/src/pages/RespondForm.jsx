import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RespondForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const currentUser = localStorage.getItem('username') || 'Utilizador';
    const currentRole = localStorage.getItem('role') || 'Role';

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await fetch(`/api/Forms/${id}`);
                if (!response.ok) throw new Error('Formulário não encontrado.');

                const data = await response.json();

                // Bloqueia rascunhos no Frontend
                if (data.statusDrafted || data.StatusDrafted) {
                    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Este formulário não aceita respostas.', type: 'error' } }));
                    navigate(-1);
                    return;
                }

                setFormData(data);

                // Preparar objeto de respostas vazio
                const initialAnswers = {};
                (data.fields || data.Fields || []).forEach(field => {
                    const type = field.type || field.Type;
                    const fId = field.id || field.Id;

                    if (type !== 'section') {
                        initialAnswers[fId] = type === 'checkbox' ? [] : '';
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
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
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

                <form onSubmit={handleSubmit} className="space-y-8">
                    {fields.map((field) => {
                        const type = field.type || field.Type;
                        const label = field.label || field.Label;
                        const fId = field.id || field.Id;
                        const req = field.required || field.Required;
                        const options = field.options || field.Options || [];

                        if (type === 'section') {
                            return (
                                <div key={fId} className="pt-6 border-t border-gray-100">
                                    <h2 className="text-xl font-bold text-text-h">{label}</h2>
                                    {(field.description || field.Description) && (
                                        <p className="text-sm text-text mt-1">{field.description || field.Description}</p>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={fId} className="flex flex-col gap-2">
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
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
                                        <table className="w-full border-collapse text-sm text-left">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold text-gray-600 w-16 text-center">Nº</th>
                                                    {(field.tableColumns || field.TableColumns || []).map((col, cIndex) => (
                                                        <th key={cIndex} className="px-4 py-3 font-semibold text-gray-600">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {Array.from({ length: field.tableRows || field.TableRowCount || 1 }).map((_, rIndex) => (
                                                    <tr key={rIndex} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 text-gray-400 font-medium text-xs text-center">{rIndex + 1}</td>
                                                        {(field.tableColumns || field.TableColumns || []).map((col, cIndex) => {
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="pt-8 border-t border-gray-100 flex justify-end">
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