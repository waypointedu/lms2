import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, BookOpen, User, Award } from 'lucide-react';

export default function MobileNav({ lang, currentPage }) {
  const navItems = [
    { icon: Home, label: lang === 'es' ? 'Inicio' : 'Home', page: 'Home' },
    { icon: BookOpen, label: lang === 'es' ? 'Cursos' : 'Courses', page: 'Catalog' },
    { icon: Award, label: lang === 'es' ? 'Logros' : 'Achievements', page: 'Achievements' },
    { icon: User, label: lang === 'es' ? 'Perfil' : 'Profile', page: 'Dashboard' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ icon: Icon, label, page }) => {
          const isActive = currentPage === page;
          return (
            <Link
              key={page}
              to={createPageUrl(`${page}?lang=${lang}`)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-[#1e3a5f]' : 'text-slate-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}