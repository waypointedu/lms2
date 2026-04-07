import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, GraduationCap, Users, Globe, Star, ChevronRight, Menu, X } from "lucide-react";
import CourseCard from '@/components/courses/CourseCard';

// Hero Background Component
function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src="https://media.base44.com/images/public/69826d34529ac930f0c94f5a/40c45841e_pexels-pixabay-355288.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: '50% 50%' }}
      />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
    }).catch(() => setUser(null));
  }, []);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' }),
    select: (data) => data.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const featuredCourses = courses.slice(0, 3);
  const enrolledCourseIds = enrollments.map(e => e.course_id);

  const text = {
    en: {
      hero: "Toward that which truly",
      heroItalic: "is.",
      tagline: "A tuition-free Christian college education that pursues the Good, the True, and the Beautiful.",
      description: "Waypoint Institute offers a supporter-funded, tuition-free college pathway in Scripture, doctrine, culture, and mission. Learn through self-paced modules, guided checkpoints, and oral capstones that keep formation personal and flexible.",
      browse: "Browse Courses",
      myCourses: "My Courses",
      features: [
        { icon: GraduationCap, title: "Tuition-free college", desc: "Your formation is fully covered by supporters" },
        { icon: BookOpen, title: "Self-paced flexibility", desc: "Study around real life while staying on track" },
        { icon: Users, title: "Capstones that form witnesses", desc: "Oral examinations with faculty guidance" }
      ],
      featured: "Featured Courses",
      viewAll: "View all courses"
    },
    es: {
      hero: "Hacia lo que verdaderamente",
      heroItalic: "es.",
      tagline: "Una educación universitaria cristiana sin matrícula que persigue el Bien, la Verdad y la Belleza.",
      description: "Waypoint Institute ofrece una vía universitaria sin matrícula financiada por colaboradores en Escritura, doctrina, cultura y misión. Aprende a través de módulos a tu ritmo, puntos de control guiados y capstones orales que mantienen la formación personal y flexible.",
      browse: "Explorar Cursos",
      myCourses: "Mis Cursos",
      features: [
        { icon: GraduationCap, title: "Universidad sin matrícula", desc: "Tu formación está cubierta por colaboradores" },
        { icon: BookOpen, title: "Flexibilidad a tu ritmo", desc: "Estudia según tu vida real" },
        { icon: Users, title: "Capstones formativos", desc: "Exámenes orales con guía docente" }
      ],
      featured: "Cursos Destacados",
      viewAll: "Ver todos los cursos"
    }
  };

  const t = text[lang];



  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" 
              alt="Waypoint Institute" 
              className="h-12" 
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            <Link to={createPageUrl(`Pathways?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Programas' : 'Programs'}
            </Link>
            <Link to={createPageUrl(`About?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Acerca de' : 'About'}
            </Link>
            <Link to={createPageUrl(`Catalog?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Cursos' : 'Courses'}
            </Link>
            <Link to={createPageUrl(`Faculty?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Facultad' : 'Faculty'}
            </Link>
            <Link to={createPageUrl(`HowItWorks?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Cómo Funciona' : 'How it works'}
            </Link>
            <Link to={createPageUrl(`Support?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Apoyar' : 'Support'}
            </Link>
            <Link to={createPageUrl(`FAQ?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              FAQ
            </Link>
            <Link to={createPageUrl(`Contact?lang=${lang}`)} className="text-slate-700 hover:text-[#1e3a5f] transition-colors font-medium">
              {lang === 'es' ? 'Contacto' : 'Contact'}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to={createPageUrl(`Apply?lang=${lang}`)}>
                  <Button size="sm" variant="outline" className="border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white hidden sm:inline-flex">
                    {lang === 'es' ? 'Aplicar' : 'Apply'}
                  </Button>
                </Link>
                <button onClick={() => base44.auth.redirectToLogin()} className="text-sm text-slate-400 hover:text-slate-600 transition-colors hidden lg:inline-flex">
                  {lang === 'es' ? 'Portal de estudiantes' : 'Current Students'}
                </button>
              </>
            ) : (
              <Link to={createPageUrl(user.role === 'admin' || user.user_type === 'admin' ? `Admin?lang=${lang}` : user.user_type === 'instructor' ? `InstructorDashboard?lang=${lang}` : `Dashboard?lang=${lang}`)}>
                <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#2d5a8a] hidden lg:inline-flex">
                  {lang === 'es' ? 'Mi Área de Aprendizaje' : 'My Learning Area'}
                </Button>
              </Link>
            )}
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg">
            <nav className="flex flex-col px-6 py-4 space-y-1">
              {[
                { label: lang === 'es' ? 'Programas' : 'Programs', page: `Pathways?lang=${lang}` },
                { label: lang === 'es' ? 'Acerca de' : 'About', page: `About?lang=${lang}` },
                { label: lang === 'es' ? 'Cursos' : 'Courses', page: `Catalog?lang=${lang}` },
                { label: lang === 'es' ? 'Facultad' : 'Faculty', page: `Faculty?lang=${lang}` },
                { label: lang === 'es' ? 'Cómo Funciona' : 'How it works', page: `HowItWorks?lang=${lang}` },
                { label: lang === 'es' ? 'Apoyar' : 'Support', page: `Support?lang=${lang}` },
                { label: 'FAQ', page: `FAQ?lang=${lang}` },
                { label: lang === 'es' ? 'Contacto' : 'Contact', page: `Contact?lang=${lang}` },
              ].map(({ label, page }) => (
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
                    <button onClick={() => base44.auth.redirectToLogin()} className="text-sm text-slate-400 hover:text-slate-600 transition-colors text-center w-full py-1">
                      {lang === 'es' ? 'Portal de estudiantes' : 'Current Students'}
                    </button>
                  </>
                ) : (
                  <Link to={createPageUrl(user.role === 'admin' || user.user_type === 'admin' ? `Admin?lang=${lang}` : user.user_type === 'instructor' ? `InstructorDashboard?lang=${lang}` : `Dashboard?lang=${lang}`)} onClick={() => setMobileMenuOpen(false)}>
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

      {/* Hero Section */}
      <section className="relative h-[75vh] flex items-end overflow-hidden pt-20">
        {/* Background */}
        <HeroBackground />

        <div className="relative z-10 px-8 pb-12 md:px-12 md:pb-16" />
      </section>

      {/* Tagline Section - Below Hero */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 leading-tight">
            to{' '}
            <em className="text-[#c4933f] font-serif">all</em>
            {' '}the nations
          </h1>
        </div>
      </section>

      {/* Tagline & Description Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl text-slate-700 mb-6 font-light">
            A tuition-free Christian college education that pursues the Good, the True, and the Beautiful.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            Waypoint Institute offers a supporter-funded, tuition-free college pathway in Scripture, doctrine, culture, and mission. Learn through self-paced modules, guided checkpoints, and oral capstones that keep formation personal and flexible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl(`Apply?lang=${lang}`)}>
              <Button size="lg" className="bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white gap-2 w-full sm:w-auto px-8 h-12 text-base">
                {lang === 'es' ? 'Aplicar' : 'Apply'}
              </Button>
            </Link>
            <Link to={createPageUrl(`Support?lang=${lang}`)}>
              <Button size="lg" variant="outline" className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white w-full sm:w-auto px-8 h-12 text-base">
                {lang === 'es' ? 'Apoyar' : 'Support'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-6 mx-auto">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Tuition-free college</h3>
              <p className="text-slate-600 leading-relaxed">Your college-level formation is fully covered by supporters, so tuition, testing, and resources never become barriers.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-6 mx-auto">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Self-paced flexibility</h3>
              <p className="text-slate-600 leading-relaxed">Move through modular lessons and shared checkpoints so you can study around real life while staying on track.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-6 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Capstones that form witnesses</h3>
              <p className="text-slate-600 leading-relaxed">Every course ends with a recorded oral examination so faculty can affirm mastery and shepherd growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4">{t.featured}</h2>
            <p className="text-lg text-slate-600">
              {lang === 'es' 
                ? 'Explora nuestros programas de estudio'
                : 'Explore our programs of study'}
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  lang={lang}
                  enrolled={enrolledCourseIds.includes(course.id)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to={createPageUrl(`Catalog?lang=${lang}`)}>
              <Button variant="outline" className="border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
                {t.viewAll}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-8 text-center">Who we serve</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
              <p className="text-lg text-slate-600">Christians and seekers worldwide who need serious formation without cost.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
              <p className="text-lg text-slate-600">Students in a variety of languages and contexts who benefit from self-paced weeks with shared milestones.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
              <p className="text-lg text-slate-600">Lay leaders and bi-vocational ministers seeking structured study alongside ministry life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" 
                alt="Waypoint Institute" 
                className="h-12 brightness-0 invert mb-4" 
              />
              <p className="text-white/80 max-w-md">
                {lang === 'es' 
                  ? 'Guiados por la Gran Comisión, vamos y hacemos discípulos de todas las naciones.'
                  : 'Guided by the Great Commission, we go and make disciples of all nations.'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">{lang === 'es' ? 'Explorar' : 'Explore'}</h4>
              <ul className="space-y-3 text-white/80">
                <li><Link to={createPageUrl(`Pathways?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Programas' : 'Programs'}</Link></li>
                <li><Link to={createPageUrl(`Catalog?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Cursos' : 'Courses'}</Link></li>
                <li><Link to={createPageUrl(`Faculty?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Facultad' : 'Faculty'}</Link></li>
                <li><Link to={createPageUrl(`HowItWorks?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Cómo funciona' : 'How it works'}</Link></li>
                <li><Link to={createPageUrl(`About?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Acerca de' : 'About'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">{lang === 'es' ? 'Participar' : 'Get Involved'}</h4>
              <ul className="space-y-3 text-white/80">
                <li><Link to={createPageUrl(`Apply?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Aplicar' : 'Apply'}</Link></li>
                <li><Link to={createPageUrl(`Support?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Apoyar' : 'Support'}</Link></li>
                <li><Link to={createPageUrl(`Contact?lang=${lang}`)} className="hover:text-white transition-colors">{lang === 'es' ? 'Contacto' : 'Contact'}</Link></li>
                <li><Link to={createPageUrl(`FAQ?lang=${lang}`)} className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-center text-white/60 text-sm">
            © {new Date().getFullYear()} Waypoint Institute. {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  );
}