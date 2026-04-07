import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function PublicHeader({ lang = 'en', currentPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const navLinks = [
    { label: lang === 'es' ? 'Programas' : 'Programs', page: `Pathways?lang=${lang}` },
    { label: lang === 'es' ? 'Acerca de' : 'About', page: `About?lang=${lang}` },
    { label: lang === 'es' ? 'Cursos' : 'Courses', page: `Catalog?lang=${lang}` },
    { label: lang === 'es' ? 'Facultad' : 'Faculty', page: `Faculty?lang=${lang}` },
    { label: lang === 'es' ? 'Cómo Funciona' : 'How it works', page: `HowItWorks?lang=${lang}` },
    { label: lang === 'es' ? 'Apoyar' : 'Support', page: `Support?lang=${lang}` },
    { label: 'FAQ', page: `FAQ?lang=${lang}` },
    { label: lang === 'es' ? 'Contacto' : 'Contact', page: `Contact?lang=${lang}` },
  ];

  const dashboardPage = user?.role === 'admin' || user?.user_type === 'admin'
    ? `Admin?lang=${lang}`
    : user?.user_type === 'instructor'
      ? `InstructorDashboard?lang=${lang}`
      : `Dashboard?lang=${lang}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link to={createPageUrl('Home')} className="flex items-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png"
            alt="Waypoint Institute"
            className="h-12"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map(({ label, page }) => (
            <Link
              key={page}
              to={createPageUrl(page)}
              className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link to={createPageUrl(`Apply?lang=${lang}`)}>
                <Button size="sm" variant="outline" className="border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white hidden sm:inline-flex">
                  {lang === 'es' ? 'Aplicar' : 'Apply'}
                </Button>
              </Link>
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="bg-[#1e3a5f] hover:bg-[#2d5a8a] hidden lg:inline-flex">
                {lang === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </Button>
            </>
          ) : (
            <Link to={createPageUrl(dashboardPage)} className="hidden lg:inline-flex">
              <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                {lang === 'es' ? 'Mi Área de Aprendizaje' : 'My Learning Area'}
              </Button>
            </Link>
          )}

          {/* Hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg">
          <nav className="flex flex-col px-6 py-4 space-y-1">
            {navLinks.map(({ label, page }) => (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-slate-700 hover:text-[#1e3a5f] font-medium border-b border-slate-100 last:border-0 transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {!user ? (
                <>
                  <Link to={createPageUrl(`Apply?lang=${lang}`)} onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
                      {lang === 'es' ? 'Aplicar' : 'Apply'}
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                    {lang === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                  </Button>
                </>
              ) : (
                <Link to={createPageUrl(dashboardPage)} onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                    {lang === 'es' ? 'Mi Área de Aprendizaje' : 'My Learning Area'}
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}