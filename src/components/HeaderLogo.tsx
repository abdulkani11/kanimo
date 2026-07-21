import React from 'react';
// @ts-ignore
import logoImg from '../assets/images/dual_airline_logo.png';

interface HeaderLogoProps {
  sidebar?: boolean;
}

export default function HeaderLogo({ sidebar = false }: HeaderLogoProps) {
  if (sidebar) {
    return (
      <div className="w-full bg-white rounded-2xl p-1 border border-slate-700/50 flex items-center justify-center shadow-md shadow-black/10 hover:border-slate-650 transition-all duration-300">
        <img 
          src={logoImg} 
          alt="Noble & Ethiopian Airlines Logo" 
          className="w-full h-auto max-h-[80px] object-contain"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm backdrop-blur-md mb-6 hover:shadow-md transition-all duration-300 flex items-center justify-center">
      <img 
        src={logoImg} 
        alt="Noble & Ethiopian Airlines Logo" 
        className="w-full h-auto max-h-[112px] object-contain"
      />
    </div>
  );
}
