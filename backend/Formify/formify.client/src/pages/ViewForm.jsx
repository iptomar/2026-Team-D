import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
/**
 * Helper to determine the visual properties of the field types.
 * Reused from original code to maintain consistent icons/colors if needed.
 */
const FIELD_TYPES = [
    { type: 'section', label: 'Título de secção', icon: '§', color: 'bg-gray-100 text-gray-600' },
    { type: 'text', label: 'Texto curto', icon: 'T', color: 'bg-blue-100 text-blue-700' },
    { type: 'textarea', label: 'Texto longo', icon: '¶', color: 'bg-green-100 text-green-700' },
    { type: 'number', label: 'Número', icon: '#', color: 'bg-teal-100 text-teal-700' },
    { type: 'date', label: 'Data', icon: '▦', color: 'bg-pink-100 text-pink-700' },
    { type: 'dropdown', label: 'Dropdown', icon: '▾', color: 'bg-purple-100 text-purple-700' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑', color: 'bg-yellow-100 text-yellow-700' },
    { type: 'radio', label: 'Botões de opção', icon: '◉', color: 'bg-orange-100 text-orange-700' },
    { type: 'table', label: 'Tabela', icon: '⊞', color: 'bg-gray-100 text-gray-700' },
];

//function getTypeInfo(type) {
 //   return FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];
//}

/**
 * Renders the actual input element in a disabled state.
 */
function FieldReadOnly({ field }) {
    const inputCls = "w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed select-none";

    switch (field.type) {
        case 'text':
            return <input disabled type="text" placeholder={field.placeholder} className={inputCls} />;

        case 'textarea':
            return <textarea disabled placeholder={field.placeholder} rows={3} className={`${inputCls} resize-none`} />;

        case 'number':
            return <input disabled type="number" placeholder="0" className={inputCls} />;

        case 'date':
            return <input disabled type="date" className={inputCls} />;

        case 'dropdown':
            return (
                <select disabled className={inputCls}>
                    <option value="">{field.placeholder || 'Selecione...'}</option>
                    {field.options?.map((o, i) => (
                        <option key={i}>{o}</option>
                    ))}
                </select>
            );

        case 'checkbox':
        case 'radio':
            return (
                <div className="flex flex-col gap-2 mt-1">
                    {field.options?.map((o, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
                            <input type={field.type} disabled className="accent-gray-400" /> {o}
                        </label>
                    ))}
                </div>
            );

        case 'table': {
            const cols = field.tableColumns?.length ? field.tableColumns : ['Coluna A', 'Coluna B'];
            return (
                <div className="overflow-x-auto rounded border border-gray-100">
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                {cols.map((c, i) => (
                                    <th key={i} className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-gray-500 font-semibold">
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: field.tableRows || 1 }).map((_, r) => (
                                <tr key={r}>
                                    {cols.map((_, i) => (
                                        <td key={i} className="border-b border-gray-100 px-3 py-2 text-gray-300">—</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        default:
            return null;
    }
}
// ... (Keep your FIELD_TYPES and FieldReadOnly components exactly as they are)

export default function FormViewer() {
    const { id } = useParams(); // Grabs the ID from the URL (e.g., /view/123)
    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchForm = async () => {
            try {
                setIsLoading(true);
                // Replace this URL with your actual endpoint
                const response = await fetch(`/api/Forms/${id}`);

                if (!response.ok) {
                    throw new Error('Não foi possível carregar o formulário.');
                }

                const data = await response.json();
                setFormData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchForm();
    }, [id]);

    if (isLoading) return <div className="text-center p-20 text-gray-500">A carregar formulário...</div>;
    if (error) return <div className="text-center p-20 text-red-500">Erro: {error}</div>;
    if (!formData) return <div className="text-center p-20 text-gray-400">Nenhum dado encontrado.</div>;

    const { title, description, fields = [] } = formData;

    return (
        <div className="max-w-4xl mx-auto my-10 p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
            {/* Form Header */}
            <header className="mb-10 border-b border-gray-50 pb-6 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{title || "Sem Título"}</h1>
                {description && <p className="text-gray-500 leading-relaxed">{description}</p>}
            </header>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {fields.map((field) => {
                    const isSection = field.type === 'section';
                    const isHalf = field.width === 'half' && !isSection;

                    if (isSection) {
                        return (
                            <div key={field.id} className="col-span-2 mt-8 mb-2">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest whitespace-nowrap">
                                        {field.label}
                                    </h2>
                                    <div className="h-px w-full bg-gray-100" />
                                </div>
                                {field.description && (
                                    <p className="text-xs text-gray-400 mt-1">{field.description}</p>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={field.id} className={isHalf ? "col-span-1" : "col-span-2"}>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                {field.label}
                                {field.required && <span className="ml-1 text-red-400">*</span>}
                            </label>
                            <FieldReadOnly field={field} />
                        </div>
                    );
                })}
            </div>

            <footer className="mt-12 pt-6 border-t border-gray-50 text-center">
                <p className="text-[10px] text-gray-300 uppercase tracking-widest">
                    Modo de Visualização • Documento Gerado Automaticamente
                </p>
            </footer>
        </div>
    );
}