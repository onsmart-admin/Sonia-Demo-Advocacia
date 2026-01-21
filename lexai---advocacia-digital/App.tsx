
import React, { useState } from 'react';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import Specialties from './components/Specialties.tsx';
import Footer from './components/Footer.tsx';
import ElevenLabsWidget from './components/ElevenLabsWidget.tsx';

const App: React.FC = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Navbar onAssistantClick={() => setIsWidgetOpen(true)} />
      
      <main className="flex-grow">
        <Hero onAssistantClick={() => setIsWidgetOpen(true)} />
        
        <section id="especialidades" className="py-24 bg-navy-dark">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-serif text-center mb-16 text-white">
              Nossas <span className="text-gold">Especialidades</span>
            </h2>
            <Specialties />
          </div>
        </section>

        <section id="ia-assistente" className="py-24 bg-navy-card">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-serif text-gold mb-4">Consulta Inteligente Machado e Costa</h2>
              <p className="text-gray-400">
                Experimente o futuro do atendimento jurídico. Converse com nosso assistente especializado por texto ou voz para triagem inicial e dúvidas frequentes.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto bg-navy-dark rounded-xl border border-gray-800 shadow-2xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-12 text-center">
               
               <div className="bg-yellow-900/20 p-4 rounded-full mb-6">
                 <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
               </div>
               <h3 className="text-2xl font-semibold mb-3">Como podemos ajudar hoje?</h3>
               <p className="text-gray-400 max-w-sm">
                 Selecione uma das opções acima para iniciar sua interação com nosso assistente inteligente.
               </p>
               <button 
                onClick={() => setIsWidgetOpen(true)}
                className="mt-8 bg-gold text-black px-8 py-3 rounded-md font-bold hover:bg-yellow-500 transition-all shadow-lg"
               >
                 Abrir Assistente Completo
               </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          className="bg-gold hover:bg-yellow-500 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
          title="Falar com Assistente IA"
        >
          {isWidgetOpen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          )}
        </button>
      </div>

      <ElevenLabsWidget isOpen={isWidgetOpen} onClose={() => setIsWidgetOpen(false)} />
    </div>
  );
};

export default App;
