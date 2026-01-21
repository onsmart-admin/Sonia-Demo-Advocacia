
import React from 'react';

interface NavbarProps {
  onAssistantClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAssistantClick }) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-40 bg-transparent py-6">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gold p-1.5 rounded">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">LEX<span className="text-gold">AI</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-300">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-gold transition-colors">Início</a>
          <a href="#especialidades" className="hover:text-gold transition-colors">Áreas de Atuação</a>
          <a href="#ia-assistente" onClick={(e) => { e.preventDefault(); onAssistantClick(); }} className="hover:text-gold transition-colors cursor-pointer">IA Assistente</a>
        </div>

        <button 
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="bg-gold text-black px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 transition-colors hidden sm:block"
        >
          Agendar Consulta
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
