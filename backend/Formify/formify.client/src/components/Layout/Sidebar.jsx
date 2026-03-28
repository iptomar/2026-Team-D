import { Link } from 'react-router-dom';

/**
 * Sidebar Component
 * 
 * Navegação lateral principal da aplicação.
 */
export default function Sidebar() {
  return (
    <aside className="w-64 border-r-2 border-black bg-white px-4 py-6">
      <div className="mb-6 border-b border-black pb-4">
              <h1 className="text-2xl font-bold text-accent text-center">Formify</h1>
      </div>

      <nav className="space-y-2">
        <Link
          to="/"
          className="block rounded-lg px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-accent-bg hover:text-accent"
        >
         Formulários
        </Link>

      </nav>
    </aside>
  );
}
