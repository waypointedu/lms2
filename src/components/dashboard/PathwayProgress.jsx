import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PathwayProgress({ enrollments, courses, progress }) {
  // Get Biblical Formation pathway courses
  const pathwayCourses = [
    { order: 1, name: "Waypoint Introduction Seminar", credits: 1, weeks: 2 },
    { order: 2, name: "Hermeneutics", credits: 4, weeks: 16 },
    { order: 3, name: "Old Testament: Torah, Prophets, Writings", credits: 4, weeks: 16 },
    { order: 4, name: "New Testament: Gospels & Acts", credits: 4, weeks: 16 },
    { order: 5, name: "New Testament: Epistles & Revelation", credits: 4, weeks: 16 },
    { order: 6, name: "Biblical Principles of Culture", credits: 4, weeks: 16 },
    { order: 7, name: "Biblical Spiritual Practices", credits: 4, weeks: 16 },
    { order: 8, name: "Apologetics Seminar Series", credits: 1, weeks: 8 }
  ];

  const enrolledCourseIds = enrollments.filter(e => e.status !== 'dropped').map(e => e.course_id);

  // Don't show the pathway card if the student isn't enrolled in any pathway courses
  const isInProgram = pathwayCourses.some(pc => {
    const course = courses.find(c => c.title_en === pc.name);
    return course && enrolledCourseIds.includes(course.id);
  });

  const getCourseStatus = (courseName) => {
    const course = courses.find(c => c.title_en === courseName);
    if (!course) return 'locked';
    
    const isEnrolled = enrolledCourseIds.includes(course.id);
    if (!isEnrolled) return 'available';
    
    const courseProgress = progress.find(p => p.course_id === course.id);
    if (courseProgress?.completion_percentage === 100) return 'completed';
    if (courseProgress) return 'in-progress';
    return 'enrolled';
  };

  const totalCredits = pathwayCourses.reduce((sum, c) => sum + c.credits, 0);
  const completedCredits = pathwayCourses.reduce((sum, c) => {
    const status = getCourseStatus(c.name);
    return sum + (status === 'completed' ? c.credits : 0);
  }, 0);

  const overallProgress = (completedCredits / totalCredits) * 100;

  if (!isInProgram) return null;

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader>
        <CardTitle className="text-2xl">Biblical Formation Certificate</CardTitle>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">{completedCredits} of {totalCredits} credits</span>
          <span className="text-sm font-semibold text-[#1e3a5f]">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pathwayCourses.map((pathwayCourse, index) => {
            const course = courses.find(c => c.title_en === pathwayCourse.name);
            const status = getCourseStatus(pathwayCourse.name);
            const courseProgress = course ? progress.find(p => p.course_id === course.id) : null;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : status === 'in-progress'
                    ? 'bg-blue-50 border-blue-200'
                    : status === 'enrolled'
                    ? 'bg-slate-50 border-slate-200'
                    : status === 'available'
                    ? 'bg-white border-slate-200 hover:border-[#1e3a5f] cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex-shrink-0">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : status === 'in-progress' || status === 'enrolled' ? (
                    <Circle className="w-6 h-6 text-blue-500" />
                  ) : status === 'available' ? (
                    <Circle className="w-6 h-6 text-slate-400" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-900 truncate">{pathwayCourse.name}</h4>
                    <span className="text-xs text-slate-500 ml-2">{pathwayCourse.credits} cr</span>
                  </div>
                  {courseProgress && (
                    <div className="flex items-center gap-2">
                      <Progress value={courseProgress.completion_percentage || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-slate-500">{Math.round(courseProgress.completion_percentage || 0)}%</span>
                    </div>
                  )}
                  {status === 'available' && course && (
                    <Link to={createPageUrl(`CourseInstanceCatalog?lang=en`)} className="text-xs text-[#1e3a5f] hover:underline mt-1 inline-block">
                      Enroll now →
                    </Link>
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