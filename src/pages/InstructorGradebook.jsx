import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Save, ExternalLink, FileText } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';

export default function InstructorGradebook() {
   const urlParams = new URLSearchParams(window.location.search);
   const courseId = urlParams.get('course_id') || urlParams.get('courseId');
   const courseInstanceId = urlParams.get('courseInstanceId');
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);
  const [edits, setEdits] = useState({});
  const queryClient = useQueryClient();

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

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', courseId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEnrolledStudents', { courseId, courseInstanceId });
      return res.data.students || [];
    },
    enabled: !!courseId
  });

  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks', courseId],
    queryFn: () => base44.entities.Week.filter({ course_id: courseId }),
    select: (data) => data.sort((a, b) => a.week_number - b.week_number),
    enabled: !!courseId
  });

  const { data: allQuizAttempts = [] } = useQuery({
    queryKey: ['allQuizAttempts', courseId],
    queryFn: () => base44.entities.WeekQuizAttempt.filter({ course_id: courseId }),
    enabled: !!courseId
  });

  const { data: allWrittenSubmissions = [] } = useQuery({
    queryKey: ['allWrittenSubmissions', courseId],
    queryFn: () => base44.entities.WrittenAssignmentSubmission.filter({ course_id: courseId }),
    enabled: !!courseId
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({ submissionId, newGrade, type }) => {
      if (type === 'written') {
        return base44.entities.WrittenAssignmentSubmission.update(submissionId, {
          grade: newGrade,
          status: 'graded',
          graded_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWrittenSubmissions', courseId] });
      setEdits({});
    }
  });

  const handleGradeChange = (studentEmail, weekId, assignmentType, value) => {
    setEdits({
      ...edits,
      [`${studentEmail}-${weekId}-${assignmentType}`]: value
    });
  };

  const handleSaveGrade = (studentEmail, weekId, assignmentType) => {
    const editKey = `${studentEmail}-${weekId}-${assignmentType}`;
    const newGrade = parseFloat(edits[editKey]);
    
    if (assignmentType === 'written') {
      const submission = allWrittenSubmissions.find(
        s => s.user_email === studentEmail && s.week_id === weekId
      );
      if (submission) {
        updateGradeMutation.mutate({
          submissionId: submission.id,
          newGrade,
          type: 'written'
        });
      }
    }
  };

  const text = {
    en: {
      title: 'Instructor Gradebook',
      student: 'Student',
      average: 'Average',
      save: 'Save',
      noStudents: 'No students enrolled yet'
    },
    es: {
      title: 'Libro de Calificaciones del Instructor',
      student: 'Estudiante',
      average: 'Promedio',
      save: 'Guardar',
      noStudents: 'Aún no hay estudiantes inscritos'
    }
  };

  const t = text[lang];



  if (!user || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  const assignments = weeks.flatMap(week => {
    const items = [];
    if (week.has_quiz) items.push({ weekId: week.id, weekNum: week.week_number, type: 'quiz', name: `W${week.week_number} Quiz` });
    if (week.has_written_assignment) items.push({ weekId: week.id, weekNum: week.week_number, type: 'written', name: `W${week.week_number} Written` });
    return items;
  });

  const studentRows = enrollments.map((enrollment) => {
    const displayName = enrollment.display_name || enrollment.user_email.split('@')[0];
    
    const studentGrades = assignments.map(assignment => {
      let grade = null;
      let submission = null;
      const editKey = `${enrollment.user_email}-${assignment.weekId}-${assignment.type}`;
      
      if (assignment.type === 'quiz') {
        // Show the best attempt's score regardless of pass/fail
        const studentAttempts = allQuizAttempts.filter(
          qa => qa.user_email === enrollment.user_email && qa.week_id === assignment.weekId
        );
        const bestAttempt = studentAttempts.sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0))[0];
        grade = bestAttempt?.final_score ?? null;
      } else if (assignment.type === 'written') {
        submission = allWrittenSubmissions.find(
          ws => ws.user_email === enrollment.user_email && ws.week_id === assignment.weekId
        );
        grade = submission?.status === 'graded' ? submission.grade : null;
      }
      
      return {
        ...assignment,
        grade: edits[editKey] !== undefined ? edits[editKey] : grade,
        isEdited: edits[editKey] !== undefined,
        submission
      };
    });

    const gradedCount = studentGrades.filter(g => g.grade !== null).length;
    const totalGrades = studentGrades.reduce((sum, g) => sum + (parseFloat(g.grade) || 0), 0);
    const average = gradedCount > 0 ? Math.round(totalGrades / gradedCount) : 0;

    return {
      email: enrollment.user_email,
      displayName,
      grades: studentGrades,
      average
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl(`CourseView?courseId=${courseId}&lang=${lang}`)}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {lang === 'es' ? 'Volver al Curso' : 'Back to Course'}
              </Button>
            </Link>
            <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
            </Link>
          </div>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-slate-900 mb-2">{t.title}</h1>
        <p className="text-slate-600 mb-8">{course[`title_${lang}`] || course.title_en}</p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#1e3a5f]" />
              {t.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentRows.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {t.noStudents}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">{t.student}</TableHead>
                      {assignments.map((assignment, idx) => (
                        <TableHead key={idx} className="text-center min-w-[100px]">
                          {assignment.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold">{t.average}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRows.map((student, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{student.displayName}</TableCell>
                        {student.grades.map((gradeData, gIdx) => (
                          <TableCell key={gIdx} className="text-center">
                            {gradeData.type === 'written' ? (
                              <div className="flex flex-col items-center gap-1">
                                {gradeData.submission && (
                                  <a
                                    href={gradeData.submission.google_docs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline mb-1"
                                    title="View submission"
                                  >
                                    <FileText className="w-3 h-3" />
                                    {gradeData.submission.status === 'submitted' ? (
                                      <span className="text-amber-600">Pending</span>
                                    ) : (
                                      <span className="text-emerald-600">Graded</span>
                                    )}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={gradeData.grade || ''}
                                    onChange={(e) => handleGradeChange(student.email, gradeData.weekId, gradeData.type, e.target.value)}
                                    className="w-16 text-center"
                                    min="0"
                                    max="100"
                                    placeholder="—"
                                  />
                                  {gradeData.isEdited && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSaveGrade(student.email, gradeData.weekId, gradeData.type)}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="font-semibold text-[#1e3a5f]">
                                {gradeData.grade !== null ? `${gradeData.grade}%` : '—'}
                              </span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold text-[#1e3a5f]">
                          {student.average}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}