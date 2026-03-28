import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * AdminDashboard Component
 * 
 * Página principal para administradores gerenciarem formulários.
 * Funcionalidades:
 * - Lista de formulários criados (atualmente vazia - placeholder)
 * - Botão para criar novo formulário
 * - Empty state com instruções quando não há formulários
 * 
 * Futura integração com API será implementada aqui.
 */
export default function AdminDashboard() {
  // TODO: Integrar com API .NET para buscar formulários
  const [forms] = useState([]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho com título e botão de ação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-h">Formulários</h2>
          <p className="mt-2 text-lg text-text">
            Gestão dos formulários institucionais
          </p>
        </div>

        {/* Botão para criar novo formulário */}
        <Link
          to="/create-form"
          className="inline-flex whitespace-nowrap rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-all hover:opacity-90 hover:shadow-custom active:scale-95 sm:self-center"
        >
         Criar Formulário
        </Link>
      </div>

      {/* Seção de formulários */}
      <div className="rounded-lg">
        {forms.length === 0 ? (
          // Empty state
          <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
            <p className="text-xl font-semibold text-text-h">
              Nenhum formulário criado ainda
            </p>
            <p className="mt-2 text-text">
              Clique no botão acima para criar seu primeiro formulário
            </p>
          </div>
        ) : (
          // Grid de formulários (quando existirem)
          <div className="grid auto-rows-max gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Componentes de formulário serão renderizados aqui */}
          </div>
        )}
      </div>
    </div>
  );
}
