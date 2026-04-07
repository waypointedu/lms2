import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, MessageSquare, Eye, FileText, TrendingUp, Users } from "lucide-react";
import SemesterAvailability from '@/components/instructor/SemesterAvailability';
import CourseCalendar from '@/components/calendar/CourseCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnouncementFeed from '@/components/dashboard/AnnouncementFeed';

export default function InstructorDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      const isAuthorized = u.role === 'admin' || u.user_type === 'admin' || u.user_type === 'instructor';
      if (!isAuthorized) {
        window.location.href = createPageUrl('Dashboard');
      }
      setUser(u);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: courseInstances = [] } = useQuery({
    queryKey: ['courseInstances', user?.email],
    queryFn: () => base44.entities.CourseInstance.filter({}),
    enabled: !!user?.email
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.WrittenAssignmentSubmission.filter({ status: 'submitted' })
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => base44.entities.ForumPost.list()
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['allEnrollments'],
    queryFn: () => base44.entities.Enrollment.list()
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['allProgress'],
    queryFn: () => base44.entities.Progress.list()
  });

  const text = {
    en: {
      title: "Instructor Dashboard",
      toGrade: "To Grade",
      submissions: "Assignment Submissions",
      discussions: "Recent Discussions",
      courses: "My Courses",
      viewCourse: "View Course",
      studentView: "Student View",
      manageCourse: "Manage Course",
      gradeNow: "Grade Now",
      noSubmissions: "No submissions to grade",
      noPosts: "No recent posts",
      totalStudents: "Total Students",
      activeStudents: "Active This Week",
      avgCompletion: "Avg Completion"
    },
    es: {
      title: "Panel del Instructor",
      toGrade: "Por Calificar",
      submissions: "Envíos de Tareas",
      discussions: "Discusiones Recientes",
      courses: "Mis Cursos",
      viewCourse: "Ver Curso",
      studentView: "Vista Estudiante",
      manageCourse: "Gestionar Curso",
      gradeNow: "Calificar Ahora",
      noSubmissions: "No hay envíos para calificar",
      noPosts: "No hay publicaciones recientes",
      totalStudents: "Estudiantes Totales",
      activeStudents: "Activos Esta Semana",
      avgCompletion: "Finalización Promedio"
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

  const recentPosts = forumPosts.slice(0, 5);

  // Calculate stats
  const totalStudents = new Set(enrollments.map(e => e.user_email)).size;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const activeStudents = new Set(
    allProgress
      .filter(p => new Date(p.updated_date) > oneWeekAgo)
      .map(p => p.user_email)
  ).size;
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
  const avgCompletion = enrollments.length > 0 
    ? Math.round((completedEnrollments / enrollments.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between overflow-x-auto">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to={createPageUrl(`InstructorGradebook?lang=${lang}`)}>
              <Button variant="outline" size="sm">
                <ClipboardCheck className="w-4 h-4 mr-1" />
                {lang === 'es' ? 'Calificaciones' : 'Grades'}
              </Button>
            </Link>
            <Link to={createPageUrl(`Admin?lang=${lang}`)}>
              <Button variant="outline" size="sm">
                {lang === 'es' ? 'Gestión' : 'Manage'}
              </Button>
            </Link>
            <Link to={createPageUrl(`AccountSettings?lang=${lang}`)}>
              <Button variant="ghost" size="sm">
                {lang === 'es' ? 'Mi Cuenta' : 'Account'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-slate-900 mb-2">{t.title}</h1>
          <p className="text-slate-600">
            {lang === 'es' ? 'Gestiona calificaciones, foros y contenido del curso' : 'Manage grades, forums, and course content'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">{lang === 'es' ? 'Resumen' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="schedule">{lang === 'es' ? 'Horario' : 'Schedule'}</TabsTrigger>
            <TabsTrigger value="availability">{lang === 'es' ? 'Disponibilidad' : 'Availability'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-6">
        
        <AnnouncementFeed user={user} lang={lang} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{t.toGrade}</p>
                  <p className="text-3xl font-semibold text-amber-600">{submissions.length}</p>
                </div>
                <ClipboardCheck className="w-10 h-10 text-amber-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{t.discussions}</p>
                  <p className="text-3xl font-semibold text-blue-600">{forumPosts.length}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{t.courses}</p>
                  <p className="text-3xl font-semibold text-[#1e3a5f]">
                    {courseInstances.filter(ci => ci.instructor_emails?.includes(user.email)).length}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-[#1e3a5f]/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{t.totalStudents}</p>
                  <p className="text-3xl font-semibold text-purple-600">{totalStudents}</p>
                </div>
                <Users className="w-10 h-10 text-purple-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{t.activeStudents}</p>
                  <p className="text-3xl font-semibold text-emerald-600">{activeStudents}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{t.avgCompletion}</p>
                  <p className="text-3xl font-semibold text-[#c4933f]">{avgCompletion}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-[#c4933f]/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t.courses}</h2>
          {(() => {
            const assignedInstances = courseInstances.filter(ci => ci.instructor_emails?.includes(user.email));
            
            return (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedInstances.length === 0 ? (
                  <p className="text-slate-500 col-span-full text-center py-8">No courses assigned yet</p>
                ) : (
                  assignedInstances.map(instance => {
                    const course = courses.find(c => c.id === instance.course_id);
                    if (!course) return null;
                    
                    return (
                      <Card key={instance.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{course[`title_${lang}`] || course.title_en}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="w-fit">{instance.cohort_name}</Badge>
                            <Badge variant="outline" className="w-fit">{course.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Link to={createPageUrl(`Course?id=${course.id}&lang=${lang}`)}>
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              {t.viewCourse}
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`CourseView?id=${course.id}&courseInstanceId=${instance.id}&lang=${lang}`)}>
                            <Button size="sm" className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                              {t.manageCourse}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-600" />
                    {t.submissions}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">{t.noSubmissions}</p>
                  ) : (
                    <div className="space-y-3">
                      {submissions.slice(0, 5).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{sub.user_name}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(sub.submitted_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Link to={createPageUrl(`InstructorGradebook?course_id=${sub.course_id}&lang=${lang}`)}>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                              {t.gradeNow}
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    {t.discussions}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPosts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">{t.noPosts}</p>
                  ) : (
                    <div className="space-y-3">
                      {recentPosts.map(post => (
                        <Link
                          key={post.id}
                          to={createPageUrl(`ForumPost?postId=${post.id}&lang=${lang}`)}
                          className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <p className="font-medium text-slate-900">{post.title}</p>
                          <p className="text-sm text-slate-500">{post.user_name}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <CourseCalendar user={user} userType="instructor" lang={lang} />
          </TabsContent>

          <TabsContent value="availability">
            <SemesterAvailability user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}