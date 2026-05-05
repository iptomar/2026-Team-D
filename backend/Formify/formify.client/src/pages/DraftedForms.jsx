import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * AdminDashboard Component
 * 
 * Funcionalidades:
 * - Lista de formulários criados mas em rascunho
 */
export default function AdminDashboard() {
    const navigate = useNavigate(); 

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
                              {forms
                                  .filter((form) => (form.statusDrafted || form.StatusDrafted) === true)
                                  .map((form) => {
                                      const id = form.id || form.Id;

                                      return (
                                          <div
                                              key={id || Math.random()}
                                              // 1. Click anywhere to navigate to View
                                              onClick={() => navigate(`/ViewForm/${id}`)}
                                              className="group flex flex-col rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-white"
                                          >
                                              <div className="mb-3 flex items-start justify-between gap-3">
                                                  <h3 className="font-bold text-lg text-text-h group-hover:text-blue-600 transition-colors">
                                                      {form.Title || form.title || "Sem título"}
                                                  </h3>
                                                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                                                      Rascunho
                                                  </span>
                                              </div>

                                              <p className="text-sm text-text line-clamp-2 mb-4">
                                                  {form.Description || form.description || "Nenhuma descrição fornecida."}
                                              </p>

                                              {/* Zona dos botões */}
                                              <div className="flex justify-end gap-4 border-t border-accent-border pt-4 mt-auto">
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation(); // 2. Stop navigation to View
                                                          navigate(`/edit-form/${id}`);
                                                      }}
                                                      className="text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                                                      title="Editar"
                                                  >
                                                      ✏️ Editar
                                                  </button>
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation(); // 2. Stop navigation to View
                                                          handleDelete(id);
                                                      }}
                                                      className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium flex items-center gap-1"
                                                      title="Eliminar"
                                                  >
                                                      🗑️ Eliminar
                                                  </button>
                                              </div>
                                          </div>
                                      );
                                  })}
                          </div>
              )}
      </div>
    </div>
  );
}
