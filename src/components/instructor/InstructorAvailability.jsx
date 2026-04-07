import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

export default function InstructorAvailability({ user }) {
  const queryClient = useQueryClient();
  const [selectedTerm, setSelectedTerm] = useState(null);

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list('-start_date')
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['courseInstances'],
    queryFn: () => base44.entities.CourseInstance.list()
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['instructorAvailability', user?.email],
    queryFn: () => base44.entities.InstructorAvailability.filter({ instructor_email: user?.email }),
    enabled: !!user?.email
  });

  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0].id);
    }
  }, [terms]);

  const volunteerMutation = useMutation({
    mutationFn: async ({ instanceId, available }) => {
      const existing = availability.find(a => a.course_instance_id === instanceId);
      if (existing) {
        return base44.entities.InstructorAvailability.update(existing.id, {
          instructor_email: user.email,
          course_instance_id: instanceId,
          volunteered: available
        });
      } else {
        return base44.entities.InstructorAvailability.create({
          instructor_email: user.email,
          course_instance_id: instanceId,
          volunteered: available,
          status: 'pending'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorAvailability'] });
    }
  });

  const currentTerm = terms.find(t => t.id === selectedTerm);
  const upcomingInstances = instances.filter(inst => {
    if (!currentTerm) return false;
    return inst.term_id === selectedTerm && inst.status !== 'completed';
  });

  const getInstanceStatus = (instanceId) => {
    const avail = availability.find(a => a.course_instance_id === instanceId);
    return avail;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Volunteer for Upcoming Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No terms available yet</p>
          ) : (
            <div className="space-y-6">
              {/* Term Selector */}
              <div className="flex gap-2 flex-wrap">
                {terms.filter(t => t.status !== 'completed').map(term => (
                  <Button
                    key={term.id}
                    variant={selectedTerm === term.id ? 'default' : 'outline'}
                    onClick={() => setSelectedTerm(term.id)}
                    className={selectedTerm === term.id ? 'bg-[#1e3a5f]' : ''}
                  >
                    {term.name}
                  </Button>
                ))}
              </div>

              {/* Instances for Selected Term */}
              {currentTerm && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">{currentTerm.name} Opportunities</h3>
                  {upcomingInstances.length === 0 ? (
                    <p className="text-slate-500 text-sm">No courses scheduled for this term yet</p>
                  ) : (
                    upcomingInstances.map(instance => {
                      const course = courses.find(c => c.id === instance.course_id);
                      const status = getInstanceStatus(instance.id);
                      const isVolunteered = status?.volunteered;

                      return (
                        <div key={instance.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {course?.title_en}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {instance.cohort_name} • {new Date(instance.start_date).toLocaleDateString()} to {new Date(instance.end_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={
                              isVolunteered ? 'bg-green-100 text-green-800' :
                              status?.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-800'
                            }>
                              {isVolunteered ? 'Volunteered' :
                               status?.status === 'approved' ? 'Approved' :
                               'Not volunteered'}
                            </Badge>
                          </div>

                          {instance.meeting_schedule && (
                            <p className="text-sm text-slate-600 mb-3">📅 {instance.meeting_schedule}</p>
                          )}

                          {status?.status === 'approved' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => volunteerMutation.mutate({ instanceId: instance.id, available: false })}
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Withdraw
                            </Button>
                          ) : isVolunteered ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => volunteerMutation.mutate({ instanceId: instance.id, available: false })}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Unvolunteer
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => volunteerMutation.mutate({ instanceId: instance.id, available: true })}
                              className="bg-[#1e3a5f]"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Volunteer
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}