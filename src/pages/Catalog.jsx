import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowLeft, Star } from "lucide-react";
import CourseCard from '@/components/courses/CourseCard';
import PublicHeader from '@/components/common/PublicHeader';

export default function Catalog() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
    const newUrl = `${window.location.pathname}?lang=${lang}`;
    window.history.replaceState({}, '', newUrl);
  }, [lang]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
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

  const allTags = [...new Set(courses.flatMap(c => c.tags || []))];
  const enrolledCourseIds = enrollments.map(e => e.course_id);

  const filteredCourses = courses.filter(course => {
    const title = course[`title_${lang}`] || course.title_en;
    const description = course[`description_${lang}`] || course.description_en;
    const matchesSearch = searchQuery === '' ||
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || course.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const text = {
    en: {
      title: "Course Catalog",
      subtitle: "Explore our collection of courses designed for deep, meaningful formation.",
      search: "Search courses...",
      allTopics: "All Topics",
      noResults: "No courses found matching your search.",
      clearFilters: "Clear filters"
    },
    es: {
      title: "Catálogo de Cursos",
      subtitle: "Explora nuestra colección de cursos diseñados para una formación profunda y significativa.",
      search: "Buscar cursos...",
      allTopics: "Todos los temas",
      noResults: "No se encontraron cursos que coincidan con tu búsqueda.",
      clearFilters: "Limpiar filtros"
    }
  };

  const t = text[lang];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader lang={lang} />

      {/* Hero */}
      <section className="bg-white py-8 md:py-16 border-b border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Link
            to={createPageUrl(`Home?lang=${lang}`)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'es' ? 'Volver al inicio' : 'Back to home'}
          </Link>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-slate-900 mb-4">{t.title}</h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl">{t.subtitle}</p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 md:py-8 bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-4 items-start justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedTag === null
                    ? 'bg-[#1e3a5f] hover:bg-[#2d5a8a]'
                    : 'hover:bg-slate-100'
                }`}
                onClick={() => setSelectedTag(null)}
              >
                {t.allTopics}
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedTag === tag
                      ? 'bg-[#1e3a5f] hover:bg-[#2d5a8a]'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm md:text-base text-slate-500 mb-4">{t.noResults}</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className="text-[#1e3a5f] font-medium hover:underline"
              >
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  lang={lang}
                  enrolled={enrolledCourseIds.includes(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}