import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Library, LayoutDashboard } from 'lucide-react';

export default function StudentNav({ lang, currentPage }) {
  const text = {
    en: {
      myCourses: 'My Courses',
      library: 'Library',
      dashboard: 'Dashboard'
    },
    es: {
      myCourses: 'Mis Cursos',
      library: 'Biblioteca',
      dashboard: 'Panel'
    }
  };

  const t = text[lang];

  const navItems = [
    { label: t.myCourses, page: 'Dashboard', icon: BookOpen },
    { label: t.library, page: 'Library', icon: Library },
    { label: t.dashboard, page: 'Dashboard', icon: LayoutDashboard }
  ];

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.page}
          to={createPageUrl(`${item.page}?lang=${lang}`)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            currentPage === item.page
              ? 'text-[#1e3a5f]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}