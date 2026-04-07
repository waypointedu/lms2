import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Download, ArrowLeft, Award, CheckCircle2, Clock } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Transcript() {
  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get('email');
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [currentUser, setCurrentUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const transcriptRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const targetEmail = userEmail || currentUser?.email;

  const { data: user } = useQuery({
    queryKey: ['user', targetEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: targetEmail });
      return users[0];
    },
    enabled: !!targetEmail
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', targetEmail],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: targetEmail }),
    enabled: !!targetEmail
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['progress', targetEmail],
    queryFn: () => base44.entities.Progress.filter({ user_email: targetEmail }),
    enabled: !!targetEmail
  });

  const { data: allQuizAttempts = [] } = useQuery({
    queryKey: ['quizAttempts', targetEmail],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: targetEmail }),
    enabled: !!targetEmail
  });

  const { data: pathwayEnrollments = [] } = useQuery({
    queryKey: ['pathwayEnrollments', targetEmail],
    queryFn: () => base44.entities.PathwayEnrollment.filter({ user_email: targetEmail }),
    enabled: !!targetEmail
  });

  const { data: allPathways = [] } = useQuery({
    queryKey: ['pathways'],
    queryFn: () => base44.entities.Pathway.list()
  });

  const enrolledCourses = enrollments.map(e => {
    const course = allCourses.find(c => c.id === e.course_id);
    const courseQuizzes = allQuizAttempts.filter(qa => qa.course_id === e.course_id);
    const passedQuizzes = courseQuizzes.filter(qa => qa.passed);
    
    // Calculate grade based on quiz performance
    const avgQuizScore = courseQuizzes.length > 0 
      ? courseQuizzes.reduce((sum, qa) => sum + qa.score, 0) / courseQuizzes.length 
      : 0;
    
    let grade = 'N/A';
    if (e.status === 'completed') {
      if (avgQuizScore >= 90) grade = 'A';
      else if (avgQuizScore >= 80) grade = 'B';
      else if (avgQuizScore >= 70) grade = 'C';
      else if (avgQuizScore >= 60) grade = 'D';
      else grade = 'F';
    }
    
    return {
      ...course,
      enrollment: e,
      credits: course?.credits || 0,
      grade,
      avgQuizScore: avgQuizScore.toFixed(1)
    };
  }).filter(c => c.id);

  const completedCourses = enrolledCourses.filter(c => c.enrollment.status === 'completed');
  const totalCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
  
  // Calculate GPA (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0)
  const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0, 'N/A': 0 };
  const totalGradePoints = completedCourses.reduce((sum, c) => sum + (gradePoints[c.grade] || 0), 0);
  const gpa = completedCourses.length > 0 ? (totalGradePoints / completedCourses.length).toFixed(2) : '0.00';

  const downloadPDF = async () => {
    if (!transcriptRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(transcriptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`waypoint-transcript-${displayUser?.email || 'student'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const text = {
    en: {
      title: "Academic Transcript",
      download: "Download PDF",
      studentInfo: "Student Information",
      name: "Name",
      email: "Email",
      enrollmentDate: "First Enrollment",
      summary: "Academic Summary",
      coursesCompleted: "Courses Completed",
      totalCredits: "Total Credits Earned",
      gpa: "Cumulative GPA",
      courseHistory: "Course History",
      course: "Course",
      term: "Term",
      grade: "Grade",
      credits: "Credits",
      status: "Status",
      completed: "Completed",
      inProgress: "In Progress",
      officialRecord: "This is an unofficial academic record from Waypoint Institute.",
      generatedOn: "Generated on",
      programProgress: "Program Progress",
      program: "Program",
      coursesRemaining: "Courses Remaining",
      pathwayCompleted: "Pathway Completed"
    },
    es: {
      title: "Expediente Académico",
      download: "Descargar PDF",
      studentInfo: "Información del Estudiante",
      name: "Nombre",
      email: "Correo",
      enrollmentDate: "Primera Inscripción",
      summary: "Resumen Académico",
      coursesCompleted: "Cursos Completados",
      totalCredits: "Créditos Totales",
      gpa: "GPA Acumulado",
      courseHistory: "Historial de Cursos",
      course: "Curso",
      term: "Término",
      grade: "Calificación",
      credits: "Créditos",
      status: "Estado",
      completed: "Completado",
      inProgress: "En Progreso",
      officialRecord: "Este es un registro académico no oficial del Instituto Waypoint.",
      generatedOn: "Generado el",
      programProgress: "Progreso del Programa",
      program: "Programa",
      coursesRemaining: "Cursos Restantes",
      pathwayCompleted: "Programa Completado"
    }
  };

  const t = text[lang];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  // Use currentUser as fallback if the User entity lookup didn't return a result
  const displayUser = user || currentUser;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl(`Dashboard?lang=${lang}`)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            {lang === 'es' ? 'Volver' : 'Back'}
          </Link>
          <Button onClick={downloadPDF} disabled={isGenerating} className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? '...' : t.download}
          </Button>
        </div>

        <div ref={transcriptRef} className="bg-white rounded-lg shadow-lg p-12 border-4 border-[#1e3a5f]">
          {/* Header */}
          <div className="text-center border-b-2 border-[#c4933f] pb-6 mb-8">
            <div className="flex justify-center mb-4">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-24" />
            </div>
            <h1 className="text-4xl font-light text-slate-900 mb-2">Waypoint Institute</h1>
            <h2 className="text-2xl text-[#c4933f] font-serif italic">Academic Transcript</h2>
            <p className="text-sm text-slate-500 mt-2">
              {t.generatedOn}: {new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Student Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#1e3a5f]" />
                {t.studentInfo}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">{t.name}</div>
                  <div className="font-medium">{displayUser.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">{t.email}</div>
                  <div className="font-medium">{displayUser.email}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">{t.enrollmentDate}</div>
                  <div className="font-medium">
                    {enrollments[0]?.enrolled_date ? new Date(enrollments[0].enrolled_date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card className="mb-8 bg-gradient-to-br from-[#1e3a5f]/5 to-[#c4933f]/5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.summary}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1e3a5f]">{completedCourses.length}</div>
                  <div className="text-sm text-slate-600">{t.coursesCompleted}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#c4933f]">{totalCredits}</div>
                  <div className="text-sm text-slate-600">{t.totalCredits}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1e3a5f]">{gpa}</div>
                  <div className="text-sm text-slate-600">{t.gpa}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Progress */}
          {pathwayEnrollments.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.programProgress}</h3>
                {pathwayEnrollments.map(pe => {
                  const pathway = allPathways.find(p => p.id === pe.pathway_id);
                  if (!pathway) return null;
                  
                  const requiredCourseIds = pathway.course_ids || [];
                  const completedCourseIds = completedCourses.map(c => c.id);
                  const completedRequired = requiredCourseIds.filter(id => completedCourseIds.includes(id));
                  const remaining = requiredCourseIds.length - completedRequired.length;
                  const isComplete = remaining === 0;
                  
                  return (
                    <div key={pe.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{pathway[`title_${lang}`] || pathway.title_en}</h4>
                          <p className="text-sm text-slate-600">{pathway.type}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#1e3a5f]">
                            {completedRequired.length}/{requiredCourseIds.length}
                          </div>
                          <div className="text-xs text-slate-500">{t.coursesCompleted}</div>
                        </div>
                      </div>
                      {isComplete ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 text-sm font-medium">
                          ✓ {t.pathwayCompleted}
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 text-sm">
                          {remaining} {t.coursesRemaining}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Course History Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#1e3a5f]" />
              {t.courseHistory}
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">{t.course}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">{t.term}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">{t.grade}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">{t.credits}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledCourses.map(course => (
                    <tr key={course.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900 font-medium">{course[`title_${lang}`] || course.title_en}</td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {course.enrollment.enrolled_date 
                          ? new Date(course.enrollment.enrolled_date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short' })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${course.grade === 'A' ? 'text-green-600' : course.grade === 'B' ? 'text-blue-600' : course.grade === 'C' ? 'text-yellow-600' : 'text-slate-600'}`}>
                          {course.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{course.credits}</td>
                      <td className="px-4 py-3 text-center">
                        {course.enrollment.status === 'completed' ? (
                          <span className="text-green-600 font-medium">✓</span>
                        ) : (
                          <span className="text-blue-600 text-xs">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-slate-200 pt-6 text-center text-sm text-slate-500">
            <p className="italic">{t.officialRecord}</p>
            <p className="mt-2">© {new Date().getFullYear()} Waypoint Institute</p>
          </div>
        </div>
      </div>
    </div>
  );
}