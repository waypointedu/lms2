import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';

export default function Library() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const text = {
    en: {
      title: 'Library',
      comingSoon: 'Coming Soon',
      description: 'Our digital library is currently under development. Check back soon for access to thousands of theological and academic resources.',
      backHome: 'Back to Home'
    },
    es: {
      title: 'Biblioteca',
      comingSoon: 'Próximamente',
      description: 'Nuestra biblioteca digital está actualmente en desarrollo. Vuelve pronto para acceder a miles de recursos teológicos y académicos.',
      backHome: 'Volver al Inicio'
    }
  };

  const t = text[lang];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <BookOpen className="w-20 h-20 text-[#1e3a5f] mx-auto mb-6" />
        <h1 className="text-4xl font-light text-slate-900 mb-4">{t.title}</h1>
        <div className="inline-block bg-amber-100 text-amber-900 px-4 py-2 rounded-full font-medium mb-8">
          {t.comingSoon}
        </div>
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
          {t.description}
        </p>
        <Link to={createPageUrl(`Home?lang=${lang}`)}>
          <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backHome}
          </Button>
        </Link>
      </div>
    </div>
  );
}