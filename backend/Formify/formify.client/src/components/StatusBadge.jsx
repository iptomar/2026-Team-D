const STATUS_CONFIG = {
    Pending: {
        label: 'Pendente',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    Approved: {
        label: 'Aprovado',
        className: 'bg-green-50 text-green-700 border-green-200',
    },
    Refused: {
        label: 'Recusado',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
};

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] ?? {
        label: status ?? 'Desconhecido',
        className: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
            {config.label}
        </span>
    );
}