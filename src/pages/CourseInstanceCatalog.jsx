import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Clock, Users, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import MobileNav from '@/components/common/MobileNav';

export default function CourseInstanceCatalog() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms', 'active'],
    queryFn: async () => {
      const all = await base44.entities.AcademicTerm.list('-start_date');
      return all.filter(t => t.status === 'upcoming' || t.status === 'active');
    }
  });

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['courseInstances', 'scheduled'],
    queryFn: async () => {
      const all = await base44.entities.CourseInstance.filter({ status: 'scheduled' });
      return all.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' })
  });

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const enrollMutation = useMutation({
    mutationFn: async (instanceId) => {
      const instance = instances.find(i => i.id === instanceId);
      const course = courses.find(c => c.id === instance.course_id);

      // Check already enrolled
      if (isEnrolled(instanceId)) {
        throw new Error('Already enrolled');
      }
      
      // Check prerequisites
      if (course.prerequisite_course_ids && course.prerequisite_course_ids.length > 0) {
        const completedEnrollments = await base44.entities.Enrollment.filter({ 
          user_email: user.email, 
          status: 'completed' 
        });
        const completedCourseIds = completedEnrollments.map(e => e.course_id);
        const missingPrereqs = course.prerequisite_course_ids.filter(pid => !completedCourseIds.includes(pid));
        if (missingPrereqs.length > 0) throw new Error('Prerequisites not met');
      }
      
      // Check if full
      if (instance.max_students && instance.current_enrollment >= instance.max_students) {
        throw new Error('Course is full');
      }
      
      await base44.entities.Enrollment.create({
        course_id: instance.course_id,
        course_instance_id: instanceId,
        user_email: user.email,
        status: 'active',
        enrolled_date: new Date().toISOString()
      });
      
      await base44.entities.CourseInstance.update(instanceId, {
        current_enrollment: (instance.current_enrollment || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
    },
    onError: (error) => {
      if (error.message === 'Prerequisites not met') {
        alert(lang === 'es' 
          ? 'Debes completar los cursos prerequisitos antes de inscribirte.' 
          : 'You must complete prerequisite courses before enrolling.');
      } else if (error.message === 'Course is full') {
        alert(lang === 'es' ? 'Este curso está lleno.' : 'This course is full.');
      } else if (error.message !== 'Already enrolled') {
        alert(lang === 'es' ? 'Error al inscribirse' : 'Error enrolling');
      }
    }
  });

  const unenrollMutation = useMutation({
    mutationFn: async (instanceId) => {
      const enrollment = myEnrollments.find(e => e.course_instance_id === instanceId);
      if (!enrollment) throw new Error('Not enrolled');
      await base44.entities.Enrollment.update(enrollment.id, { status: 'dropped' });
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        await base44.entities.CourseInstance.update(instanceId, {
          current_enrollment: Math.max(0, (instance.current_enrollment || 1) - 1)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
    }
  });

  const filteredInstances = instances.filter(instance => {
    const course = courses.find(c => c.id === instance.course_id);
    if (!course) return false;
    
    const title = course[`title_${lang}`] || course.title_en;
    const description = course[`description_${lang}`] || course.description_en;
    
    return searchQuery === '' ||
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isEnrolled = (instanceId) => {
    return myEnrollments.some(e => e.course_instance_id === instanceId && e.status !== 'dropped');
  };

  const isFull = (instance) => {
    return instance.max_students && instance.current_enrollment >= instance.max_students;
  };

  const text = {
    en: {
      title: "Upcoming Course Offerings",
      subtitle: "Browse scheduled courses and enroll for upcoming terms",
      search: "Search courses...",
      enroll: "Enroll",
      enrolled: "Enrolled",
      full: "Full",
      backToHome: "Back to home",
      spots: "spots left",
      starts: "Starts",
      instructor: "Instructor",
      selfPaced: "Self-paced",
      noCourses: "No upcoming course offerings available",
      unenroll: "Unenroll"
    },
    es: {
      title: "Próximas Ofertas de Cursos",
      subtitle: "Explora cursos programados e inscríbete para próximos términos",
      search: "Buscar cursos...",
      enroll: "Inscribirse",
      enrolled: "Inscrito",
      full: "Lleno",
      backToHome: "Volver al inicio",
      spots: "lugares disponibles",
      starts: "Inicia",
      instructor: "Instructor",
      selfPaced: "A tu ritmo",
      noCourses: "No hay ofertas de cursos próximos disponibles",
      unenroll: "Cancelar inscripción"
    }
  };

  const t = text[lang];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{lang === 'es' ? 'Inicia sesión para inscribirte en cursos' : 'Sign in to enroll in courses'}</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
            {lang === 'es' ? 'Iniciar Sesión' : 'Sign In'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" 
              alt="Waypoint Institute" 
              className="h-12" 
            />
          </Link>
          <Link to={createPageUrl(`Dashboard?lang=${lang}`)}>
            <Button variant="outline" size="sm">
              {lang === 'es' ? 'Mi Panel' : 'My Dashboard'}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white py-8 md:py-16 border-b border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Link
            to={createPageUrl(`Dashboard?lang=${lang}`)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToHome}
          </Link>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-slate-900 mb-4">{t.title}</h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl">{t.subtitle}</p>
        </div>
      </section>

      {/* Search */}
      <section className="py-4 md:py-8 bg-white border-b border-slate-100 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </section>

      {/* Course Instances Grid */}
      <section className="py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{t.noCourses}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstances.map(instance => {
                const course = courses.find(c => c.id === instance.course_id);
                const term = terms.find(t => t.id === instance.term_id);
                if (!course) return null;

                const title = course[`title_${lang}`] || course.title_en;
                const description = course[`description_${lang}`] || course.description_en;
                const spotsLeft = instance.max_students ? instance.max_students - (instance.current_enrollment || 0) : null;
                const enrolled = isEnrolled(instance.id);
                const full = isFull(instance);

                return (
                  <Card key={instance.id} className="hover:shadow-lg transition-shadow">
                    {course.cover_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-xl">
                        <img src={course.cover_image_url} alt={title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        {enrolled && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t.enrolled}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline">{term?.name || instance.cohort_name}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{t.starts}: {new Date(instance.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{instance.meeting_schedule || t.selfPaced}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4" />
                          {spotsLeft !== null ? (
                            <span className={spotsLeft < 5 ? 'text-amber-600 font-medium' : ''}>
                              {spotsLeft} {t.spots}
                            </span>
                          ) : (
                            <span>{instance.current_enrollment || 0} enrolled</span>
                          )}
                        </div>
                      </div>

                      {enrolled ? (
                        <Button 
                          variant="outline"
                          onClick={() => unenrollMutation.mutate(instance.id)}
                          disabled={unenrollMutation.isPending}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {unenrollMutation.isPending ? '...' : t.unenroll}
                        </Button>
                      ) : full ? (
                        <Button disabled className="w-full">
                          {t.full}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => enrollMutation.mutate(instance.id)}
                          disabled={enrollMutation.isPending}
                          className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                        >
                          {enrollMutation.isPending ? '...' : t.enroll}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <MobileNav lang={lang} currentPage="Catalog" />
    </div>
  );
}