import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  CheckCircle2,
  Clock,
  Menu,
  X,
  Edit,
  Users,
  BarChart3,
  AlertCircle,
  Eye,
  Trash2,
  ClipboardCheck,
  Pencil
} from "lucide-react";
import WeekQuizStudent from '@/components/quiz/WeekQuizStudent';
import WrittenAssignmentStudent from '@/components/assignments/WrittenAssignmentStudent';
import ThreadedReplies from '@/components/forum/ThreadedReplies';

export default function CourseView() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id') || urlParams.get('courseId');
  const courseInstanceId = urlParams.get('courseInstanceId');
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewAsStudent, setViewAsStudent] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      console.log('CourseView - User loaded:', u);
      console.log('CourseView - user.role:', u.role);
      console.log('CourseView - user.data:', u.data);
      console.log('CourseView - user.data?.user_type:', u.data?.user_type);
      console.log('CourseView - user.user_type:', u.user_type);
      setUser(u);
    }).catch(() => setUser(null));
  }, []);

  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'admin' || user.data?.user_type === 'admin';
      const isInstr = user.data?.user_type === 'instructor' || user.user_type === 'instructor';
      const result = isAdmin || isInstr;
      console.log('CourseView - Setting isInstructor to:', result);
      console.log('CourseView - Breakdown: isAdmin=', isAdmin, 'isInstr=', isInstr);
      setIsInstructor(result);
    }
  }, [user]);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.list();
      return courses.find(c => c.id === courseId);
    },
    enabled: !!courseId
  });

  const { data: courseInstance } = useQuery({
    queryKey: ['courseInstance', courseInstanceId],
    queryFn: async () => {
      if (!courseInstanceId) return null;
      const instances = await base44.entities.CourseInstance.filter({ id: courseInstanceId });
      return instances[0];
    },
    enabled: !!courseInstanceId
  });

  const { data: instructorNames = {} } = useQuery({
    queryKey: ['instructorNames', courseInstance?.instructor_emails],
    queryFn: async () => {
      const emails = courseInstance.instructor_emails;
      if (!emails?.length) return {};
      const res = await base44.functions.invoke('getEnrolledStudents', { lookupEmails: emails });
      const map = {};
      (res.data.users || []).forEach(u => { map[u.email] = u.display_name; });
      return map;
    },
    enabled: !!courseInstance?.instructor_emails?.length
  });

  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks', courseId],
    queryFn: async () => {
      const allWeeks = await base44.entities.Week.filter({ course_id: courseId });
      return allWeeks.sort((a, b) => a.week_number - b.week_number);
    },
    enabled: !!courseId
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress', courseId, user?.email],
    queryFn: async () => {
      const allProgress = await base44.entities.Progress.list();
      return allProgress.filter(p => p.course_id === courseId);
    },
    enabled: !!courseId && isInstructor && !viewAsStudent
  });

  const { data: myProgress = [] } = useQuery({
    queryKey: ['myProgress', courseId, user?.email],
    queryFn: () => base44.entities.Progress.filter({ course_id: courseId, user_email: user?.email }),
    enabled: !!user?.email && !!courseId
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements', courseId],
    queryFn: () => base44.entities.Announcement.filter({ course_id: courseId, published: true }),
    select: (data) => data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    enabled: !!courseId
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['courseEnrollments', courseId, courseInstanceId, isInstructor],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEnrolledStudents', { courseId, courseInstanceId });
      return res.data.students || [];
    },
    enabled: !!courseId && isInstructor
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', courseId],
    queryFn: () => base44.entities.WrittenAssignmentSubmission.filter({ course_id: courseId }),
    enabled: !!courseId && isInstructor && !viewAsStudent
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quizAttempts', courseId],
    queryFn: () => base44.entities.WeekQuizAttempt.list(),
    enabled: !!courseId && isInstructor && !viewAsStudent
  });

  const { data: weekQuizzes = [] } = useQuery({
    queryKey: ['weekQuizzes'],
    queryFn: () => base44.entities.WeekQuiz.list(),
    enabled: true
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts', courseId, selectedContent?.data?.id],
    queryFn: async () => {
      // Fetch all posts for this course, then filter by both forum_id (= week.id) and week_id
      const all = await base44.entities.ForumPost.filter({ course_id: courseId });
      const weekId = selectedContent.data.id;
      return all.filter(p => p.forum_id === weekId || p.week_id === weekId);
    },
    enabled: !!selectedContent?.data?.id && selectedContent?.type === 'discussion'
  });

  const { data: forumReplies = [] } = useQuery({
    queryKey: ['forumReplies', selectedContent?.data?.id],
    queryFn: () => base44.entities.ForumReply.list(),
    enabled: !!selectedContent?.data?.id && selectedContent?.type === 'discussion'
  });



  const createAnnouncementMutation = useMutation({
    mutationFn: (data) => {
      if (editingAnnouncement) {
        return base44.entities.Announcement.update(editingAnnouncement.id, data);
      }
      return base44.entities.Announcement.create({
        ...data,
        course_id: courseId,
        published: true,
        target_audience: 'students',
        priority: 'normal',
        created_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', courseId] });
      setShowAnnouncementDialog(false);
      setNewAnnouncement({ title: '', content: '' });
      setEditingAnnouncement(null);
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', courseId] });
    }
  });

  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [nestedReplyingTo, setNestedReplyingTo] = useState(null);
  const [nestedReplyTexts, setNestedReplyTexts] = useState({});

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.ForumPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts', selectedContent?.data?.id] });
      setNewPost('');
    }
  });

  const createReplyMutation = useMutation({
    mutationFn: (replyData) => base44.entities.ForumReply.create(replyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', selectedContent?.data?.id] });
      setReplyingTo(null);
      setReplyText('');
    }
  });

  const createNestedReplyMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumReply.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', selectedContent?.data?.id] });
      setNestedReplyingTo(null);
      setNestedReplyTexts(prev => ({ ...prev, [variables.parent_id]: '' }));
    }
  });

  const [editingPost, setEditingPost] = useState(null);
  const [editPostText, setEditPostText] = useState('');

  const updatePostMutation = useMutation({
    mutationFn: ({ id, content }) => base44.entities.ForumPost.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts', selectedContent?.data?.id] });
      setEditingPost(null);
      setEditPostText('');
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.ForumPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts', selectedContent?.data?.id] });
    }
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (id) => base44.entities.ForumReply.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', selectedContent?.data?.id] });
    }
  });

  const updateReplyMutation = useMutation({
    mutationFn: ({ id, content }) => base44.entities.ForumReply.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', selectedContent?.data?.id] });
    }
  });

  const toggleWeek = (weekId) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const selectWeek = (week) => {
    setSelectedContent({ type: 'week', data: week });
  };

  if (!courseId || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  const title = course[`title_${lang}`] || course.title_en;
  const completedWeeks = myProgress.filter(p => p.completed).length;

  const ungradedSubmissions = submissions.filter(s => s.status === 'submitted' && (!s.grade || s.grade === null || s.grade === '')).length;
  const totalUngraded = ungradedSubmissions;



  const getWeekSubmissions = (weekId) => {
    return submissions.filter(s => s.week_id === weekId && !s.grade).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-sm sm:text-lg font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-xs lg:max-w-none">{title}</h1>
              {courseInstance && !isInstructor && courseInstance.instructor_emails?.[0] && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Badge variant="outline" className="text-xs">{courseInstance.cohort_name}</Badge>
                  <span>•</span>
                  <span>{lang === 'es' ? 'Instructor:' : 'Instructor:'} {instructorNames[courseInstance.instructor_emails[0]] || courseInstance.instructor_emails[0].split('@')[0]}</span>
                </div>
              )}
              <p className="text-sm text-slate-500">
                {isInstructor && !viewAsStudent
                  ? `${enrollments.filter(e => e.status === 'active').length} ${lang === 'es' ? 'estudiantes activos' : 'active students'}`
                  : `${completedWeeks} / ${weeks.length} ${lang === 'es' ? 'semanas completadas' : 'weeks completed'}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isInstructor && !viewAsStudent && totalUngraded > 0 && (
              <Link to={createPageUrl(`InstructorGradebook?courseId=${courseId}&lang=${lang}`)}>
                <Badge variant="destructive" className="mr-2 cursor-pointer hover:bg-red-700">
                  {totalUngraded} {lang === 'es' ? 'por calificar' : 'to grade'}
                </Badge>
              </Link>
            )}
            {isInstructor && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewAsStudent(!viewAsStudent)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {viewAsStudent ? (lang === 'es' ? 'Vista Instructor' : 'Instructor View') : (lang === 'es' ? 'Vista Estudiante' : 'Student View')}
              </Button>
            )}
            <Link to={createPageUrl(isInstructor ? `InstructorDashboard?lang=${lang}` : `Dashboard?lang=${lang}`)}>
              <Button variant="outline" size="sm">
                {lang === 'es' ? 'Volver al Panel' : 'Back to Dashboard'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col`}
        >
          <div className="flex-1 overflow-y-auto p-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className={`w-full grid ${isInstructor && !viewAsStudent ? 'grid-cols-4' : 'grid-cols-2'}`}>
                <TabsTrigger value="content" className="text-[10px] sm:text-xs">
                  {lang === 'es' ? 'Contenido' : 'Content'}
                </TabsTrigger>
                {isInstructor && !viewAsStudent && (
                  <>
                    <TabsTrigger value="students" className="text-[10px] sm:text-xs">
                      {lang === 'es' ? 'Estudiantes' : 'Students'}
                    </TabsTrigger>
                    <TabsTrigger value="gradebook" className="text-[10px] sm:text-xs">
                      {lang === 'es' ? 'Notas' : 'Grades'}
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="announcements" className="text-[10px] sm:text-xs">
                  {lang === 'es' ? 'Anuncios' : 'Announcements'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-2 mt-4">
                {weeks.map(week => {
                  const weekTitle = week[`title_${lang}`] || week.title_en;
                  const isExpanded = expandedWeeks[week.id];
                  const isCompleted = progress.some(p => p.week_id === week.id && p.completed);

                  return (
                    <div key={week.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleWeek(week.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-slate-900 text-sm">
                              {lang === 'es' ? 'Semana' : 'Week'} {week.week_number}
                            </p>
                            <p className="text-xs text-slate-500">{weekTitle}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-1">
                          <button
                            onClick={() => selectWeek(week)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            {lang === 'es' ? 'Material de Lectura' : 'Reading Material'}
                          </button>

                          {week.has_written_assignment && (
                            <button
                              onClick={() => setSelectedContent({ type: 'assignment', data: week })}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center justify-between group"
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {lang === 'es' ? 'Tarea Escrita' : 'Written Assignment'}
                              </span>
                              {isInstructor && !viewAsStudent && getWeekSubmissions(week.id) > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {getWeekSubmissions(week.id)}
                                </Badge>
                              )}
                            </button>
                          )}

                          {week.has_discussion && (
                            <button
                              onClick={() => setSelectedContent({ type: 'discussion', data: week })}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                              {lang === 'es' ? 'Foro de Discusión' : 'Discussion Forum'}
                            </button>
                          )}

                          {week.has_quiz && (
                            <button
                              onClick={() => setSelectedContent({ type: 'quiz', data: week })}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-slate-400" />
                              {lang === 'es' ? 'Cuestionario' : 'Quiz'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>

              {isInstructor && !viewAsStudent && (
                <TabsContent value="students" className="mt-4 space-y-3">
                  <Card className="border-slate-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">{lang === 'es' ? 'Total Estudiantes' : 'Total Students'}</span>
                        </div>
                        <Badge>{enrollments.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{lang === 'es' ? 'Activos' : 'Active'}</span>
                        <Badge variant="outline">{enrollments.filter(e => e.status === 'active').length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{lang === 'es' ? 'Completados' : 'Completed'}</span>
                        <Badge variant="outline">{enrollments.filter(e => e.status === 'completed').length}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Link to={createPageUrl(`InstructorGradebook?courseId=${courseId}&courseInstanceId=${courseInstanceId}&lang=${lang}`)}>
                    <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                      <BarChart3 className="w-4 h-4" />
                      {lang === 'es' ? 'Ver Libro de Calificaciones' : 'View Gradebook'}
                    </Button>
                  </Link>

                  {enrollments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      {lang === 'es' ? 'No hay estudiantes inscritos' : 'No students enrolled yet'}
                    </p>
                  ) : (
                    enrollments.map((enrollment, index) => {
                      const studentProgress = progress.filter(p => p.user_email === enrollment.user_email && p.completed).length;
                      const progressPercent = weeks.length > 0 ? Math.round((studentProgress / weeks.length) * 100) : 0;
                      const displayName = enrollment.display_name || enrollment.user_email.split('@')[0];
                      
                      return (
                        <Card key={enrollment.id} className="border-slate-200">
                          <CardContent className="p-3">
                            <p className="text-sm font-medium text-slate-900">{displayName}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-500">{progressPercent}% {lang === 'es' ? 'completado' : 'complete'}</span>
                              <Badge variant="outline" className="text-xs">{enrollment.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              )}

              <TabsContent value="announcements" className="mt-4 space-y-3">
                {isInstructor && !viewAsStudent && (
                  <Button
                    onClick={() => {
                      setEditingAnnouncement(null);
                      setNewAnnouncement({ title: '', content: '' });
                      setShowAnnouncementDialog(true);
                    }}
                    className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2 mb-4"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {lang === 'es' ? 'Nuevo Anuncio' : 'New Announcement'}
                  </Button>
                )}
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    {lang === 'es' ? 'No hay anuncios' : 'No announcements'}
                  </p>
                ) : (
                  announcements.map(announcement => (
                    <Card key={announcement.id} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium">{announcement.title}</CardTitle>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(announcement.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          {isInstructor && !viewAsStudent && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingAnnouncement(announcement);
                                  setNewAnnouncement({ title: announcement.title, content: announcement.content });
                                  setShowAnnouncementDialog(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm(lang === 'es' ? '¿Eliminar anuncio?' : 'Delete announcement?')) {
                                    deleteAnnouncementMutation.mutate(announcement.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-slate-600">
                        <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {isInstructor && !viewAsStudent && (
                <TabsContent value="gradebook" className="mt-4 space-y-4">
                  <Link to={createPageUrl(`InstructorGradebook?courseId=${courseId}&lang=${lang}`)}>
                    <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      {lang === 'es' ? 'Abrir Libro de Calificaciones' : 'Open Gradebook'}
                    </Button>
                  </Link>
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-slate-900 mb-3">
                        {lang === 'es' ? 'Resumen rápido' : 'Quick summary'}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{lang === 'es' ? 'Por calificar:' : 'To grade:'}</span>
                          <Badge variant="destructive">{totalUngraded}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{lang === 'es' ? 'Total estudiantes:' : 'Total students:'}</span>
                          <Badge variant="outline">{enrollments.length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedContent ? (
            <div className="max-w-4xl mx-auto">
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {lang === 'es' ? 'Bienvenido al Curso' : 'Welcome to the Course'}
                  </h2>
                  <p className="text-slate-600">
                    {lang === 'es' 
                      ? 'Selecciona una semana del menú lateral para comenzar' 
                      : 'Select a week from the sidebar to get started'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : selectedContent.type === 'week' ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-3xl font-light text-slate-900 mb-2">
                  {selectedContent.data[`title_${lang}`] || selectedContent.data.title_en}
                </h2>
                <p className="text-slate-600">
                  {lang === 'es' ? 'Semana' : 'Week'} {selectedContent.data.week_number}
                </p>
              </div>

              {selectedContent.data[`overview_${lang}`] && (
                <Card className="border-slate-200 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {lang === 'es' ? 'Resumen' : 'Overview'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      {selectedContent.data[`overview_${lang}`] || selectedContent.data.overview_en}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedContent.data.video_url && (
                <Card className="border-slate-200 mb-6">
                  <CardContent className="p-6">
                    <div className="aspect-video">
                      <iframe
                        src={selectedContent.data.video_url.includes('youtube.com/watch?v=') 
                          ? selectedContent.data.video_url.replace('watch?v=', 'embed/').split('&')[0]
                          : selectedContent.data.video_url.includes('youtu.be/') 
                          ? selectedContent.data.video_url.replace('youtu.be/', 'youtube.com/embed/')
                          : selectedContent.data.video_url
                        }
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedContent.data[`content_blocks_${lang}`] && selectedContent.data[`content_blocks_${lang}`].length > 0 && (
                <Card className="border-slate-200 mb-6">
                  <CardContent className="p-6 space-y-6">
                    {selectedContent.data[`content_blocks_${lang}`].map((block) => (
                      <div key={block.id}>
                        {block.type === 'text' && (
                          <p className="text-slate-700">{block.content}</p>
                        )}
                        {block.type === 'richtext' && (
                          <div 
                            className="prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: block.content }} 
                          />
                        )}
                        {block.type === 'video' && (
                          <div>
                            <div className="aspect-video">
                              <iframe
                                src={block.url.includes('youtube.com/watch?v=') 
                                  ? block.url.replace('watch?v=', 'embed/').split('&')[0]
                                  : block.url.includes('youtu.be/') 
                                  ? block.url.replace('youtu.be/', 'youtube.com/embed/')
                                  : block.url
                                }
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                            {block.caption && (
                              <p className="text-sm text-slate-500 mt-2">{block.caption}</p>
                            )}
                          </div>
                        )}
                        {block.type === 'image' && (
                          <div>
                            <img src={block.url} alt={block.caption || ''} className="w-full rounded-lg" />
                            {block.caption && (
                              <p className="text-sm text-slate-500 mt-2">{block.caption}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedContent.data[`lesson_content_${lang}`] || selectedContent.data.lesson_content_en || ''
                    }} 
                  />
                </CardContent>
              </Card>

              {selectedContent.data.attachments && selectedContent.data.attachments.length > 0 && (
                <Card className="border-slate-200 mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {lang === 'es' ? 'Archivos Adjuntos' : 'Attachments'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedContent.data.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{attachment.title}</span>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )}

              {selectedContent.data[`reading_assignment_${lang}`] && (
                <Card className="border-slate-200 mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {lang === 'es' ? 'Lectura Asignada' : 'Reading Assignment'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      {selectedContent.data[`reading_assignment_${lang}`] || selectedContent.data.reading_assignment_en}
                    </p>
                  </CardContent>
                </Card>
              )}

              {isInstructor && !viewAsStudent && (
                <Card className="border-slate-200 mt-6 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit className="w-5 h-5 text-amber-600" />
                      {lang === 'es' ? 'Acciones del Instructor' : 'Instructor Actions'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link to={createPageUrl(`CourseEditor?id=${courseId}&lang=${lang}`)}>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Edit className="w-4 h-4" />
                        {lang === 'es' ? 'Editar Esta Semana' : 'Edit This Week'}
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`InstructorGradebook?courseId=${courseId}&weekId=${selectedContent.data.id}&lang=${lang}`)}>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {lang === 'es' ? 'Ver Progreso de Estudiantes' : 'View Student Progress'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : selectedContent.type === 'assignment' ? (
            <div className="max-w-4xl mx-auto">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {lang === 'es' ? 'Tarea Escrita' : 'Written Assignment'}
                  </CardTitle>
                  <p className="text-slate-600">
                    {lang === 'es' ? 'Semana' : 'Week'} {selectedContent.data.week_number}
                  </p>
                </CardHeader>
                <CardContent>
                  {isInstructor && !viewAsStudent && (
                    <div className="mb-6">
                      <p className="text-slate-700">
                        {selectedContent.data[`written_assignment_${lang}`] || selectedContent.data.written_assignment_en}
                      </p>
                    </div>
                  )}
                  {isInstructor && !viewAsStudent ? (
                    <Link to={createPageUrl(`InstructorGradebook?courseId=${courseId}&weekId=${selectedContent.data.id}&lang=${lang}`)}>
                      <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {lang === 'es' ? 'Ver Entregas y Calificar' : 'View Submissions & Grade'}
                      </Button>
                    </Link>
                  ) : user ? (
                    <WrittenAssignmentStudent
                      week={selectedContent.data}
                      courseId={courseId}
                      user={user}
                      lang={lang}
                    />
                  ) : (
                    <p className="text-slate-500 text-sm">{lang === 'es' ? 'Inicia sesión para enviar' : 'Log in to submit'}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : selectedContent.type === 'discussion' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {lang === 'es' ? 'Foro de Discusión' : 'Discussion Forum'}
                  </CardTitle>
                  <p className="text-slate-600">
                    {lang === 'es' ? 'Semana' : 'Week'} {selectedContent.data.week_number}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-900 mb-2">
                      {lang === 'es' ? 'Pregunta de Discusión:' : 'Discussion Prompt:'}
                    </p>
                    <p className="text-slate-700">
                      {selectedContent.data[`discussion_prompt_${lang}`] || selectedContent.data.discussion_prompt_en}
                    </p>
                  </div>

                  {user && (
                    <div className="mb-6">
                      <Textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder={lang === 'es' ? 'Escribe tu respuesta...' : 'Write your response...'}
                        rows={4}
                        className="mb-2"
                      />
                      <Button
                        onClick={() => createPostMutation.mutate({
                          forum_id: selectedContent.data.id,
                             week_id: selectedContent.data.id,
                             course_id: courseId,
                             user_email: user.email,
                             user_name: user.full_name || user.email.split('@')[0],
                             title: `Week ${selectedContent.data.week_number} Response`,
                             content: newPost
                        })}
                        disabled={!newPost.trim() || createPostMutation.isPending}
                        className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                      >
                        {createPostMutation.isPending ? '...' : (lang === 'es' ? 'Publicar Respuesta' : 'Post Response')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {forumPosts.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="p-8 text-center text-slate-500">
                    {lang === 'es' ? 'Aún no hay respuestas. ¡Sé el primero en participar!' : 'No responses yet. Be the first to participate!'}
                  </CardContent>
                </Card>
              ) : (
                forumPosts.map(post => {
                const postReplies = forumReplies.filter(r => r.post_id === post.id);
                const canModifyPost = user && (post.user_email === user.email || isInstructor);

                return (
                  <Card key={post.id} className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-semibold">
                          {(post.user_name || post.user_email)?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{post.user_name || post.user_email?.split('@')[0]}</p>
                              <span className="text-xs text-slate-400">
                                {new Date(post.created_date).toLocaleDateString()}
                              </span>
                            </div>
                            {canModifyPost && (
                              <div className="flex gap-1">
                                {post.user_email === user.email && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                    onClick={() => { setEditingPost(post.id); setEditPostText(post.content); }}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm(lang === 'es' ? '¿Eliminar publicación?' : 'Delete this post?')) {
                                      deletePostMutation.mutate(post.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {editingPost === post.id ? (
                            <div className="mb-3 space-y-2">
                              <Textarea
                                value={editPostText}
                                onChange={(e) => setEditPostText(e.target.value)}
                                rows={4}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => updatePostMutation.mutate({ id: post.id, content: editPostText })}
                                  disabled={!editPostText.trim() || updatePostMutation.isPending}
                                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                                >
                                  {lang === 'es' ? 'Guardar' : 'Save'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingPost(null)}>
                                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-700 mb-3">{post.content}</p>
                          )}

                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                              className="text-slate-600"
                            >
                              {lang === 'es' ? 'Responder' : 'Reply'}
                            </Button>
                          )}

                          {replyingTo === post.id && (
                            <div className="mt-3 space-y-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={lang === 'es' ? 'Escribe tu respuesta...' : 'Write your reply...'}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => createReplyMutation.mutate({
                                    post_id: post.id,
                                      user_email: user.email,
                                      user_name: user.full_name || user.email.split('@')[0],
                                      content: replyText
                                  })}
                                  disabled={!replyText.trim()}
                                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                                >
                                  {lang === 'es' ? 'Enviar' : 'Send'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                >
                                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                                </Button>
                              </div>
                            </div>
                          )}

                          <ThreadedReplies
                            postId={post.id}
                            allReplies={forumReplies}
                            user={user}
                            isInstructor={isInstructor}
                            lang={lang}
                            nestedReplyingTo={nestedReplyingTo}
                            setNestedReplyingTo={setNestedReplyingTo}
                            nestedReplyTexts={nestedReplyTexts}
                            setNestedReplyTexts={setNestedReplyTexts}
                            onSubmitNestedReply={(parentReply) => createNestedReplyMutation.mutate({
                              post_id: post.id,
                              parent_id: parentReply.id,
                              depth: (parentReply.depth || 0) + 1,
                              user_email: user.email,
                               user_name: user.full_name || user.email.split('@')[0],
                               content: `@${parentReply.user_name || parentReply.user_email?.split('@')[0]}: ${nestedReplyTexts[parentReply.id] || ''}`
                            })}
                            onDeleteReply={(replyId) => deleteReplyMutation.mutate(replyId)}
                            onUpdateReply={(replyId, content) => updateReplyMutation.mutate({ id: replyId, content })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                })
              )}
            </div>
          ) : selectedContent.type === 'quiz' ? (
            <div className="max-w-4xl mx-auto">
              {(() => {
                const weekQuiz = weekQuizzes.find(q => q.week_id === selectedContent.data.id);

                if (isInstructor && !viewAsStudent) {
                  return (
                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-2xl">
                          {weekQuiz?.[`title_${lang}`] || weekQuiz?.title_en || (lang === 'es' ? 'Cuestionario' : 'Quiz')}
                        </CardTitle>
                        <p className="text-slate-600">
                          {lang === 'es' ? 'Semana' : 'Week'} {selectedContent.data.week_number}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {weekQuiz && (
                          <div className="mb-6 space-y-3">
                            {weekQuiz[`instructions_${lang}`] && (
                              <p className="text-slate-600">{weekQuiz[`instructions_${lang}`] || weekQuiz.instructions_en}</p>
                            )}
                            <div className="flex gap-4 text-sm text-slate-600">
                              <span>{lang === 'es' ? 'Umbral de Aprobación:' : 'Pass Threshold:'} {weekQuiz.pass_threshold}%</span>
                              <span>{lang === 'es' ? 'Intentos Máximos:' : 'Max Attempts:'} {weekQuiz.max_attempts}</span>
                            </div>
                          </div>
                        )}
                        <Link to={createPageUrl(`InstructorGradebook?courseId=${courseId}&weekId=${selectedContent.data.id}&lang=${lang}`)}>
                          <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                            <BarChart3 className="w-4 h-4" />
                            {lang === 'es' ? 'Ver Intentos y Calificaciones' : 'View Attempts & Grades'}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                }

                if (!weekQuiz) {
                  return (
                    <Card className="border-slate-200">
                      <CardContent className="p-8 text-center text-slate-500">
                        {lang === 'es' ? 'Cuestionario no disponible' : 'Quiz not available'}
                      </CardContent>
                    </Card>
                  );
                }

                return user ? (
                  <WeekQuizStudent weekId={selectedContent.data.id} user={user} lang={lang} />
                ) : (
                  <Card className="border-slate-200">
                    <CardContent className="p-8 text-center text-slate-500">
                      {lang === 'es' ? 'Inicia sesión para tomar el cuestionario' : 'Log in to take the quiz'}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : null}
        </main>
      </div>

      {/* Announcement Dialog */}
      {showAnnouncementDialog && (
        <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === 'es' ? 'Crear Anuncio' : 'Create Announcement'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {lang === 'es' ? 'Título' : 'Title'}
                </label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder={lang === 'es' ? 'Título del anuncio' : 'Announcement title'}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {lang === 'es' ? 'Contenido' : 'Content'}
                </label>
                <Textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder={lang === 'es' ? 'Contenido del anuncio' : 'Announcement content'}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={() => createAnnouncementMutation.mutate(newAnnouncement)}
                disabled={!newAnnouncement.title || !newAnnouncement.content}
                className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
              >
                {lang === 'es' ? 'Publicar' : 'Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}