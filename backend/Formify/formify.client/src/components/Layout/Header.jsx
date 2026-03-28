import { Link } from 'react-router-dom';

/**
 * Header Component
 * 
 * Barra superior minimalista da aplicação.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-100 border-b border-border bg-white shadow-custom">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-accent sm:text-3xl">Formify</h1>
        </div>
      </div>
    </header>
  );
}
