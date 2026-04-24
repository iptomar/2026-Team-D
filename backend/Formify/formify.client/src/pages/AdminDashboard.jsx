import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * AdminDashboard Component
 * 
 * Página principal para administradores gerenciarem formulários.
 * Funcionalidades:
 * - Lista de formulários criados
 * - Empty state com instruções quando não há formulários
 * 
 * Futura integração com API será implementada aqui.
 */
export default function AdminDashboard() {
  // TODO: Integrar com API .NET para buscar formulários
    const [forms, setForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCargo, setSelectedCargo] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDate, setSortDate] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const formsPerPage = 12;

    useEffect(() => {
        const fetchForms = async () => {
            try {
                // Substitui pela URL real do teu endpoint .NET
                const response = await fetch('http://localhost:5208/api/Forms');

                if (!response.ok) {
                    throw new Error('Erro ao procurar formulários');
                }

                const data = await response.json();
                console.log(data.toString());
                setForms(data); // Atualiza o estado com os dados do backend
            } catch (error) {
                console.error("Erro na integração:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForms();
    }, []); // O array vazio garante que isto só corre uma vez

    const normalizeText = (value) =>
        (value || '')
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const getAudience = (form) => {
        const rawAudience = form.audience || form.Audience || [];
        if (Array.isArray(rawAudience)) {
            return rawAudience.map(normalizeText);
        }

        return [normalizeText(rawAudience)];
    };

    const matchesCargo = (form) => {
        if (selectedCargo === 'todos') return true;

        const audience = getAudience(form);
        const hasTeacher = audience.includes('teacher');
        const hasStaff = audience.includes('staff');
        const hasBoth = hasTeacher && hasStaff;

        if (selectedCargo === 'professores') {
            return hasTeacher || hasBoth;
        }

        if (selectedCargo === 'funcionarios') {
            return hasStaff || hasBoth;
        }

        return hasBoth;
    };

    const filteredForms = forms
        .filter(matchesCargo)
        .filter((form) => {
            const term = normalizeText(searchTerm.trim());
            if (!term) return true;

            const title = normalizeText(form.title || form.Title || '');
            const description = normalizeText(form.description || form.Description || '');
            const searchableText = `${title} ${description}`;

            const tokens = term.split(/\s+/).filter(Boolean);
            const words = searchableText.split(/[^a-z0-9]+/).filter(Boolean);

            return tokens.every((token) => words.some((word) => word.startsWith(token)));
        });

    const filteredAndSortedForms = [...filteredForms].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.CreatedAt || 0).getTime();

        if (sortDate === 'oldest') {
            return dateA - dateB;
        }

        return dateB - dateA;
    });

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedForms.length / formsPerPage));
    const indexOfLastForm = currentPage * formsPerPage;
    const indexOfFirstForm = indexOfLastForm - formsPerPage;
    const paginatedForms = filteredAndSortedForms.slice(indexOfFirstForm, indexOfLastForm);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCargo, sortDate]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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

    console.log(forms);

  return (
    <div className="min-h-[calc(100vh-140px)] space-y-8 flex flex-col">
      {/* Cabeçalho com título e botão de ação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-h">Formulários</h2>
          <p className="mt-2 text-lg text-text">
            Gestão dos formulários institucionais
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
              <label htmlFor="search-form" className="font-medium text-text-h">Pesquisar</label>
              <input
                  id="search-form"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome ou palavras-chave"
                  className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
              />
          </div>

          <div className="flex flex-col gap-2">
              <label htmlFor="cargo-filter" className="font-medium text-text-h">Cargo</label>
              <select
                  id="cargo-filter"
                  value={selectedCargo}
                  onChange={(e) => setSelectedCargo(e.target.value)}
                  className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
              >
                  <option value="todos">Todos</option>
                  <option value="professores">Professores</option>
                  <option value="funcionarios">Funcionários</option>
              </select>
          </div>

          <div className="flex flex-col gap-2">
              <label htmlFor="date-sort" className="font-medium text-text-h">Data de criação</label>
              <select
                  id="date-sort"
                  value={sortDate}
                  onChange={(e) => setSortDate(e.target.value)}
                  className="rounded-md border border-accent-border bg-white p-2 focus:border-blue-500 focus:outline-none"
              >
                  <option value="newest">Mais novos primeiro</option>
                  <option value="oldest">Mais velhos primeiro</option>
              </select>
          </div>
      </div>

      {/* Seção de formulários */}
      <div className="rounded-lg flex-1 flex flex-col">
              {/* Condição para careregar os dados. Quando o useEffect estiver a correr ele dá uma ajuda visual*/}
              {/* Caso o fetch nao retorne nada, mostra um div, caso contrário mostra aquilo que existe no json*/}
              {isLoading ? (
                  <div className="text-center py-12 text-text">A carregar formulários...</div>
              ) : filteredAndSortedForms.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-accent-border bg-accent-bg px-8 py-12 text-center">
                      <p className="text-xl font-semibold text-text-h">Nenhum formulário encontrado</p>
                      <p className="mt-2 text-text">Tenta ajustar os filtros ou pesquisa</p>
                  </div>
              ) : (
                  <>
                      <div className="grid auto-rows-max gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {/* 3. Renderização dinâmica dos cards */}
                          {paginatedForms.map((form) => (
                              <div key={form.id || form.Id} className="rounded-lg border border-accent-border p-6 shadow-sm hover:shadow-md transition-shadow">
                                  <h3 className="font-bold text-lg text-text-h">{form.title || form.Title || "Sem título"}</h3>
                                  <p className="text-sm text-text mt-2">{form.description || form.Description}</p>
                                  <button
                                      onClick={() => handleDelete(form.id || form.Id)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                      title="Eliminar"
                                  >
                                      🗑️ Eliminar
                                  </button>
                              </div>
                          ))}
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-between">
                          <button
                              type="button"
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="rounded-md border border-accent-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                              Anterior
                          </button>

                          <span className="text-sm text-text">
                              Página {currentPage} de {totalPages}
                          </span>

                          <button
                              type="button"
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="rounded-md border border-accent-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                              Próxima
                          </button>
                      </div>
                  </>
              )}
      </div>
    </div>
  );
}

