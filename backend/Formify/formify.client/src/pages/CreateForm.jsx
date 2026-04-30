import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// ─── Tipos de elementos disponíveis na paleta do editor ──────────────────────
// Cada elemento representa um tipo de campo que pode ser arrastado/clicado
// para dentro do formulário.
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

// ─── Públicos-alvo disponíveis para o formulário ─────────────────────────────
// Estes valores devem estar alinhados com aquilo que o backend espera receber.
const AUDIENCE_OPTIONS = [
    { value: 'Professor', label: 'Professores' },
    { value: 'Funcionario', label: 'Funcionários' },
];

function getTypeInfo(type) {
    return FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];
}

// ─── Modal de confirmação ─────────────────────────────────────────────────────
// Mostra uma caixa de diálogo pedindo confirmação antes de publicar
function ConfirmPublishModal({ isOpen, onConfirm, onCancel, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Publicar Formulário?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Depois de publicar, o formulário ficará disponível para os públicos-alvo selecionados.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                    >
                        Não, cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-all hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? 'A Publicar...' : 'Sim, publicar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Preview do campo no canvas ───────────────────────────────────────────────
// Mostra uma pré-visualização visual do campo, sem permitir edição direta.
function FieldPreview({ field }) {
    const inputCls = "w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-400 pointer-events-none";

    switch (field.type) {
        case 'section':
            return null;

        case 'text':
            return <input disabled type="text" placeholder={field.placeholder || 'Texto curto...'} className={inputCls} />;

        case 'textarea':
            return <textarea disabled placeholder={field.placeholder || 'Texto longo...'} rows={2} className={inputCls + ' resize-none'} />;

        case 'number':
            return <input disabled type="number" placeholder="0" className={inputCls} />;

        case 'date':
            return <input disabled type="date" className={inputCls} />;

        case 'dropdown':
            return (
                <select disabled className={inputCls}>
                    {(field.options?.length ? field.options : ['Opção 1', 'Opção 2']).map((o, i) => (
                        <option key={i}>{o}</option>
                    ))}
                </select>
            );

        case 'checkbox':
            return (
                <div className="flex flex-col gap-1 pointer-events-none">
                    {(field.options?.length ? field.options : ['Opção A', 'Opção B']).map((o, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-400 cursor-default">
                            <input type="checkbox" disabled readOnly /> {o}
                        </label>
                    ))}
                </div>
            );

        case 'radio':
            return (
                <div className="flex flex-col gap-1 pointer-events-none">
                    {(field.options?.length ? field.options : ['Sim', 'Não']).map((o, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-400 cursor-default">
                            <input type="radio" disabled readOnly /> {o}
                        </label>
                    ))}
                </div>
            );

        case 'table': {
            const cols = field.tableColumns?.length ? field.tableColumns : ['Coluna A', 'Coluna B', 'Coluna C'];
            const rows = field.tableRows || 2;

            return (
                <table className="w-full border-collapse text-xs pointer-events-none">
                    <thead>
                        <tr>
                            {cols.map((c, i) => (
                                <th key={i} className="border border-gray-200 bg-gray-100 px-2 py-1 text-gray-500 font-medium">
                                    {c}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, r) => (
                            <tr key={r}>
                                {cols.map((_, i) => (
                                    <td key={i} className="border border-gray-200 px-2 py-1 text-gray-300">—</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        default:
            return null;
    }
}

// ─── Painel lateral de edição ─────────────────────────────────────────────────
// Permite editar as propriedades do campo selecionado no canvas.
function EditPanel({ field, onClose, onUpdate }) {
    if (!field) return null;

    const ti = getTypeInfo(field.type);
    const hasOptions = ['dropdown', 'checkbox', 'radio'].includes(field.type);
    const isTable = field.type === 'table';
    const isSection = field.type === 'section';

    const upd = (key, value) => onUpdate({ ...field, [key]: value });

    const addOption = () => upd('options', [...(field.options || []), `Opção ${(field.options?.length || 0) + 1}`]);

    const updateOption = (i, val) => {
        const o = [...(field.options || [])];
        o[i] = val;
        upd('options', o);
    };

    const removeOption = (i) => {
        const o = [...(field.options || [])];
        o.splice(i, 1);
        upd('options', o);
    };

    const addColumn = () => {
        const c = [...(field.tableColumns || ['Coluna A', 'Coluna B', 'Coluna C'])];
        c.push(`Coluna ${String.fromCharCode(65 + c.length)}`);
        upd('tableColumns', c);
    };

    const updateColumn = (i, val) => {
        const c = [...(field.tableColumns || ['Coluna A', 'Coluna B', 'Coluna C'])];
        c[i] = val;
        upd('tableColumns', c);
    };

    const removeColumn = (i) => {
        const c = [...(field.tableColumns || ['Coluna A', 'Coluna B', 'Coluna C'])];
        if (c.length <= 1) return;
        c.splice(i, 1);
        upd('tableColumns', c);
    };

    return (
        <div className="flex flex-col h-full w-64 flex-shrink-0 border-l border-gray-100 bg-white">
            {/* Cabeçalho do painel de edição */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${ti.color}`}>
                        {ti.icon}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{ti.label}</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none"
                >
                    ✕
                </button>
            </div>

            {/* Campos de edição */}
            <div className="flex flex-col gap-5 overflow-y-auto p-4">
                {/* Label / título */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {isSection ? 'Título' : 'Label'}
                    </label>
                    <input
                        type="text"
                        value={field.label}
                        onChange={(e) => upd('label', e.target.value)}
                        className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-green-400 focus:outline-none"
                        placeholder={isSection ? 'Ex: Dados Pessoais' : 'Nome do campo'}
                    />
                </div>

                {/* Descrição da secção */}
                {isSection && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Descrição opcional
                        </label>
                        <textarea
                            value={field.description || ''}
                            onChange={(e) => upd('description', e.target.value)}
                            rows={2}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-green-400 focus:outline-none resize-none"
                            placeholder="Subtítulo da secção..."
                        />
                    </div>
                )}

                {/* Placeholder */}
                {!isSection && !isTable && !hasOptions && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Placeholder
                        </label>
                        <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => upd('placeholder', e.target.value)}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-green-400 focus:outline-none"
                            placeholder="Texto de exemplo..."
                        />
                    </div>
                )}

                {/* Campo obrigatório */}
                {!isSection && (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => upd('required', e.target.checked)}
                            className="accent-green-600 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">Campo obrigatório</span>
                    </label>
                )}

                {/* Largura do campo na grelha */}
                {!isSection && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Largura na grelha
                        </label>
                        <div className="flex gap-2">
                            {[
                                { value: 'full', label: 'Completa', desc: '2 colunas' },
                                { value: 'half', label: 'Metade', desc: '1 coluna' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => upd('width', opt.value)}
                                    className={`flex flex-1 flex-col items-center gap-0.5 rounded-md border py-2 text-xs transition-all
                                        ${(field.width || 'full') === opt.value
                                            ? 'border-green-400 bg-green-50 text-green-700 font-semibold'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    <div className="flex gap-0.5 mb-1">
                                        {opt.value === 'full'
                                            ? <div className="h-2 w-10 rounded-sm bg-current opacity-40" />
                                            : (
                                                <>
                                                    <div className="h-2 w-5 rounded-sm bg-current opacity-70" />
                                                    <div className="h-2 w-5 rounded-sm bg-current opacity-20" />
                                                </>
                                            )
                                        }
                                    </div>
                                    <span>{opt.label}</span>
                                    <span className="text-[10px] opacity-60">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Opções para dropdown / checkbox / radio */}
                {hasOptions && (
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Opções
                        </label>
                        <div className="flex flex-col gap-1.5">
                            {(field.options || []).map((opt, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="text-gray-300 text-xs w-4 text-center flex-shrink-0">{i + 1}.</span>
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1 text-sm focus:border-green-400 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOption(i)}
                                        disabled={(field.options?.length || 0) <= 1}
                                        className="text-gray-300 hover:text-red-400 disabled:opacity-20 text-sm transition-colors flex-shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-1 rounded-md border border-dashed border-gray-300 py-1.5 text-xs text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
                        >
                            + Adicionar opção
                        </button>
                    </div>
                )}

                {/* Configuração da tabela */}
                {isTable && (
                    <>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                Colunas
                            </label>
                            <div className="flex flex-col gap-1.5">
                                {(field.tableColumns || ['Coluna A', 'Coluna B', 'Coluna C']).map((col, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <span className="text-gray-300 text-xs w-4 text-center flex-shrink-0">{i + 1}.</span>
                                        <input
                                            type="text"
                                            value={col}
                                            onChange={(e) => updateColumn(i, e.target.value)}
                                            className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1 text-sm focus:border-green-400 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeColumn(i)}
                                            disabled={(field.tableColumns?.length || 3) <= 1}
                                            className="text-gray-300 hover:text-red-400 disabled:opacity-20 text-sm transition-colors flex-shrink-0"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addColumn}
                                className="mt-1 rounded-md border border-dashed border-gray-300 py-1.5 text-xs text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
                            >
                                + Adicionar coluna
                            </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                Linhas ({field.tableRows || 2})
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={field.tableRows || 2}
                                onChange={(e) => upd('tableRows', parseInt(e.target.value))}
                                className="w-full accent-green-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-300">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Card de campo no canvas ──────────────────────────────────────────────────
// Representa visualmente cada campo adicionado ao formulário.
function FieldCard({
    field,
    isSelected,
    onSelect,
    onRemove,
    isDraggingOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}) {
    const ti = getTypeInfo(field.type);
    const isSection = field.type === 'section';
    const isHalf = !isSection && (field.width || 'full') === 'half';

    // As secções ocupam sempre a largura total da grelha.
    if (isSection) {
        return (
            <div
                draggable
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onClick={onSelect}
                style={{ gridColumn: '1 / -1' }}
                className={`group relative cursor-pointer rounded-lg border px-4 py-3 transition-all select-none
                    ${isSelected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-green-200'}
                    ${isDraggingOver ? 'scale-[1.01] border-green-400 shadow-md' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <DragHandle />
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-sm font-bold text-gray-700">{field.label || 'Título da secção'}</span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        {field.description && (
                            <p className="mt-1 text-center text-xs text-gray-400">{field.description}</p>
                        )}
                    </div>
                    <RemoveBtn onRemove={onRemove} />
                </div>
                {isSelected && <SelectedDot />}
            </div>
        );
    }

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onClick={onSelect}
            style={{ gridColumn: isHalf ? 'span 1' : '1 / -1' }}
            className={`group relative flex flex-col gap-2 rounded-lg border bg-white p-3 cursor-pointer transition-all select-none
                ${isSelected ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-200 hover:shadow-sm'}
                ${isDraggingOver ? 'border-green-400 scale-[1.02] shadow-md' : ''}`}
        >
            <div className="flex items-center gap-2">
                <DragHandle />
                <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold flex-shrink-0 ${ti.color}`}>
                    {ti.icon}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-400">*</span>}
                </span>
                {isHalf && <span className="text-[10px] text-gray-300 border border-gray-100 rounded px-1 flex-shrink-0">½</span>}
                <RemoveBtn onRemove={onRemove} />
            </div>
            <div className="pl-8">
                <FieldPreview field={field} />
            </div>
            {isSelected && <SelectedDot />}
        </div>
    );
}

function DragHandle() {
    return (
        <div className="flex flex-col gap-0.5 opacity-20 group-hover:opacity-50 transition-opacity cursor-grab flex-shrink-0">
            {[0, 1, 2].map(i => (
                <div key={i} className="flex gap-0.5">
                    {[0, 1].map(j => <div key={j} className="w-1 h-1 rounded-full bg-gray-500" />)}
                </div>
            ))}
        </div>
    );
}

function RemoveBtn({ onRemove }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0 text-sm"
        >
            ✕
        </button>
    );
}

function SelectedDot() {
    return <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-400" />;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CreateForm() {
    // Se for edição, isto terá o ID. Se for criação, será undefined.
    const { id } = useParams(); 

    // Dados principais do formulário
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [audience, setAudience] = useState([]);

    // Campos criados no editor visual
    const [fields, setFields] = useState([]);

    // Estados de validação
    const [erroNome, setErroNome] = useState('');
    const [erroAudience, setErroAudience] = useState('');
    const [erroFields, setErroFields] = useState('');

    // Estados de interface
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [showConfirmPublish, setShowConfirmPublish] = useState(false);

    // Estados auxiliares para drag and drop
    const dragIndex = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const dragTypeRef = useRef(null);

    const navigate = useNavigate();
    const selectedField = fields.find(f => f.id === selectedId) || null;


    useEffect(() => {
        if (id) {
            // Modo Edição: Buscar os dados do formulário ao Backend
            const fetchFormDetails = async () => {
                try {
                    const response = await fetch(`/api/Forms/${id}`);
                    if (response.ok) {
                        const formDados = await response.json();
                        // Preencher as caixas com os dados vindos do C#
                        setNome(formDados.title || formDados.Title || '');
                        setDescricao(formDados.description || formDados.Description || '');
                        setFields(formDados.fields || formDados.Fields || []);
                        setAudience(formDados.audience || formDados.Audience || []);
                    } else {
                        alert('Erro ao carregar o formulário para edição.');
                    }
                } catch (error) {
                    console.error('Erro na ligação:', error);
                }
            };

            fetchFormDetails();
        }
    }, [id]);

    // ── Alternar público-alvo ──
    // Permite selecionar/desselecionar Professores e Funcionários.
    const toggleAudience = (value) => {
        setAudience(prev => {
            const exists = prev.includes(value);
            return exists ? prev.filter(item => item !== value) : [...prev, value];
        });

        setErroAudience('');
    };

    // ── Criar campo ──
    // Cria a estrutura base de um campo novo, sem o adicionar ainda ao formulário.
    // Isto permite reutilizar a mesma lógica tanto no clique como no drag and drop.
    const criarCampo = (type) => {
        const ti = getTypeInfo(type);

        return {
            id: crypto.randomUUID(),
            type,
            label: ti.label,
            placeholder: '',
            required: false,
            width: 'full',
            options: ['dropdown', 'checkbox', 'radio'].includes(type) ? ['Opção 1', 'Opção 2'] : [],
            tableColumns: type === 'table' ? ['Coluna A', 'Coluna B', 'Coluna C'] : [],
            tableRows: type === 'table' ? 2 : 0,
            description: '',
        };
    };

    // ── Adicionar campo ao formulário ──
    // Usado quando o utilizador clica num elemento da paleta.
    const adicionarCampo = (type) => {
        const novo = criarCampo(type);

        setFields(prev => [...prev, novo]);
        setSelectedId(novo.id);
        setErroFields('');
    };

    // ── Atualizar campo selecionado ──
    const updateField = (updated) => {
        setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    };

    // ── Remover campo do formulário ──
    const removerCampo = (id) => {
        setFields(prev => prev.filter(f => f.id !== id));

        if (selectedId === id) {
            setSelectedId(null);
        }
    };

    // ── Drag and drop da paleta para o canvas ──
    // Guarda o tipo de campo que está a ser arrastado a partir da paleta.
    const handlePaletteDragStart = (e, type) => {
        dragTypeRef.current = type;
        dragIndex.current = null;

        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('field-type', type);
    };

    // ── Início do drag de um campo já existente ──
    // Guarda o índice do campo que está a ser reordenado.
    const handleCardDragStart = (e, index) => {
        dragIndex.current = index;
        dragTypeRef.current = null;
        setDragOverIndex(index);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('field-index', index.toString());
    };

    // ── Campo sobre o qual o utilizador está a passar com o rato ──
    const handleCardDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    // ── Largar em cima de um campo existente ──
    // Permite inserir um novo campo nessa posição ou mover um campo já existente.
    const handleCardDrop = (e, dropIndex) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedType = dragTypeRef.current || e.dataTransfer.getData('field-type');

        // Caso 1: elemento vindo da paleta
        if (draggedType) {
            const novo = criarCampo(draggedType);

            setFields(prev => {
                const updated = [...prev];
                updated.splice(dropIndex, 0, novo);
                return updated;
            });

            setSelectedId(novo.id);
            setErroFields('');
        }

        // Caso 2: reordenar campo já existente
        else if (dragIndex.current !== null && dragIndex.current !== dropIndex) {
            setFields(prev => {
                const updated = [...prev];
                const [moved] = updated.splice(dragIndex.current, 1);
                updated.splice(dropIndex, 0, moved);
                return updated;
            });
        }

        dragIndex.current = null;
        dragTypeRef.current = null;
        setDragOverIndex(null);
    };

    // ── Fim do drag ──
    const handleCardDragEnd = () => {
        dragIndex.current = null;
        dragTypeRef.current = null;
        setDragOverIndex(null);
    };

    // ── Largar no espaço vazio do canvas ──
    // Se o utilizador largar fora de um campo específico, adiciona ao fim.
    const handleCanvasDrop = (e) => {
        e.preventDefault();

        const draggedType = dragTypeRef.current || e.dataTransfer.getData('field-type');

        if (draggedType) {
            adicionarCampo(draggedType);
        }

        dragIndex.current = null;
        dragTypeRef.current = null;
        setDragOverIndex(null);
    };

    // Função para verificar se ainda existem valores default no formulário
    const validarFormularioCompleto = (fieldsToValidate) => {
        const erros = [];

        fieldsToValidate.forEach((field, index) => {
            // Obter os dados padrão para este tipo de campo
            const typeInfo = FIELD_TYPES.find(f => f.type === field.type);
            const defaultLabel = typeInfo ? typeInfo.label : '';

            // Forma amigável de referir o campo no erro
            const nomeAmigavel = field.label && field.label !== defaultLabel
                ? `"${field.label}"`
                : `Nº ${index + 1} (${defaultLabel})`;

            // 1. Validar Label (APLICA-SE A TODOS, INCLUINDO SECÇÕES)
            if (!field.label || field.label.trim() === '' || field.label === defaultLabel) {
                erros.push(`O elemento ${nomeAmigavel} ainda tem o título por preencher ou tem o nome default.`);
            }

            // As secções ('section') param a validação por aqui.
            // Não têm placeholders, opções nem colunas de tabela.
            if (field.type === 'section') return;

            // 2. Validar Placeholder (para os campos que suportam placeholder de texto)
            if (['text', 'textarea', 'number'].includes(field.type)) {
                if (!field.placeholder || field.placeholder.trim() === '') {
                    erros.push(`O campo ${nomeAmigavel} não tem um texto de ajuda (placeholder) definido.`);
                }
            }

            // 3. Validar Opções (Dropdown, Checkbox, Radio)
            if (['dropdown', 'checkbox', 'radio'].includes(field.type)) {
                // Regex para detetar "Opção 1", "Opção 2", "Opção 99", etc.
                const hasDefaultOptions = field.options.some(opt =>
                    !opt || opt.trim() === '' || /^Opção \d+$/.test(opt.trim())
                );

                if (hasDefaultOptions) {
                    erros.push(`O campo ${nomeAmigavel} contém opções vazias ou com o nome padrão ("Opção X").`);
                }
            }

            // 4. Validar Colunas da Tabela
            if (field.type === 'table') {
                // Regex para detetar "Coluna A", "Coluna B", "Coluna Z", etc.
                const hasDefaultCols = field.tableColumns.some(col =>
                    !col || col.trim() === '' || /^Coluna [A-Z]$/.test(col.trim())
                );

                if (hasDefaultCols) {
                    erros.push(`A tabela ${nomeAmigavel} contém colunas vazias ou com o nome padrão ("Coluna X").`);
                }
            }
        });

        return erros;
    };


    // ── Submissão do formulário ──
    // Valida os dados no frontend antes de enviar para o backend.
    // ─── Submissão do formulário ──
    const handleSubmit = async (e) => {
        e.preventDefault();

        setErroNome('');
        setErroAudience('');
        setErroFields([]);

        const realFields = fields.filter(field => field.type !== 'section');
        const fieldsWithOrder = fields.map((field, index) => ({
            ...field,
            order: index,
        }));

        // 1. Validações SEMPRE obrigatórias (Rascunho ou Publicado)
        if (nome.trim() === '') {
            setErroNome('O nome do formulário é obrigatório.');
            return;
        }

        if (audience.length === 0) {
            setErroAudience('Seleciona pelo menos um público-alvo para o formulário.');
            return;
        }

        // IDENTIFICAR QUAL BOTÃO FOI CLICADO
        const isFinal = e.nativeEvent.submitter.id === 'save-final';

        // 2. ⭐ VALIDAÇÕES APENAS PARA QUANDO FOR PUBLICADO ⭐
        if (isFinal) {
            // Regra A: Tem de ter pelo menos um campo real (não conta se for só uma secção)
            if (realFields.length === 0) {
                setErroFields(['Adiciona pelo menos um campo ao formulário antes de publicar.']);
                return;
            }

            // Regra B: Os campos não podem ter os valores default
            const errosDePreenchimento = validarFormularioCompleto(fields);

            if (errosDePreenchimento.length > 0) {
                setErroFields(errosDePreenchimento);
                return;
            }

            // Se passou todas as validações, mostra o modal de confirmação
            setShowConfirmPublish(true);
            return;
        }

        // Se não for final (é rascunho), submete diretamente
        await submeterFormulario(fieldsWithOrder, false);
    };

    // ── Função para submeter o formulário ao backend ──
    const submeterFormulario = async (fieldsWithOrder, isFinal) => {
        setIsLoading(true);

        try {
            const url = id
                ? `http://localhost:5208/api/Forms/${id}`
                : 'http://localhost:5208/api/Forms';

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Id: id,
                    Title: nome,
                    Description: descricao,
                    Audience: audience,
                    StatusDraft: !isFinal,
                    Fields: fieldsWithOrder,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro do backend:', errorText);
                alert('Erro ao criar formulário.');
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            console.log('Formulário submetido com sucesso:', data);

            alert(isFinal ? 'Formulário publicado com sucesso!' : 'Rascunho guardado com sucesso!');
            navigate('/');
        } catch (error) {
            console.error('Erro de ligação ao backend:', error);
            alert('Não foi possível ligar ao backend.');
            setIsLoading(false);
        }
    };

    // ── Handler para confirmar publicação ──
    const handleConfirmPublish = async () => {
        const fieldsWithOrder = fields.map((field, index) => ({
            ...field,
            order: index,
        }));

        await submeterFormulario(fieldsWithOrder, true);
        setShowConfirmPublish(false);
    };

    // ── Handler para cancelar publicação ──
    const handleCancelPublish = () => {
        setShowConfirmPublish(false);
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho da página */}
            <div className="flex flex-col gap-4">
                <Link to="/" className="inline-flex w-fit items-center gap-2 font-semibold text-accent transition-all hover:opacity-80">
                    ← Voltar
                </Link>
                <h2 className="text-3xl font-bold text-text-h">Novo Formulário</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Informações básicas do formulário */}
                <div className="flex flex-col gap-4 rounded-lg border border-accent-border bg-accent-bg p-6">
                    {/* Nome */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="nome" className="font-medium text-text-h">
                            Nome do Formulário <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => {
                                setNome(e.target.value);
                                setErroNome('');
                            }}
                            placeholder="Ex: Pedido de Aquisição de Material"
                            className={`rounded-md border p-2 focus:outline-none ${erroNome ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                        />
                        {erroNome && <span className="text-red-500 text-sm">{erroNome}</span>}
                    </div>

                    {/* Descrição */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="descricao" className="font-medium text-text-h">Descrição</label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o propósito deste formulário (opcional)..."
                            rows={3}
                            className="rounded-md border border-accent-border p-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Público-alvo */}
                    <div className="flex flex-col gap-2">
                        <label className="font-medium text-text-h">
                            Público-alvo <span className="text-red-500">*</span>
                        </label>

                        <div className="flex flex-wrap gap-3">
                            {AUDIENCE_OPTIONS.map(option => (
                                <label
                                    key={option.value}
                                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-all
                                        ${audience.includes(option.value)
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-accent-border bg-white text-gray-600 hover:border-green-300'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={audience.includes(option.value)}
                                        onChange={() => toggleAudience(option.value)}
                                        className="accent-green-600"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>

                        <p className="text-xs text-gray-400">
                            Define quem poderá visualizar e preencher este formulário depois de publicado.
                        </p>

                        {erroAudience && <span className="text-red-500 text-sm">{erroAudience}</span>}
                    </div>
                </div>

                {/* Editor visual de campos */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-text-h">Campos do Formulário</h3>
                        <span className="text-sm text-gray-400">
                            {fields.filter(f => f.type !== 'section').length} campo{fields.filter(f => f.type !== 'section').length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Erro de validação dos campos */}
                    {erroFields && erroFields.length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            <p className="font-bold mb-2">Não é possível publicar. O formulário não está completo:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                {typeof erroFields === 'string' ? (
                                    <li>{erroFields}</li> /* Para os teus erros antigos de string */
                                ) : (
                                    erroFields.map((erro, i) => <li key={i}>{erro}</li>)
                                )}
                            </ul>
                        </div>
                    )}

                    <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden" style={{ minHeight: '520px' }}>
                        {/* Paleta de elementos */}
                        <div className="flex flex-col gap-1.5 border-r border-gray-100 bg-gray-50 p-4 w-48 flex-shrink-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                                Elementos
                            </p>

                            {FIELD_TYPES.map((ft) => (
                                <div
                                    key={ft.type}
                                    draggable
                                    onDragStart={(e) => handlePaletteDragStart(e, ft.type)}
                                    onClick={() => adicionarCampo(ft.type)}
                                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 cursor-grab active:cursor-grabbing hover:border-green-300 hover:bg-green-50 transition-all select-none"
                                >
                                    <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold flex-shrink-0 ${ft.color}`}>
                                        {ft.icon}
                                    </span>
                                    {ft.label}
                                </div>
                            ))}

                            <p className="mt-2 text-[10px] text-gray-300 text-center leading-snug">
                                Arrasta ou clica
                            </p>
                        </div>

                        {/* Canvas do formulário */}
                        <div
                            className="relative flex-1 p-4 overflow-y-auto"
                            onDrop={handleCanvasDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => setSelectedId(null)}
                            style={{
                                backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                                backgroundSize: '24px 24px',
                            }}
                        >
                            {fields.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-3xl text-gray-200">
                                        ⊞
                                    </div>
                                    <p className="text-sm text-gray-300">Arrasta elementos para aqui</p>
                                </div>
                            ) : (
                                <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    {fields.map((campo, index) => (
                                        <FieldCard
                                            key={campo.id}
                                            field={campo}
                                            isSelected={selectedId === campo.id}
                                            onSelect={(e) => {
                                                e?.stopPropagation();
                                                setSelectedId(campo.id);
                                            }}
                                            onRemove={() => removerCampo(campo.id)}
                                            isDraggingOver={dragOverIndex === index}
                                            onDragStart={(e) => handleCardDragStart(e, index)}
                                            onDragOver={(e) => handleCardDragOver(e, index)}
                                            onDrop={(e) => handleCardDrop(e, index)}
                                            onDragEnd={handleCardDragEnd}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Painel lateral de edição do campo selecionado */}
                        {selectedField && (
                            <EditPanel
                                field={selectedField}
                                onClose={() => setSelectedId(null)}
                                onUpdate={updateField}
                            />
                        )}
                    </div>

                    <p className="text-xs text-gray-300 text-right">
                        Clica num campo para editar · Arrasta para reordenar · "Metade" coloca campos lado a lado
                    </p>
                </div>

                {/* Botões de submissão */}
                <div className="flex justify-end gap-3">
                    <button
                        disabled={isLoading}
                        type="submit"
                        id="save-draft"
                        className="rounded-md border border-blue-300 bg-blue-50 px-6 py-2 font-semibold text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50"
                    >
                        Guardar como Rascunho
                    </button>

                    <button
                        disabled={isLoading}
                        id="save-final"
                        type="submit"
                        className="rounded-md bg-green-600 px-6 py-2 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? 'A Publicar...' : 'Publicar'}
                    </button>
                </div>
            </form>

            {/* Modal de confirmação de publicação */}
            <ConfirmPublishModal
                isOpen={showConfirmPublish}
                onConfirm={handleConfirmPublish}
                onCancel={handleCancelPublish}
                isLoading={isLoading}
            />
        </div>
    );
}