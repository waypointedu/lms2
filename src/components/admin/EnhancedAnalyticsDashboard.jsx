import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, BookOpen, Award } from "lucide-react";

export default function EnhancedAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('month');

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list()
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () => base44.entities.Progress.list()
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.ReadingSession.list()
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' })
  });

  // Calculate metrics
  const totalEnrollments = enrollments.length;
  const activeStudents = new Set(enrollments.map(e => e.user_email)).size;
  const avgCompletion = progress.length > 0 
    ? (progress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / progress.length).toFixed(1)
    : 0;
  const totalReadingSessions = sessions.length;

  // Enrollment trend data
  const enrollmentByMonth = enrollments.reduce((acc, e) => {
    const date = new Date(e.created_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === date);
    if (existing) existing.count++;
    else acc.push({ month: date, count: 1 });
    return acc;
  }, []).slice(-12);

  // Course popularity
  const coursePopularity = courses.map(course => ({
    name: course.title_en,
    enrollments: enrollments.filter(e => e.course_id === course.id).length
  })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 8);

  // Reading activity by day
  const readingByDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => ({
    day,
    sessions: sessions.filter(s => {
      const date = new Date(s.session_date);
      return date.getDay() === idx;
    }).length
  }));

  // Student engagement
  const engagementMetrics = [
    {
      label: 'Total Enrollments',
      value: totalEnrollments,
      icon: Users,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      label: 'Active Students',
      value: activeStudents,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-800'
    },
    {
      label: 'Avg Completion',
      value: `${avgCompletion}%`,
      icon: BookOpen,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      label: 'Reading Sessions',
      value: totalReadingSessions,
      icon: Award,
      color: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {engagementMetrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={enrollmentByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1e3a5f" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reading Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading Activity by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={readingByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Popularity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Courses by Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePopularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}