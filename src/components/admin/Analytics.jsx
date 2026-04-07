import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, TrendingUp, Award } from "lucide-react";

export default function Analytics({ lang = 'en' }) {
  const { data: enrollments = [] } = useQuery({
    queryKey: ['allEnrollments'],
    queryFn: () => base44.entities.Enrollment.list()
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['allCourses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['allQuizAttempts'],
    queryFn: () => base44.entities.QuizAttempt.list()
  });

  const text = {
    en: {
      title: "Analytics Overview",
      totalEnrollments: "Total Enrollments",
      totalCourses: "Total Courses",
      completionRate: "Completion Rate",
      avgQuizScore: "Avg Quiz Score",
      enrollmentsByCourse: "Enrollments by Course",
      enrollments: "Enrollments",
      noData: "No data available yet."
    },
    es: {
      title: "Resumen de Analíticas",
      totalEnrollments: "Inscripciones Totales",
      totalCourses: "Cursos Totales",
      completionRate: "Tasa de Finalización",
      avgQuizScore: "Puntaje Promedio Quiz",
      enrollmentsByCourse: "Inscripciones por Curso",
      enrollments: "Inscripciones",
      noData: "Aún no hay datos disponibles."
    }
  };

  const t = text[lang];

  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
  const completionRate = enrollments.length > 0 
    ? Math.round((completedEnrollments / enrollments.length) * 100) 
    : 0;

  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
    : 0;

  const enrollmentsByCourse = courses.map(course => ({
    name: course.title_en.substring(0, 20) + (course.title_en.length > 20 ? '...' : ''),
    count: enrollments.filter(e => e.course_id === course.id).length
  })).filter(d => d.count > 0);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t.title}</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: t.totalEnrollments, value: enrollments.length, icon: Users, color: 'bg-blue-500' },
          { label: t.totalCourses, value: courses.length, icon: BookOpen, color: 'bg-purple-500' },
          { label: t.completionRate, value: `${completionRate}%`, icon: TrendingUp, color: 'bg-emerald-500' },
          { label: t.avgQuizScore, value: `${avgQuizScore}%`, icon: Award, color: 'bg-amber-500' }
        ].map((stat, i) => (
          <Card key={i} className="border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <div className={`w-10 h-10 rounded-xl ${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enrollments Chart */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>{t.enrollmentsByCourse}</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollmentsByCourse.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              {t.noData}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentsByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#1e3a5f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}