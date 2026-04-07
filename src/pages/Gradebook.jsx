import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Award } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';

export default function Gradebook() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId
  });

  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks', courseId],
    queryFn: () => base44.entities.Week.filter({ course_id: courseId }),
    select: (data) => data.sort((a, b) => a.week_number - b.week_number),
    enabled: !!courseId
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', courseId, user?.email],
    queryFn: () => base44.entities.GradeEntry.filter({ course_id: courseId, user_email: user?.email }),
    enabled: !!courseId && !!user?.email
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['weekQuizAttempts', courseId, user?.email],
    queryFn: () => base44.entities.WeekQuizAttempt.filter({ course_id: courseId, user_email: user?.email }),
    enabled: !!courseId && !!user?.email
  });

  const { data: writtenSubmissions = [] } = useQuery({
    queryKey: ['writtenSubmissions', courseId, user?.email],
    queryFn: () => base44.entities.WrittenAssignmentSubmission.filter({ course_id: courseId, user_email: user?.email }),
    enabled: !!courseId && !!user?.email
  });

  const text = {
    en: {
      title: 'My Grades',
      week: 'Week',
      assignment: 'Assignment',
      grade: 'Grade',
      status: 'Status',
      graded: 'Graded',
      pending: 'Pending',
      noGrades: 'No grades available yet',
      average: 'Course Average'
    },
    es: {
      title: 'Mis Calificaciones',
      week: 'Semana',
      assignment: 'Tarea',
      grade: 'Calificación',
      status: 'Estado',
      graded: 'Calificado',
      pending: 'Pendiente',
      noGrades: 'No hay calificaciones disponibles aún',
      average: 'Promedio del Curso'
    }
  };

  const t = text[lang];

  const gradeRows = weeks.flatMap(week => {
    const rows = [];
    
    // Quiz grade
    if (week.has_quiz) {
      const quizAttempt = quizAttempts.find(qa => qa.week_id === week.id && qa.passed);
      rows.push({
        week: week.week_number,
        assignment: lang === 'es' ? 'Quiz' : 'Quiz',
        grade: quizAttempt?.final_score,
        graded: !!quizAttempt
      });
    }
    
    // Written assignment grade
    if (week.has_written_assignment) {
      const submission = writtenSubmissions.find(ws => ws.week_id === week.id);
      rows.push({
        week: week.week_number,
        assignment: lang === 'es' ? 'Tarea Escrita' : 'Written Assignment',
        grade: submission?.grade,
        graded: submission?.status === 'graded'
      });
    }
    
    return rows;
  });

  const gradedCount = gradeRows.filter(r => r.graded).length;
  const totalGrades = gradeRows.reduce((sum, r) => sum + (r.grade || 0), 0);
  const average = gradedCount > 0 ? Math.round(totalGrades / gradedCount) : 0;

  if (!user || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          to={createPageUrl(`Course?id=${courseId}&lang=${lang}`)}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {course[`title_${lang}`] || course.title_en}
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light text-slate-900">{t.title}</h1>
          <div className="text-right">
            <div className="text-sm text-slate-500">{t.average}</div>
            <div className="text-3xl font-bold text-[#1e3a5f]">{average}%</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#1e3a5f]" />
              {course[`title_${lang}`] || course.title_en}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeRows.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {t.noGrades}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.week}</TableHead>
                    <TableHead>{t.assignment}</TableHead>
                    <TableHead>{t.grade}</TableHead>
                    <TableHead>{t.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.week}</TableCell>
                      <TableCell>{row.assignment}</TableCell>
                      <TableCell>
                        {row.graded ? (
                          <span className="font-semibold text-[#1e3a5f]">{row.grade}%</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.graded ? (
                          <span className="text-emerald-600 text-sm">{t.graded}</span>
                        ) : (
                          <span className="text-amber-600 text-sm">{t.pending}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}