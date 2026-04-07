import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';

export default function CourseCalendar({ user, userType, lang = 'en' }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: instances = [] } = useQuery({
    queryKey: ['courseInstances'],
    queryFn: () => base44.entities.CourseInstance.list('-start_date')
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list()
  });

  // Semester colors for legend
  const semesterColors = {
    'Spring': 'bg-green-100 border-green-400',
    'Summer': 'bg-yellow-100 border-yellow-400',
    'Fall': 'bg-orange-100 border-orange-400',
    'Winter': 'bg-blue-100 border-blue-400'
  };

  const getSemesterColor = (termName) => {
    for (const [key, color] of Object.entries(semesterColors)) {
      if (termName.includes(key)) return color;
    }
    return 'bg-slate-100 border-slate-400';
  };

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email && userType === 'student'
  });

  // Filter instances based on user type
  const relevantInstances = instances.filter(instance => {
    if (userType === 'admin') return true;
    if (userType === 'instructor') {
      // Only show courses instructor is assigned to teach
      return instance.instructor_emails?.includes(user?.email);
    }
    if (userType === 'student') {
      return enrollments.some(e => e.course_id === instance.course_id);
    }
    return false;
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getInstancesForDay = (day) => {
    return relevantInstances.filter(instance => {
      const start = parseISO(instance.start_date);
      const end = parseISO(instance.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {userType === 'instructor' ? 'My Teaching Schedule' : 
             userType === 'student' ? 'My Course Schedule' : 'Academic Calendar'}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={prevMonth}>&larr;</Button>
            <span className="font-semibold min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button size="sm" variant="outline" onClick={nextMonth}>&rarr;</Button>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(semesterColors).map(([season, color]) => (
            <div key={season} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${color}`} />
              <span className="text-slate-600">{season}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, idx) => {
            const instancesOnDay = getInstancesForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={`min-h-[80px] border rounded-lg p-2 ${
                  isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                } ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
              >
                <div className="text-sm font-medium text-slate-700 mb-1">
                  {format(day, 'd')}
                </div>
                {instancesOnDay.length > 0 && (
                  <div className="space-y-1">
                    {instancesOnDay.slice(0, 2).map(instance => {
                           const course = courses.find(c => c.id === instance.course_id);
                           const term = terms.find(t => t.id === instance.term_id);
                           const color = getSemesterColor(term?.name || '');
                           return (
                             <div
                               key={instance.id}
                               className={`text-xs rounded px-1 py-0.5 truncate border-l-2 pl-1 ${color}`}
                               title={`${course?.[`title_${lang}`] || course?.title_en} - ${instance.cohort_name}`}
                             >
                               {instance.cohort_name}
                             </div>
                           );
                         })}
                    {instancesOnDay.length > 2 && (
                      <div className="text-xs text-slate-500">+{instancesOnDay.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming Courses List */}
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-slate-900">
            {userType === 'instructor' ? 'My Upcoming Courses' :
             userType === 'student' ? 'My Scheduled Courses' : 'Upcoming Course Instances'}
          </h3>
          {relevantInstances.slice(0, 5).map(instance => {
            const course = courses.find(c => c.id === instance.course_id);
            const term = terms.find(t => t.id === instance.term_id);
            
            return (
              <div key={instance.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">
                      {course?.[`title_${lang}`] || course?.title_en}
                    </h4>
                    <p className="text-sm text-slate-600">{instance.cohort_name} • {term?.name}</p>
                  </div>
                  <Badge className={
                    instance.status === 'active' ? 'bg-green-100 text-green-700' :
                    instance.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }>
                    {instance.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    {format(new Date(instance.start_date), 'MMM d')} - {format(new Date(instance.end_date), 'MMM d, yyyy')}
                  </div>
                  {instance.meeting_schedule && (
                    <div className="text-slate-600">
                      📅 {instance.meeting_schedule}
                    </div>
                  )}
                  {userType !== 'student' && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      {instance.current_enrollment || 0} students
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}