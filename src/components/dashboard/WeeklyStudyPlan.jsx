import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, MessageSquare, FileText } from "lucide-react";
import { format } from 'date-fns';

export default function WeeklyStudyPlan({ enrollments, courses, weeks }) {
  // Return null if no enrollments
  if (!enrollments || enrollments.length === 0) {
    return null;
  }

  const getCurrentWeekTasks = () => {
    const tasks = [];
    
    enrollments.forEach(enrollment => {
      const course = courses.find(c => c.id === enrollment.course_id);
      if (!course) return;
      
      // Get weeks for this course
      const courseWeeks = weeks.filter(w => w.course_id === course.id).sort((a, b) => a.week_number - b.week_number);
      
      // Find current week (simplified - would use actual dates in production)
      const currentWeek = courseWeeks[0];
      
      if (currentWeek) {
        const weekLinkUrl = `Week?id=${currentWeek.id}&lang=en`;
        
        tasks.push({
          type: 'reading',
          course: course.title_en,
          title: currentWeek.title_en,
          description: `Week ${currentWeek.week_number} reading`,
          icon: BookOpen,
          link: createPageUrl(weekLinkUrl)
        });
        
        if (currentWeek.has_discussion) {
          tasks.push({
            type: 'discussion',
            course: course.title_en,
            title: 'Discussion forum',
            description: `${course.title_en} - Week ${currentWeek.week_number} discussion`,
            icon: MessageSquare,
            link: createPageUrl(`CourseForum?courseId=${course.id}&lang=en`)
          });
        }
        
        if (currentWeek.has_written_assignment) {
          tasks.push({
            type: 'assignment',
            course: course.title_en,
            title: 'Written assignment',
            description: `Week ${currentWeek.week_number} submission`,
            icon: FileText,
            link: createPageUrl(weekLinkUrl)
          });
        }
      }
    });
    
    return tasks.slice(0, 5);
  };

  const tasks = getCurrentWeekTasks();

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1e3a5f]" />
          <CardTitle className="text-xl">This Week's Study Plan</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <Link
                key={index}
                to={task.link}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className={`p-2 rounded-lg ${
                  task.type === 'reading' ? 'bg-blue-100' :
                  task.type === 'discussion' ? 'bg-purple-100' :
                  'bg-green-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    task.type === 'reading' ? 'text-blue-600' :
                    task.type === 'discussion' ? 'text-purple-600' :
                    'text-green-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.course}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}