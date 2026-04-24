import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * AdminDashboard Component
 * 
 * Funcionalidades:
 * - Lista de formulários criados mas em rascunho
 */
export default function AdminDashboard() {
  // TODO: Integrar com API .NET para buscar formulários
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                // Substitui pela URL real do teu endpoint .NET
                const response = await fetch('http://localhost:5208/api/Forms');

                if (!response.ok) {
                    throw new Error('Erro ao procurar formulários');
                }

                const data = await response.json();
                setForms(data); // Atualiza o estado com os dados do backend
            } catch (error) {
                console.error("Erro na integração:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForms();
    }, []); // O array vazio garante que isto só corre uma vez

    const handleDelete = async (id) => {
        const confirmacao = window.confirm("Tens a certeza que queres eliminar este formulário?");
        if (!confirmacao) return;

        try {
            const response = await fetch(`/api/Forms/${id}`, { method: 'DELETE' });
            if (response.ok) {
                // Remove o formulário da lista no ecrã imediatamente
                setForms(forms.filter(form => form.id !== id && form.Id !== id));
            } else {
                alert('Erro ao eliminar formulário.');
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Não foi possível ligar ao servidor.");
        }
    };

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
      </div>

      {/* Secção de formulários */}
      <div className="rounded-lg">
              {/* Condição para careregar os dados. Quando o useEffect estiver a correr ele dá uma ajuda visual*/}
              {/* Caso o fetch nao retorne nada, mostra um div, caso contrário mostra aquilo que existe no json*/}
              {isLoading ? (
                  <div className="text-center py-12 text-text">A carregar formulários...</div>
              ) : forms.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
                      <p className="text-xl font-semibold text-text-h">Nenhum formulário criado ainda</p>
                      <p className="mt-2 text-text">Clique no botão acima para criar seu primeiro formulário</p>
                  </div>
              ) : (
                  <div className="grid auto-rows-max gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {/* 3. Renderização dinâmica dos cards */}
                              {forms.filter((form) => (form.statusDrafted || form.StatusDrafted) === true).map((form) => (
                                  <div key={form.Id || form.id || Math.random()} className="rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md transition-shadow">
                                      <h3 className="font-bold text-lg text-text-h">{form.Title || form.title || "Sem título"}</h3>
                                      <p className="text-sm text-text mt-2">{form.Description || form.description}</p>

                                      <button
                                          onClick={() => handleDelete(form.Id || form.id)}
                                          className="text-red-500 hover:text-red-700 transition-colors"
                                          title="Eliminar"
                                      >
                                          🗑️ Eliminar
                                      </button>
                                  </div>
                              ))}
                  </div>
              )}
      </div>
    </div>
  );
}
