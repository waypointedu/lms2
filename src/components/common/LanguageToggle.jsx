import React from 'react';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageToggle({ currentLang, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-500" />
      <div className="flex rounded-full bg-slate-100 p-0.5">
        <button
          onClick={() => onToggle('en')}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
            currentLang === 'en'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => onToggle('es')}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
            currentLang === 'es'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ES
        </button>
      </div>
    </div>
  );
}