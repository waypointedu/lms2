import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import CourseInstanceStudentList from './CourseInstanceStudentList';

export default function CourseInstanceEditor({ instanceId, courseId, termId, onClose }) {
  const queryClient = useQueryClient();
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);

  const { data: instance } = useQuery({
    queryKey: ['courseInstance', instanceId],
    queryFn: async () => {
      const instances = await base44.entities.CourseInstance.filter({ id: instanceId });
      return instances[0];
    },
    enabled: !!instanceId
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId
  });

  const { data: semesterAvailability = [] } = useQuery({
    queryKey: ['semesterAvailability', termId],
    queryFn: () => base44.entities.InstructorSemesterAvailability.filter({ term_id: termId }),
    enabled: !!termId
  });

  const addInstructorMutation = useMutation({
    mutationFn: async () => {
      const currentInstructors = instance.instructor_emails || [];
      return base44.entities.CourseInstance.update(instanceId, {
        instructor_emails: [...currentInstructors, selectedInstructor]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseInstance'] });
      setSelectedInstructor('');
      setShowVolunteerDialog(false);
    }
  });

  const removeInstructorMutation = useMutation({
    mutationFn: async (email) => {
      const currentInstructors = instance.instructor_emails || [];
      return base44.entities.CourseInstance.update(instanceId, {
        instructor_emails: currentInstructors.filter(e => e !== email)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseInstance'] });
    }
  });

  // Filter instructors: role=instructor OR has semester availability record, not already assigned
  const assignedEmails = instance?.instructor_emails || [];
  const availableInstructors = users.filter(u => {
    // Skip already assigned instructors
    if (assignedEmails.includes(u.email)) return false;
    // Must be instructor role or have a semester availability record for this term
    const hasAvailability = semesterAvailability.some(a => a.instructor_email === u.email && a.is_available);
    const isInstructor = u.role === 'instructor';
    return isInstructor || hasAvailability;
  });

  if (!instance || !course) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{course.title_en} - {instance.cohort_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Instructors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Assigned Instructors</h3>
              <Dialog open={showVolunteerDialog} onOpenChange={setShowVolunteerDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#1e3a5f]">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Instructor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Instructor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Available Instructors (Approved & Available)</Label>
                      <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select instructor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInstructors.map(instructor => (
                            <SelectItem key={instructor.id} value={instructor.email}>
                              {instructor.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableInstructors.length === 0 && (
                        <p className="text-sm text-amber-600 mt-2">No instructors available (must have instructor role or semester availability record)</p>
                      )}
                      {selectedInstructor && (
                        <Button 
                          className="w-full mt-3 bg-[#1e3a5f]"
                          onClick={() => addInstructorMutation.mutate()}
                          disabled={addInstructorMutation.isPending}
                        >
                          Add Selected
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {instance.instructor_emails?.length > 0 ? (
                instance.instructor_emails.map(email => (
                  <div key={email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium">{email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeInstructorMutation.mutate(email)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No instructors assigned</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CourseInstanceStudentList instanceId={instanceId} />
    </div>
  );
}