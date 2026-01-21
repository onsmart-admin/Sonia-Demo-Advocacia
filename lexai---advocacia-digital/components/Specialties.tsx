
import React from 'react';

const specialties = [
  {
    title: 'Direito Digital',
    description: 'Proteção de dados, crimes cibernéticos e conformidade com a LGPD para empresas inovadoras.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    )
  },
  {
    title: 'Direito Civil',
    description: 'Gestão de contratos, responsabilidade civil e soluções de conflitos com agilidade e técnica.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )
  },
  {
    title: 'Direito Corporativo',
    description: 'Consultoria estratégica para fusões, aquisições e estruturação societária de alto nível.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )
  },
  {
    title: 'Direito de Família',
    description: 'Atendimento humanizado em processos de sucessão, divórcio e planejamento familiar.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )
  }
];

const Specialties: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {specialties.map((item, idx) => (
        <div key={idx} className="bg-navy-card border border-gray-800 p-8 rounded-lg hover:border-gold/50 transition-all group flex flex-col">
          <div className="text-gold mb-6 group-hover:scale-110 transition-transform origin-left">
            {item.icon}
          </div>
          <h3 className="text-xl font-bold mb-4 group-hover:text-gold transition-colors">{item.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Specialties;
