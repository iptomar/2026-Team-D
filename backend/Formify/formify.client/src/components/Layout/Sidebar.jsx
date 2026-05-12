import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * Sidebar Component
 *
 * Navegação lateral principal da aplicação.
 * Os itens do menu mudam consoante a rota:
 *  - Rotas de utilizador (/funcionario, /professor) → menu de utilizador
 *  - Restantes rotas → menu de administração
 */
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname.toLowerCase();
  const isFuncionario = path.startsWith('/funcionario');
  const isProfessor = path.startsWith('/professor');
  const isUserView = isFuncionario || isProfessor;

  const linkCls =
    'block rounded-lg px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent';
  const buttonCls =
    'block w-full text-left rounded-lg px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent';

  // Placeholder enquanto não existe sistema de autenticação real.
  const handleFakeAction = (label) => {
    alert(`${label}: funcionalidade em desenvolvimento.`);
  };

  const handleLogout = () => {
    alert('Sessão terminada (mock).');
    navigate('/');
  };

  return (
    <aside className="w-64 border-r-2 border-black bg-white px-4 py-6">
      <div className="mb-6 border-b border-black pb-4">
        <h1 className="text-2xl font-bold text-accent text-center">Formify</h1>
      </div>

      <nav className="space-y-2">
        {isUserView ? (
          <>
            <Link to={isFuncionario ? '/funcionario' : '/professor'} className={linkCls}>
              Formulários
            </Link>
            <button
              type="button"
              onClick={() => handleFakeAction('Formulários Preenchidos')}
              className={buttonCls}
            >
              Formulários Preenchidos
            </button>
            <button
              type="button"
              onClick={() => handleFakeAction('Informações Pessoais')}
              className={buttonCls}
            >
              Informações Pessoais
            </button>
            <button type="button" onClick={handleLogout} className={buttonCls}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/" className={linkCls}>
              Formulários
            </Link>
            <Link to="/DraftedForms" className={linkCls}>
              Formulários em Rascunho
            </Link>
            <Link to="/CreateForm" className={linkCls}>
              Criar Formulário
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
