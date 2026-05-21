import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Toast from '../components/Toast';

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

function normalizeField(field = {}) {
    const type = field.type ?? field.Type ?? '';
    const isTable = type === 'table';

    return {
        id: field.id ?? field.Id,
        type,
        label: field.label ?? field.Label ?? '',
        placeholder: field.placeholder ?? field.Placeholder ?? '',
        required: field.required ?? field.Required ?? false,
        width: field.width ?? field.Width ?? 'full',
        options: isTable ? [] : (field.options ?? field.Options ?? []),
        tableColumns: isTable ? (field.tableColumns ?? field.options ?? field.Options ?? []) : (field.tableColumns ?? field.TableColumns ?? []),
        tableRows: isTable ? (field.tableRows ?? field.tableRowCount ?? field.TableRowCount ?? 2) : (field.tableRows ?? field.TableRowCount ?? 0),
        description: field.description ?? field.Description ?? '',
    };
}

function buildFormSnapshot(nome, descricao, audience, fields) {
    return {
        nome,
        descricao,
        audience: [...audience],
        fields: fields.map(normalizeField),
    };
}

function normalizeFieldList(list) {
    return list.map(normalizeField);
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

// ─── Modal de confirmação de gravação de edição ───────────────────────────────
// Pedido de confirmação antes de gravar alterações num rascunho já existente.
function ConfirmSaveEditModal({ isOpen, onConfirm, onCancel, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Guardar e voltar?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Vais guardar as alterações como rascunho antes de sair da página.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'A Guardar...' : 'Sim, guardar'}
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
    // Estados para guardar o que o utilizador escreve
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    // Estado que guarda a lista de campos do formulário (cada campo tem label, tipo, etc.)
    const [fields, setFields] = useState([]); // comentario ju
    const [audience, setAudience] = useState([]);

    // estado para guardar mensagens de erro do campo nome
    const [erroNome, setErroNome] = useState('');
    const [erroDescricao, setErroDescricao] = useState('');
    // Limpa qualquer erro anterior do público-alvo
    const [erroAudience, setErroAudience] = useState('');

    //state hook para prevenir double-submits
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [showConfirmPublish, setShowConfirmPublish] = useState(false);
    const [showConfirmSaveEdit, setShowConfirmSaveEdit] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [initialSnapshot, setInitialSnapshot] = useState(null);

    // Guarda erros específicos de cada campo
    const [fieldErrors, setFieldErrors] = useState({}); 

    const navigate = useNavigate(); // Para voltarmos à página inicial depois de gravar

    const pushToast = (type, message) => {
        const toastId = crypto.randomUUID();
        setToasts(prev => [...prev, { id: toastId, type, message }]);
        window.setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== toastId));
        }, 5000);
    };

    const currentSnapshot = buildFormSnapshot(nome.trim(), descricao, audience, fields);
    const isDirty = Boolean(id && initialSnapshot && JSON.stringify(currentSnapshot) !== JSON.stringify(initialSnapshot));

    useEffect(() => {
        if (!id) return;

        const fetchFormDetails = async () => {
            try {
                const response = await fetch(`/api/Forms/${id}`);

                if (!response.ok) {
                    pushToast('error', 'Não foi possível carregar o formulário para edição.');
                    return;
                }

                const formDados = await response.json();

                const isPublished = (formDados.statusDrafted ?? formDados.StatusDrafted) === false;
                if (isPublished) {
                    pushToast('error', 'Este formulário está publicado e não pode ser editado.');
                    navigate('/admin');
                    return;
                }

                const loadedNome = formDados.title || formDados.Title || '';
                const loadedDescricao = formDados.description || formDados.Description || '';
                const loadedAudience = formDados.audience || formDados.Audience || [];
                const loadedFields = normalizeFieldList(formDados.fields || formDados.Fields || []);

                setNome(loadedNome);
                setDescricao(loadedDescricao);
                setFields(loadedFields);
                setAudience(loadedAudience);
                setInitialSnapshot(buildFormSnapshot(loadedNome.trim(), loadedDescricao, loadedAudience, loadedFields));
            } catch {
                pushToast('error', 'Não foi possível ligar ao servidor.');
            }
        };

        fetchFormDetails();
    }, [id, navigate]);

    useEffect(() => {
        if (!isDirty) return;

        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const handleVoltar = () => {
        if (isDirty) {
            setShowConfirmSaveEdit(true);
            return;
        }

        navigate('/admin');
    };

    // ── Alternar público-alvo ──
    // Permite selecionar/desselecionar Professores e Funcionários.
    const toggleAudience = (value) => {
        setAudience(prev => {
            const exists = prev.includes(value);
            return exists ? prev.filter(item => item !== value) : [...prev, value];
        });

        setErroAudience('');
    };

    // Função que altera o label (nome visível) de um campo específico
    const alterarLabel = (id, novoLabel) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, label: novoLabel } : campo // Atualiza apenas o campo correspondente
        );
        // Atualiza o estado com os novos valores
        setFields(novosCampos);
    };

    const alterarPlaceholder = (id, novoPlaceholder) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, placeholder: novoPlaceholder } : campo
        );
        setFields(novosCampos);
    };

    
    const alterarTipo = (id, novoTipo) => {
        setFields(fields.map(campo => {
            if (campo.id === id) {
                // Se mudar para tabela e não houver colunas, cria a primeira
                const novasOpcoes = (novoTipo === 'table' && campo.options.length === 0)
                    ? [""]
                    : campo.options;

                return { ...campo, type: novoTipo, options: novasOpcoes };
            }
            return campo;
        }));
    };

    // Adiciona uma nova coluna (caixa de texto vazia) à lista de opções
    const adicionarColuna = (id) => {
        setFields(fields.map(c =>
            c.id === id ? { ...c, options: [...c.options, ""] } : c
        ));
    };

    // Atualiza o texto de uma coluna específica
    const alterarColuna = (id, index, valor) => {
        setFields(fields.map(c => {
            if (c.id === id) {
                const novasColunas = [...c.options];
                novasColunas[index] = valor;
                return { ...c, options: novasColunas };
            }
            return c;
        }));
    };


    // Remove uma coluna específica (garantindo que sobra sempre pelo menos 1)
    const removerColuna = (id, index) => {
        setFields(fields.map(c => {
            if (c.id === id) {
                // Só remove se houver mais do que uma coluna
                if (c.options.length > 1) {
                    const novasColunas = c.options.filter((_, i) => i !== index);
                    return { ...c, options: novasColunas };
                }
            }
            return c;
        }));
    };

    // Atualiza as configurações da tabela (o toggle das linhas e o número de linhas)
    const alterarConfigTabela = (id, propriedade, valor) => {
        setFields(fields.map(c =>
            c.id === id ? { ...c, [propriedade]: valor } : c
        ));
    };

    const alterarObrigatorio = (id) => {
        const novosCampos = fields.map(campo =>
            campo.id === id ? { ...campo, required: !campo.required } : campo
        );
        setFields(novosCampos);
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
                // Regex para detetar \"Opção 1\", \"Opção 2\", \"Opção 99\", etc.
                const hasDefaultOptions = field.options.some(opt =>
                    !opt || opt.trim() === '' || /^Opção \d+$/.test(opt.trim())
                );

     // Função que altera as opções de um campo dropdown específico
    const alterarOptions = (id, novasOptions) => {
        const listaOptions = novasOptions
            .split(',')
            .map(opcao => opcao.trim())
            .filter(opcao => opcao !== '');

            // 4. Validar Colunas da Tabela
            if (field.type === 'table') {
                // Regex para detetar \"Coluna A\", \"Coluna B\", \"Coluna Z\", etc.
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

    // 2. Função que corre ao submeter o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true); // Desativa o botão
        setErroNome('');
        setErroDescricao('');
        setErroAudience('');

        let formValido = true;
        setErroNome('');
        setErroAudience('');
        setFieldErrors({});

        // 1. Validações base
        if (nome.trim() === '') {
            setErroNome('O nome do formulário é obrigatório.');
            formValido = false;
        }

        if (audience.length === 0) {
            setErroAudience("Tem de selecionar pelo menos um público-alvo.");
            formValido = false;
        }

        // 2. Validações dos campos dinâmicos (Erro individual por cada input)
        let novosErros = {};
        let camposValidos = true;

        fields.forEach(f => {
            let errosDoCampo = {
                label: !f.label || f.label.trim() === '',
                placeholder: !f.placeholder || f.placeholder.trim() === '',
                options: false
            };

            if (f.type === 'dropdown' && (f.options.length === 0 || f.options.some(opt => opt.trim() === ''))) {
                errosDoCampo.options = true;
            }
            if (f.type === 'table' && (f.options.length === 0 || f.options.some(col => col.trim() === ''))) {
                errosDoCampo.options = true;
            }

            if (errosDoCampo.label || errosDoCampo.placeholder || errosDoCampo.options) {
                novosErros[f.id] = errosDoCampo;
                camposValidos = false;
            }
        });

        // 3. Se algo falhar, PÁRA aqui e não vai para o try/catch
        if (!formValido || !camposValidos) {
            if (!camposValidos) setFieldErrors(novosErros);
            setIsLoading(false);
            return;
        }

        // Guardar como rascunho:
        //  - Em modo edição: pede confirmação para sobrepor a versão anterior.
        //  - Em modo criação: submete diretamente.
        if (id) {
            setShowConfirmSaveEdit(true);
            return;
        }

        await submeterFormulario(fieldsWithOrder, false);
    };

    const buildFieldsWithOrder = () => fields.map((field, index) => ({
        ...field,
        order: index,
        options: field.type === 'table' ? field.tableColumns : field.options,
        tableRowCount: field.type === 'table' ? field.tableRows : undefined,
    }));

    // ── Submissão do formulário ──
    const submeterFormulario = async (fieldsWithOrder, isFinal) => {
        setIsLoading(true);

        try {
            const url = id
                ? `http://localhost:5208/api/Forms/${id}`
                : 'http://localhost:5208/api/Forms';

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Title: nome,
                    Description: descricao,
                    StatusDraft: !isFinal, // Se o botão que disparou o evento for o de "Guardar", então o form será guardado como !Draft
                    Fields: fields, // envia só os labels
                    Audience: audience
                }),
            });

            if (!response.ok) {
                let backendMessage = null;

                try {
                    const errorJson = await response.json();
                    backendMessage = errorJson?.message || errorJson?.title || null;

                    if (errorJson?.errors) {
                        backendMessage = Object.values(errorJson.errors).flat().join('\n');
                    }
                } catch {
                    // resposta sem JSON
                }

                pushToast('error', backendMessage || (id ? 'Erro ao atualizar formulário.' : 'Erro ao criar formulário.'));
                setIsLoading(false);
                return;
            }

            await response.json();
            pushToast('success', isFinal ? 'Formulário publicado com sucesso.' : 'Rascunho guardado com sucesso.');
            setInitialSnapshot(buildFormSnapshot(nome.trim(), descricao, audience, fields));
            setIsLoading(false);
            window.setTimeout(() => navigate('/admin'), 1400);
        } catch {
            pushToast('error', 'Não foi possível ligar ao backend.');
            setIsLoading(false);
        }
    };

    // ── Handler para confirmar publicação ──
    const handleConfirmPublish = async () => {
        await submeterFormulario(buildFieldsWithOrder(), true);
        setShowConfirmPublish(false);
    };

    // ── Handler para cancelar publicação ──
    const handleCancelPublish = () => {
        setShowConfirmPublish(false);
    };

    // ── Handler para guardar edição ──
    const handleConfirmSaveEdit = async () => {
        await submeterFormulario(buildFieldsWithOrder(), false);
        setShowConfirmSaveEdit(false);
    };

    const handleCancelSaveEdit = () => {
        setShowConfirmSaveEdit(false);
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho da página */}
            <div className="flex flex-col gap-4">
                <button
                    type="button"
                    onClick={handleVoltar}
                    className="inline-flex w-fit items-center gap-2 font-semibold text-accent transition-all hover:opacity-80"
                >
                    ← Voltar
                </button>
                <h2 className="text-3xl font-bold text-text-h">{id ? 'Editar Formulário' : 'Novo Formulário'}</h2>
            </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="nome" className="font-medium text-text-h">
                            Nome do Formulário <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Pedido de Aquisição de Material"
                            className={`rounded-md border p-2 focus:outline-none ${erroNome ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                        />
                        {erroNome && (
                            <span className="text-red-500 text-sm">{erroNome}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="descricao" className="font-medium text-text-h">
                            Descrição
                        </label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o propósito deste formulário (opcional)..."
                            rows="4"
                            className={`rounded-md border p-2 focus:outline-none ${erroDescricao ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                        />
                        {erroDescricao && <span className="text-red-500 text-sm">{erroDescricao}</span>}
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-text-h">
                            Público-alvo
                        </label>

                        <div className="flex flex-col gap-2 rounded-md border border-accent-border bg-white p-3">

                            {/* Professores */}
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={audience.includes("teacher")}
                                    onChange={() => toggleAudience("teacher")}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                <span>Professores</span>
                            </label>

                            {/* Funcionários */}
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={audience.includes("staff")}
                                    onChange={() => toggleAudience("staff")}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                <span>Funcionários</span>
                            </label>

                            
                            {erroAudience && (
                            <span className="text-red-500 text-sm">
                                {erroAudience}
                            </span>
                        )}
                        </div>
                        
                    </div>
                    
                    
                    {/* Botão que permite adicionar novos campos ao formulário */}
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={adicionarCampo}
                            className="rounded-md bg-gray-200 px-4 py-2 font-semibold transition-all hover:bg-gray-300"
                        >
                            + Adicionar Campo
                        </button>
                    </div>

                    {/* Lista de campos adicionados dinamicamente */}
                    {fields.map((campo) => (
                        <div key={campo.id} className={`flex flex-col gap-4 mt-4 p-4 rounded-md border shadow-sm transition-all ${fieldErrors[campo.id] ? 'border-red-300 bg-red-50/30' : 'border-accent-border bg-white'}`}>

                            {/* 1. Nome do Campo */}
                            <div className="flex flex-col gap-2">
                                <label className="font-medium text-sm text-text-h">Nome do campo</label>
                                <input
                                    type="text"
                                    value={campo.label}
                                    placeholder="Ex: Endereço ..."
                                    onChange={(e) => alterarLabel(campo.id, e.target.value)}
                                    className={`rounded-md border p-2 focus:outline-none ${fieldErrors[campo.id]?.label ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                />
                                {fieldErrors[campo.id]?.label && <span className="text-red-500 text-sm">O nome do campo é obrigatório.</span>}
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
                                    <li>{erroFields}</li>
                                ) : (
                                    erroFields.map((erro, i) => <li key={i}>{erro}</li>)
                                )}
                            </ul>
                        </div>
                    )}

                            {/* CONFIGURAÇÃO DA TABELA (Só aparece se o tipo for 'table') */}
                            {campo.type === 'table' && (
                                <div className="flex flex-col gap-4 mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <p className="font-semibold text-sm text-text-h">Configuração da Tabela</p>

                                    {/* Caixas de texto das Colunas */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Colunas da Tabela</label>
                                        {campo.options.map((coluna, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={coluna}
                                                    onChange={(e) => alterarColuna(campo.id, idx, e.target.value)}
                                                    placeholder={`Nome da Coluna ${idx + 1}`}
                                                    className={`flex-1 rounded-md border p-2 text-sm focus:outline-none ${fieldErrors[campo.id]?.options && (!coluna || coluna.trim() === '') ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removerColuna(campo.id, idx)}
                                                    disabled={campo.options.length <= 1}
                                                    className="flex-shrink-0 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    title="Remover coluna"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                        {fieldErrors[campo.id]?.options && <span className="text-red-500 text-sm">Todas as colunas têm de ter um nome.</span>}
                                    </div>

                                    {/* Botão de Adicionar Coluna + Toggle de Linhas */}
                                    <div className="flex flex-wrap items-center gap-6 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => adicionarColuna(campo.id)}
                                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm px-4 py-2 rounded-md font-semibold transition"
                                        >
                                            + Adicionar Coluna
                                        </button>

                                        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                            <input
                                                type="checkbox"
                                                checked={campo.tableFixedRows}
                                                onChange={(e) => alterarConfigTabela(campo.id, 'tableFixedRows', e.target.checked)}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            Número fixo de linhas?
                                        </label>

                                        {/* Caixa de Número de Linhas (Só aparece se o toggle estiver ativo) */}
                                        {campo.tableFixedRows && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium">Nº de linhas:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={campo.tableRowCount}
                                                    onChange={(e) => alterarConfigTabela(campo.id, 'tableRowCount', parseInt(e.target.value) || 1)}
                                                    className="rounded-md border border-accent-border p-1 w-16 text-center focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* 4. Opções do Menu Suspenso */}
                            {campo.type === "dropdown" && (
                                <div className="flex flex-col gap-2">
                                    <label className="font-medium text-sm text-text-h">Opções do menu</label>
                                    <input
                                        type="text"
                                        value={campo.options.join(', ')}
                                        onChange={(e) => alterarOptions(campo.id, e.target.value)}
                                        placeholder="Ex: Opção 1, Opção 2, Opção 3, ..."
                                        className={`rounded-md border p-2 focus:outline-none ${fieldErrors[campo.id]?.options ? 'border-red-500' : 'border-accent-border focus:border-blue-500'}`}
                                    />
                                    {fieldErrors[campo.id]?.options ? (
                                        <span className="text-red-500 text-sm">As opções não podem estar vazias.</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Separe as opções por vírgulas.</span>
                                    )}
                                </div>
                            )}

                            <label className="inline-flex items-center gap-2 text-sm font-medium mt-2">
                                <input
                                    type="checkbox"
                                    checked={campo.required}
                                    onChange={() => alterarObrigatorio(campo.id)}
                                    className="h-4 w-4 rounded border-accent-border"
                                />
                                Campo obrigatório
                            </label>

                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={() => eliminarCampo(campo.id)}
                                    className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:border-red-300"
                                >
                                    🗑️ Eliminar campo
                                </button>
                            </div>

                        </div>
                    ))}

                    <div className="mt-6 flex justify-end gap-4 border-t border-accent-border pt-4">
                        <button
                            disabled={isLoading}
                            type="submit"
                            id="save-draft"
                            className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
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

            <div className="fixed right-6 top-6 z-[60] flex max-w-sm flex-col gap-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
                    />
                ))}
            </div>

            {/* Modal de confirmação de publicação */}
            <ConfirmPublishModal
                isOpen={showConfirmPublish}
                onConfirm={handleConfirmPublish}
                onCancel={handleCancelPublish}
                isLoading={isLoading}
            />

            {/* Modal de confirmação de gravação de edição (rascunho existente) */}
            <ConfirmSaveEditModal
                isOpen={showConfirmSaveEdit}
                onConfirm={handleConfirmSaveEdit}
                onCancel={handleCancelSaveEdit}
                isLoading={isLoading}
            />
        </div>
    );
}