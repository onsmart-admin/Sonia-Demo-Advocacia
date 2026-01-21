
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-dark border-t border-gray-900 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-gold p-1 rounded">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              </div>
              <span className="text-xl font-bold tracking-tighter text-white">LEX<span className="text-gold">AI</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Redefinindo os limites do possível no mundo jurídico através da excelência profissional e tecnologia de ponta.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-8">Contato</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <svg className="w-5 h-5 text-gold mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <div className="text-sm">
                  <p className="text-white font-medium">+55 (11) 9999-9999</p>
                  <p className="text-gray-500">Atendimento 24/7 via Assistente IA</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <svg className="w-5 h-5 text-gold mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <div className="text-sm">
                  <p className="text-white font-medium">contato@lexai.adv.br</p>
                  <p className="text-gray-500">Respostas em até 24 horas úteis</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <svg className="w-5 h-5 text-gold mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div className="text-sm">
                  <p className="text-white font-medium">Av. Paulista, 1000 - Bela Vista</p>
                  <p className="text-gray-500">São Paulo - SP, 01310-100</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
            © 2025 LexAI Advocacia Inteligente. Todos os direitos reservados. OAB/SP 000.000.
          </p>
          <p className="text-[10px] text-gray-700 uppercase tracking-widest">
            Powered by LEX - Advanced AI Agent Technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
