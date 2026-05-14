import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Layout Component
 *
 * Estrutura principal da aplicação.
 * Em rotas públicas (landing, login, registo) a sidebar é omitida.
 */
export default function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const publicRoutes = ['/', '/login', '/register'];
  const isPublic = publicRoutes.includes(path);

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-white">
      {!isPublic && <Sidebar />}

      <div className="flex min-h-screen min-h-[100dvh] flex-1 flex-col">
        <main className={`flex-1 ${isPublic ? '' : 'px-4 py-8 sm:px-6 lg:px-8'}`}>
          {children}
        </main>

        <footer className="border-t border-black px-4 py-4 text-center text-sm text-text sm:px-6 lg:px-8">
          <p>© Formify 2026. Todos os direitos reservados.</p>
          <p>Criado com React e .NET 10</p>
        </footer>
      </div>
    </div>
  );
}
