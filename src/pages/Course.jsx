import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Clock, BookOpen, Star, Users, CheckCircle2, 
  Target, GraduationCap, PlayCircle, MessageSquare 
} from "lucide-react";
import AccessibilityMenu from '@/components/accessibility/AccessibilityMenu';
import ModuleAccordion from '@/components/courses/ModuleAccordion';
import LanguageToggle from '@/components/common/LanguageToggle';
import LanguageFallbackNotice from '@/components/common/LanguageFallbackNotice';
import ProgressBar from '@/components/common/ProgressBar';

export default function Course() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const allCourses = await base44.entities.Course.list();
      return allCourses.find(c => c.id === courseId);
    },
    enabled: !!courseId
  });



  const { data: courseInstances = [] } = useQuery({
    queryKey: ['courseInstances', courseId],
    queryFn: async () => {
      const instances = await base44.entities.CourseInstance.filter({ course_id: courseId });
      return instances.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    },
    enabled: !!courseId
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list()
  });

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const isEnrolled = (instanceId) => 
    myEnrollments.some(e => e.course_instance_id === instanceId && e.status !== 'dropped');

  const enrollMutation = useMutation({
    mutationFn: async (instanceId) => {
      const instance = courseInstances.find(i => i.id === instanceId);

      if (isEnrolled(instanceId)) throw new Error('Already enrolled');
      
      if (course.prerequisite_course_ids && course.prerequisite_course_ids.length > 0) {
        const completedEnrollments = await base44.entities.Enrollment.filter({ 
          user_email: user.email, status: 'completed' 
        });
        const completedCourseIds = completedEnrollments.map(e => e.course_id);
        const missingPrereqs = course.prerequisite_course_ids.filter(pid => !completedCourseIds.includes(pid));
        if (missingPrereqs.length > 0) throw new Error('Prerequisites not met');
      }
      
      if (instance?.max_students && instance.current_enrollment >= instance.max_students) {
        throw new Error('Course is full');
      }
      
      await base44.entities.Enrollment.create({
        course_id: courseId,
        course_instance_id: instanceId,
        user_email: user.email,
        status: 'active',
        enrolled_date: new Date().toISOString()
      });
      
      if (instance) {
        await base44.entities.CourseInstance.update(instanceId, {
          current_enrollment: (instance.current_enrollment || 0) + 1
        });
      }
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
      }
    }
  });

  const unenrollMutation = useMutation({
    mutationFn: async (instanceId) => {
      const enrollment = myEnrollments.find(e => e.course_instance_id === instanceId && e.status !== 'dropped');
      if (!enrollment) throw new Error('Not enrolled');
      await base44.entities.Enrollment.update(enrollment.id, { status: 'dropped' });
      const instance = courseInstances.find(i => i.id === instanceId);
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

  if (!courseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{lang === 'es' ? 'No se especificó ningún curso' : 'No course specified'}</p>
          <Link to={createPageUrl(`Catalog?lang=${lang}`)}>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
              {lang === 'es' ? 'Ir al catálogo' : 'Go to catalog'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  const title = course[`title_${lang}`] || course.title_en;
  const description = course[`description_${lang}`] || course.description_en;
  const outcomes = course[`learning_outcomes_${lang}`] || course.learning_outcomes_en || [];

  const handleEnroll = async (instanceId) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    enrollMutation.mutate(instanceId);
  };

  const text = {
    en: {
      backToCatalog: "Back to catalog",
      enroll: "Enroll",
      weeks: "weeks",
      credits: "credits",
      outcomes: "What You'll Learn",
      schedule: "Upcoming Sessions",
      noSessions: "No sessions scheduled yet",
      full: "Full",
      spotsLeft: "spots left"
    },
    es: {
      backToCatalog: "Volver al catálogo",
      enroll: "Inscribirse",
      weeks: "semanas",
      credits: "créditos",
      outcomes: "Lo que Aprenderás",
      schedule: "Sesiones Próximas",
      noSessions: "No hay sesiones programadas aún",
      full: "Lleno",
      spotsLeft: "lugares disponibles"
    }
  };

  const t = text[lang];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" 
              alt="Waypoint Institute" 
              className="h-12" 
            />
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            to={createPageUrl(`Catalog?lang=${lang}`)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToCatalog}
          </Link>

          {course.cover_image_url && (
            <div className="aspect-[21/9] overflow-hidden rounded-2xl mb-8">
              <img
                src={course.cover_image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {course.tags?.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-4">{title}</h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">{description}</p>

          <div className="flex flex-wrap gap-6 text-slate-600">
            {course.duration_weeks && (
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                {course.duration_weeks} {t.weeks}
              </span>
            )}
            {course.credits && (
              <span className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-slate-400" />
                {course.credits} {t.credits}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      {outcomes.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-light text-slate-900 mb-8">{t.outcomes}</h2>
            <ul className="grid md:grid-cols-2 gap-4">
              {outcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1e3a5f] flex-shrink-0 mt-1" />
                  <span className="text-slate-600">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Schedule */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-light text-slate-900 mb-8">{t.schedule}</h2>

          {courseInstances.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {courseInstances.map(instance => {
                const term = terms.find(t => t.id === instance.term_id);
                const isFull = instance.max_students && instance.current_enrollment >= instance.max_students;
                const spotsLeft = instance.max_students ? instance.max_students - (instance.current_enrollment || 0) : null;
                
                return (
                  <Card key={instance.id} className="border-slate-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-slate-900 mb-2">
                        {term?.name || instance.cohort_name}
                      </h3>
                      <div className="space-y-2 mb-4 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(instance.start_date).toLocaleDateString()} - {new Date(instance.end_date).toLocaleDateString()}
                        </p>
                        {instance.meeting_schedule && (
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {instance.meeting_schedule}
                          </p>
                        )}
                        {spotsLeft !== null && (
                          <p className={`font-medium ${spotsLeft < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {spotsLeft} {t.spotsLeft}
                          </p>
                        )}
                      </div>
                      {isEnrolled(instance.id) ? (
                        <Button
                          variant="outline"
                          onClick={() => unenrollMutation.mutate(instance.id)}
                          disabled={unenrollMutation.isPending}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {unenrollMutation.isPending ? '...' : (lang === 'es' ? 'Cancelar inscripción' : 'Unenroll')}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleEnroll(instance.id)}
                          disabled={enrollMutation.isPending || isFull}
                          className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                        >
                          {isFull ? t.full : (enrollMutation.isPending ? '...' : t.enroll)}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">{t.noSessions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}