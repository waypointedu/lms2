import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function InstructorApprovalManager() {
  const queryClient = useQueryClient();
  const [expandedUser, setExpandedUser] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list('-start_date')
  });

  const { data: allAvailability = [] } = useQuery({
    queryKey: ['allSemesterAvailability'],
    queryFn: () => base44.entities.InstructorSemesterAvailability.list()
  });

  const { data: courseInstances = [] } = useQuery({
    queryKey: ['courseInstances'],
    queryFn: () => base44.entities.CourseInstance.list()
  });

  const instructors = users.filter(u => u.user_type === 'instructor');

  const getInstructorCourseCount = (instructorEmail) => {
    return courseInstances.filter(ci => 
      ci.instructor_emails && ci.instructor_emails.includes(instructorEmail)
    ).length;
  };

  const getInstructorAvailability = (instructorEmail) => {
    return allAvailability.filter(a => a.instructor_email === instructorEmail);
  };

  const updateApprovedCoursesMutation = useMutation({
    mutationFn: async ({ userId, courseIds }) => {
      return base44.entities.User.update(userId, { approved_courses: courseIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    }
  });

  const handleToggleCourse = (instructor, courseId) => {
    const currentApproved = instructor.approved_courses || [];
    const updated = currentApproved.includes(courseId)
      ? currentApproved.filter(id => id !== courseId)
      : [...currentApproved, courseId];
    
    updateApprovedCoursesMutation.mutate({ userId: instructor.id, courseIds: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#1e3a5f]" />
        <h2 className="text-2xl font-semibold text-slate-900">Instructor Approvals</h2>
      </div>

      <div className="grid gap-4">
        {instructors.map(instructor => {
          const courseCount = getInstructorCourseCount(instructor.email);
          const availability = getInstructorAvailability(instructor.email);
          
          return (
            <Card key={instructor.id}>
              <CardContent className="p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedUser(expandedUser === instructor.id ? null : instructor.id)}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{instructor.full_name}</h3>
                    <p className="text-sm text-slate-600">{instructor.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {courseCount} {courseCount === 1 ? 'course' : 'courses'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {(instructor.approved_courses || []).length} approved
                    </Badge>
                  </div>
                </div>

                {expandedUser === instructor.id && (
                  <div className="mt-4 pt-4 border-t space-y-6">
                    {/* Semester Availability Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <p className="text-sm font-medium text-slate-700">Semester Availability</p>
                      </div>
                      {availability.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availability.map(avail => {
                            const term = terms.find(t => t.id === avail.term_id);
                            return (
                              <div key={avail.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-medium text-sm text-slate-900">{term?.name || 'Unknown Term'}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                  Max Courses: {avail.max_courses === 0 ? 'Unavailable' : avail.max_courses}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No availability registered</p>
                      )}
                    </div>

                    {/* Course Approvals Section */}
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-3">Approved to teach:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courses.map(course => {
                          const isApproved = (instructor.approved_courses || []).includes(course.id);
                          return (
                            <div 
                              key={course.id} 
                              className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => handleToggleCourse(instructor, course.id)}
                            >
                              <div className={`w-5 h-5 rounded border-2 border-[#1e3a5f] flex items-center justify-center flex-shrink-0 ${isApproved ? 'bg-[#1e3a5f]' : 'bg-white'}`}>
                                {isApproved && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{course.title_en}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}