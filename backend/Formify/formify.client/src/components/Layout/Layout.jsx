import Sidebar from './Sidebar';

/**
 * Layout Component
 * 
 * Estrutura principal da aplicação com navegação lateral fixa.
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-white">
      <Sidebar />

      <div className="flex min-h-screen min-h-[100dvh] flex-1 flex-col">
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
