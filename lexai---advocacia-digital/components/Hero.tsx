
import React from 'react';

interface HeroProps {
  onAssistantClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAssistantClick }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-navy-dark">
      {/* Background image overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=2000" 
          alt="Lady Justice" 
          className="w-full h-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-transparent to-navy-dark"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-serif leading-tight mb-6">
            Excelência Jurídica <br />
            na Era <span className="text-gold">Digital.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
            Combinamos décadas de experiência em advocacia com a mais alta tecnologia para oferecer um atendimento ágil, preciso e humanizado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onAssistantClick}
              className="bg-gold text-black px-8 py-4 rounded-md font-bold flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all shadow-xl group"
            >
              Falar com Assistente IA
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <a 
              href="#especialidades"
              className="border border-gray-700 text-white px-8 py-4 rounded-md font-bold hover:bg-white/5 transition-all text-center"
            >
              Conhecer Nossas Áreas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
