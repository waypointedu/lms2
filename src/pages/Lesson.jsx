import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, ArrowRight, Star, Clock, CheckCircle2, 
  Download, PlayCircle, Circle 
} from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';
import LanguageFallbackNotice from '@/components/common/LanguageFallbackNotice';
import ProgressBar from '@/components/common/ProgressBar';
import QuizContainer from '@/components/quiz/QuizContainer';
import CommentSection from '@/components/lesson/CommentSection';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import MobileNav from '@/components/common/MobileNav';
import { jsPDF } from 'jspdf';

export default function Lesson() {
  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = urlParams.get('id');
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
    const newUrl = `${window.location.pathname}?id=${lessonId}&lang=${lang}`;
    window.history.replaceState({}, '', newUrl);
  }, [lang, lessonId]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => base44.entities.Lesson.filter({ id: lessonId }),
    select: (data) => data[0],
    enabled: !!lessonId
  });

  const { data: module } = useQuery({
    queryKey: ['module', lesson?.module_id],
    queryFn: () => base44.entities.Module.filter({ id: lesson.module_id }),
    select: (data) => data[0],
    enabled: !!lesson?.module_id
  });

  const { data: course } = useQuery({
    queryKey: ['course', module?.course_id],
    queryFn: () => base44.entities.Course.filter({ id: module.course_id }),
    select: (data) => data[0],
    enabled: !!module?.course_id
  });

  const { data: moduleLessons = [] } = useQuery({
    queryKey: ['moduleLessons', lesson?.module_id],
    queryFn: () => base44.entities.Lesson.filter({ module_id: lesson.module_id }),
    select: (data) => data.sort((a, b) => a.order_index - b.order_index),
    enabled: !!lesson?.module_id
  });

  const { data: quiz } = useQuery({
    queryKey: ['lessonQuiz', lessonId],
    queryFn: () => base44.entities.Quiz.filter({ lesson_id: lessonId }),
    select: (data) => data[0],
    enabled: !!lessonId
  });

  const { data: progress } = useQuery({
    queryKey: ['lessonProgress', lessonId, user?.email],
    queryFn: () => base44.entities.Progress.filter({ 
      lesson_id: lessonId, 
      user_email: user?.email 
    }),
    select: (data) => data[0],
    enabled: !!user?.email && !!lessonId
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['moduleProgress', user?.email, lesson?.module_id],
    queryFn: () => base44.entities.Progress.filter({ 
      user_email: user?.email,
      module_id: lesson?.module_id
    }),
    enabled: !!user?.email && !!lesson?.module_id
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (progress) {
        return base44.entities.Progress.update(progress.id, {
          completed: true,
          completed_date: new Date().toISOString()
        });
      } else {
        return base44.entities.Progress.create({
          user_email: user.email,
          lesson_id: lessonId,
          module_id: lesson.module_id,
          course_id: module.course_id,
          completed: true,
          completed_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgress', lessonId, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  });

  useEffect(() => {
    if (lesson) {
      const hasLangContent = lesson[`content_${lang}`];
      setShowFallback(lang === 'es' && !hasLangContent);
    }
  }, [lesson, lang]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{lang === 'es' ? 'Lección no encontrada' : 'Lesson not found'}</p>
          <Link to={createPageUrl(`Catalog?lang=${lang}`)} className="text-[#1e3a5f] font-medium hover:underline">
            {lang === 'es' ? 'Volver al catálogo' : 'Back to catalog'}
          </Link>
        </div>
      </div>
    );
  }

  const title = lesson[`title_${lang}`] || lesson.title_en;
  const content = lesson[`content_${lang}`] || lesson.content_en || '';
  const moduleTitle = module?.[`title_${lang}`] || module?.title_en;
  const courseTitle = course?.[`title_${lang}`] || course?.title_en;

  const currentIndex = moduleLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null;

  const isComplete = progress?.completed === true;

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    pdf.setFontSize(20);
    pdf.text(title, margin, y);
    y += 15;

    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
    lines.forEach(line => {
      if (y > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, margin, y);
      y += 7;
    });

    pdf.save(`lesson-${lessonId}.pdf`);
  };

  const text = {
    en: {
      backToCourse: "Back to course",
      markComplete: "Mark as complete",
      completed: "Completed",
      previous: "Previous",
      next: "Next",
      attachments: "Attachments",
      quiz: "Quiz",
      downloadPDF: "Download PDF",
      moduleProgress: "Module Progress"
    },
    es: {
      backToCourse: "Volver al curso",
      markComplete: "Marcar como completada",
      completed: "Completada",
      previous: "Anterior",
      next: "Siguiente",
      attachments: "Archivos adjuntos",
      quiz: "Quiz",
      downloadPDF: "Descargar PDF",
      moduleProgress: "Progreso del Módulo"
    }
  };

  const t = text[lang];

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getVimeoEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(lesson.video_url) || getVimeoEmbedUrl(lesson.video_url);

  const completedInModule = moduleLessons.filter(l => 
    allProgress.some(p => p.lesson_id === l.id && p.completed)
  ).length;
  const moduleProgress = moduleLessons.length > 0 ? Math.round((completedInModule / moduleLessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">Waypoint Institute</span>
          </Link>
          <div className="hidden md:block">
            <LanguageToggle currentLang={lang} onToggle={setLang} />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        {/* Breadcrumb */}
        {course && (
          <Breadcrumbs 
            items={[
              { label: courseTitle, href: createPageUrl(`Course?id=${course.id}&lang=${lang}`) },
              { label: moduleTitle },
              { label: title }
            ]}
            lang={lang}
          />
        )}

        {showFallback && <LanguageFallbackNotice requestedLang={lang} />}

        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl md:text-4xl font-light text-slate-900">{title}</h1>
            <Button variant="outline" size="lg" onClick={downloadPDF} className="shrink-0">
              <Download className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">{t.downloadPDF}</span>
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-slate-500 mb-6">
            {lesson.estimated_minutes && (
              <span className="flex items-center gap-1 text-base">
                <Clock className="w-5 h-5" />
                {lesson.estimated_minutes} min
              </span>
            )}
            {isComplete && (
              <span className="flex items-center gap-1 text-emerald-600 text-base font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                {t.completed}
              </span>
            )}
          </div>

          {/* Module Progress Bar */}
          {moduleLessons.length > 1 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">{t.moduleProgress}</span>
                <span className="text-sm font-semibold text-[#1e3a5f]">{moduleProgress}%</span>
              </div>
              <ProgressBar value={moduleProgress} />
              <div className="text-xs text-slate-500 mt-2">
                {completedInModule} / {moduleLessons.length} {lang === 'es' ? 'lecciones' : 'lessons'}
              </div>
            </div>
          )}
        </div>

        {/* Video */}
        {embedUrl && (
          <div className="aspect-video rounded-xl overflow-hidden mb-8 bg-slate-100">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate prose-lg max-w-none mb-12">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {/* Attachments */}
        {lesson.attachments?.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.attachments}</h3>
            <div className="space-y-2">
              {lesson.attachments.map((attachment, i) => (
                <a
                  key={i}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <Download className="w-5 h-5 text-[#1e3a5f]" />
                  <span className="text-slate-700">{attachment.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quiz */}
        {quiz && user && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.quiz}</h3>
            <QuizContainer
              quizId={quiz.id}
              user={user}
              courseId={course?.id}
              lessonId={lessonId}
              lang={lang}
              onComplete={() => markCompleteMutation.mutate()}
            />
          </div>
        )}

        {/* Mark Complete */}
        {user && !quiz && (
          <Card className="border-slate-100 mb-12">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
                <span className={isComplete ? 'text-emerald-700' : 'text-slate-700'}>
                  {isComplete ? t.completed : t.markComplete}
                </span>
              </div>
              {!isComplete && (
                <Button
                  onClick={() => markCompleteMutation.mutate()}
                  disabled={markCompleteMutation.isPending}
                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                >
                  {t.markComplete}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        {user && (
          <div className="mb-12">
            <CommentSection lessonId={lessonId} user={user} lang={lang} />
          </div>
        )}

        {/* Navigation */}
        <div className="hidden md:flex justify-between items-center pt-8 border-t border-slate-100">
          {prevLesson ? (
            <Link
              to={createPageUrl(`Lesson?id=${prevLesson.id}&lang=${lang}`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <div>
                <p className="text-sm text-slate-400">{t.previous}</p>
                <p className="font-medium">{prevLesson[`title_${lang}`] || prevLesson.title_en}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson && (
            <Link
              to={createPageUrl(`Lesson?id=${nextLesson.id}&lang=${lang}`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-right"
            >
              <div>
                <p className="text-sm text-slate-400">{t.next}</p>
                <p className="font-medium">{nextLesson[`title_${lang}`] || nextLesson.title_en}</p>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Mobile Next Button */}
        {nextLesson && (
          <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
            <Link to={createPageUrl(`Lesson?id=${nextLesson.id}&lang=${lang}`)}>
              <Button size="lg" className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] text-lg py-6">
                {t.next} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      <MobileNav lang={lang} currentPage="Courses" />
    </div>
  );
}