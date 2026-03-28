import { Link } from 'react-router-dom';

/**
 * CreateForm Component
 * 
 * Página para criação de novo formulário.
 * Esta página fornece a estrutura base onde as sub-issues subsequentes
 * irão adicionar os campos de entrada (nome, descrição, etc).
 * 
 * Estrutura:
 * - Header com botão voltar
 * - Espaço reservado para componentes filhos
 * - Será integrada com a API .NET para persistência
 * 
 * Próximas etapas (#30):
 * - Adicionar campo de texto para nome
 * - Adicionar campo de texto para descrição
 * - Implementar validação
 * - Conectar com API de criação de formulários
 */
export default function CreateForm() {
  return (
    <div className="space-y-6">
      {/* Header da página com botão de voltar */}
      <div className="flex flex-col gap-4">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 font-semibold text-accent transition-all hover:opacity-80"
        >
          ← Voltar
        </Link>
        <h2 className="text-3xl font-bold text-text-h">Novo Formulário</h2>
      </div>

      {/* Container principal do formulário */}
      <div className="space-y-4">
        {/* Placeholder - Espaço vazio onde os campos serão adicionados */}
        {/* 
          IMPORTANTE PARA #30:
          Substituir este placeholder pelos campos de entrada:
          - Campo de texto: Nome do Formulário (obrigatório)
          - Campo de texto: Descrição (opcional)
          - Botão: Salvar (POST para API)
          - Validação básica de preenchimento
        */}
        <div className="flex min-h-96 items-center justify-center rounded-lg border-2 border-dashed border-accent-border bg-accent-bg">
          <div className="text-center">
            <p className="text-lg text-text-h">
              Os campos do formulário aparecerão aqui
            </p>
            <p className="mt-2 text-text">
              (Este espaço será preenchido na issue #30)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
