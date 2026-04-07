import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star, BookOpen, Trophy, Clock, ArrowRight, 
  GraduationCap, Target, ChevronRight, FileText, Settings 
} from "lucide-react";
import CourseCard from '@/components/courses/CourseCard';
import ProgressBar from '@/components/common/ProgressBar';
import MobileNav from '@/components/common/MobileNav';
import StreakDisplay from '@/components/gamification/StreakDisplay';
import { useMutation } from '@tanstack/react-query';
import PathwayProgress from '@/components/dashboard/PathwayProgress';
import WeeklyStudyPlan from '@/components/dashboard/WeeklyStudyPlan';
import StreakCalendar from '@/components/dashboard/StreakCalendar';
import QuickStats from '@/components/dashboard/QuickStats';
import CourseCalendar from '@/components/calendar/CourseCalendar';
import AnnouncementFeed from '@/components/dashboard/AnnouncementFeed';
import AccessGate from '@/components/AccessGate';

export default function Dashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
    const newUrl = `${window.location.pathname}?lang=${lang}`;
    window.history.replaceState({}, '', newUrl);
  }, [lang]);

  useEffect(() => {
    const viewMode = urlParams.get('view');
    
    base44.auth.me().then((u) => {
      // Only redirect if not explicitly viewing as student
      if (viewMode !== 'student') {
        if (u.role === 'admin' || u.user_type === 'admin') {
          window.location.href = createPageUrl(`Admin?lang=${lang}`);
          return;
        }
      }
      setUser(u);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['allProgress', user?.email],
    queryFn: () => base44.entities.Progress.filter({ user_email: user?.email, completed: true }),
    enabled: !!user?.email
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ['allLessons'],
    queryFn: () => base44.entities.Lesson.list()
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quizAttempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: userPrefs } = useQuery({
    queryKey: ['userPrefs', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user?.email });
      return prefs[0];
    },
    enabled: !!user?.email
  });

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.email],
    queryFn: async () => {
      const streaks = await base44.entities.Streak.filter({ user_email: user?.email });
      return streaks[0];
    },
    enabled: !!user?.email
  });

  const { data: pathwayEnrollments = [] } = useQuery({
    queryKey: ['pathwayEnrollments', user?.email],
    queryFn: () => base44.entities.PathwayEnrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: allPathways = [] } = useQuery({
    queryKey: ['allPathways'],
    queryFn: () => base44.entities.Pathway.list()
  });

  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks'],
    queryFn: () => base44.entities.Week.list()
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user?.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.email],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: endorsements = [] } = useQuery({
    queryKey: ['endorsements', user?.email],
    queryFn: () => base44.entities.PeerEndorsement.filter({ endorsed_user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: readingSessions = [] } = useQuery({
    queryKey: ['readingSessions', user?.email],
    queryFn: () => base44.entities.ReadingSession.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: courseProgress = [] } = useQuery({
    queryKey: ['courseProgress', user?.email],
    queryFn: async () => {
      if (!enrollments.length) return [];
      
      const progressData = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseWeeks = weeks.filter(w => w.course_id === enrollment.course_id);
          const completedWeeks = allProgress.filter(p => 
            courseWeeks.some(w => w.id === p.week_id) && p.completed
          ).length;
          
          return {
            course_id: enrollment.course_id,
            completion_percentage: courseWeeks.length > 0 
              ? Math.round((completedWeeks / courseWeeks.length) * 100) 
              : 0
          };
        })
      );
      
      return progressData;
    },
    enabled: !!user?.email && enrollments.length > 0
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = streak?.last_activity_date;
      
      if (lastDate === today) return streak;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const newStreak = lastDate === yesterdayStr 
        ? (streak?.current_streak || 0) + 1 
        : 1;

      const data = {
        user_email: user.email,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak?.longest_streak || 0),
        last_activity_date: today,
        total_points: streak?.total_points || 0
      };

      if (streak?.id) {
        return base44.entities.Streak.update(streak.id, data);
      } else {
        return base44.entities.Streak.create(data);
      }
    }
  });

  useEffect(() => {
    if (user?.email && streak !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      if (streak?.last_activity_date !== today) {
        updateStreakMutation.mutate();
      }
    }
  }, [user?.email, streak]);

  const enrolledCourses = courses.filter(c => 
    enrollments.some(e => e.course_id === c.id)
  );

  const getCourseProgress = (courseId) => {
    const courseLessons = allLessons.filter(l => {
      return allProgress.some(p => p.course_id === courseId && p.lesson_id === l.id);
    });
    const courseAllLessons = allProgress.filter(p => p.course_id === courseId);
    const total = allLessons.filter(l => allProgress.some(p => p.lesson_id === l.id && p.course_id === courseId)).length || 0;
    const completed = allProgress.filter(p => p.course_id === courseId && p.completed).length;
    
    // Rough estimate - we need lessons per course
    return total > 0 ? Math.round((completed / Math.max(total, completed)) * 100) : 0;
  };

  const completedCourses = enrollments.filter(e => e.status === 'completed').length;
  const totalLessonsCompleted = allProgress.length;
  const passedQuizzes = quizAttempts.filter(a => a.passed).length;

  const getPathwayProgress = (pathwayId) => {
    const pathway = allPathways.find(p => p.id === pathwayId);
    if (!pathway || !pathway.course_ids) return 0;
    
    const completedInPathway = pathway.course_ids.filter(cid =>
      enrollments.some(e => e.course_id === cid && e.status === 'completed')
    ).length;
    
    return Math.round((completedInPathway / pathway.course_ids.length) * 100);
  };

  const { data: resumeLesson } = useQuery({
    queryKey: ['resumeLesson', userPrefs?.last_lesson_id],
    queryFn: async () => {
      if (!userPrefs?.last_lesson_id) return null;
      const lessons = await base44.entities.Lesson.filter({ id: userPrefs.last_lesson_id });
      return lessons[0];
    },
    enabled: !!userPrefs?.last_lesson_id
  });

  const text = {
    en: {
      welcome: "Welcome back",
      myCourses: "My Courses",
      exploreCourses: "Explore more courses",
      resumeLearning: "Resume Learning",
      continueFrom: "Continue from",
      stats: {
        enrolled: "Courses Enrolled",
        completed: "Courses Completed",
        lessons: "Lessons Completed",
        quizzes: "Quizzes Passed"
      },
      pathways: "My Programs",
      pathwayProgress: "Program Progress",
      viewPathway: "View Program",
      noCourses: "You haven't enrolled in any courses yet.",
      browseButton: "Browse Courses",
      continue: "Continue Learning",
      recentActivity: "Recent Activity",
      viewCourse: "View Course"
    },
    es: {
      welcome: "Bienvenido de nuevo",
      myCourses: "Mis Cursos",
      exploreCourses: "Explorar más cursos",
      resumeLearning: "Continuar Aprendiendo",
      continueFrom: "Continuar desde",
      stats: {
        enrolled: "Cursos Inscritos",
        completed: "Cursos Completados",
        lessons: "Lecciones Completadas",
        quizzes: "Quizzes Aprobados"
      },
      pathways: "Mis Programas",
      pathwayProgress: "Progreso del Programa",
      viewPathway: "Ver Programa",
      noCourses: "Aún no te has inscrito en ningún curso.",
      browseButton: "Explorar Cursos",
      continue: "Continuar Aprendiendo",
      recentActivity: "Actividad Reciente",
      viewCourse: "Ver Curso"
    }
  };

  const t = text[lang];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <AccessGate user={user}>
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between overflow-x-auto">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to={createPageUrl(`Transcript?lang=${lang}`)} className="hidden md:block">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                {lang === 'es' ? 'Expediente' : 'Transcript'}
              </Button>
            </Link>
            {(user.role === 'admin' || user.user_type === 'admin' || user.user_type === 'instructor') && (
              <Link to={createPageUrl(`Admin?lang=${lang}`)}>
                <Button variant="outline" size="sm">
                  {(user.user_type === 'admin' || user.role === 'admin') ? 'Admin' : (lang === 'es' ? 'Instructor' : 'Instructor')}
                </Button>
              </Link>
            )}
            <Link to={createPageUrl(`AccountSettings?lang=${lang}`)} className="hidden md:block">
              <Button variant="ghost" size="sm">
                {lang === 'es' ? 'Mi Cuenta' : 'Account'}
              </Button>
            </Link>
            <Link to={createPageUrl(`AccessibilitySettings?lang=${lang}`)}>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Welcome */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-light text-slate-900 mb-2 truncate">
            {t.welcome}, <span className="font-semibold">{user.full_name || user.email}</span>
          </h1>
        </div>

        {/* Quick Stats - hidden until gamification is fully implemented */}
        {/* <QuickStats 
          userProfile={userProfile} 
          userBadges={userBadges}
          endorsements={endorsements}
          readingSessions={readingSessions}
        /> */}

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 mb-6 md:mb-8">
          {/* Left Column - Pathway Progress */}
          <div className="lg:col-span-2 space-y-6">
            <PathwayProgress 
              enrollments={enrollments}
              courses={courses}
              progress={courseProgress}
            />
            
            {resumeLesson && (
              <Card className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-6 h-6" />
                    <h3 className="font-semibold text-xl">{t.resumeLearning}</h3>
                  </div>
                  <p className="text-sm opacity-90 mb-4">{t.continueFrom}:</p>
                  <p className="font-medium mb-4 text-lg">{resumeLesson[`title_${lang}`] || resumeLesson.title_en}</p>
                  <Link to={createPageUrl(`Lesson?id=${resumeLesson.id}&lang=${lang}`)}>
                    <Button size="lg" variant="secondary" className="w-full">
                      {t.continue} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Weekly Plan & Streak */}
          <div className="space-y-6">
            <AnnouncementFeed user={user} lang={lang} />
            
            <WeeklyStudyPlan 
              enrollments={enrollments}
              courses={courses}
              weeks={weeks}
            />
            
            <StreakCalendar 
              userProfile={userProfile}
              readingSessions={readingSessions}
            />
          </div>
        </div>

        {/* Academic Calendar */}
        <CourseCalendar user={user} userType="student" lang={lang} />



        {/* My Courses */}
        <div className="mb-6 md:mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">{t.myCourses}</h2>
            <Link
              to={createPageUrl(`Catalog?lang=${lang}`)}
              className="text-[#1e3a5f] font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {t.exploreCourses}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="py-16 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-6">{t.noCourses}</p>
                <Link to={createPageUrl(`Catalog?lang=${lang}`)}>
                  <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                    {t.browseButton}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {enrolledCourses.map(course => {
                const enrollment = enrollments.find(e => e.course_id === course.id);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    lang={lang}
                    enrolled={true}
                    progress={getCourseProgress(course.id)}
                    courseInstanceId={enrollment?.course_instance_id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MobileNav lang={lang} currentPage="Profile" />
      </div>
    </AccessGate>
  );
}