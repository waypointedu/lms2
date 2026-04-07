import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Award, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentManager() {
  const queryClient = useQueryClient();
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showAddPathwayDialog, setShowAddPathwayDialog] = useState(false);
  const [selectedCourseInstance, setSelectedCourseInstance] = useState('');
  const [selectedPathway, setSelectedPathway] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['allEnrollments'],
    queryFn: () => base44.entities.Enrollment.list()
  });

  const { data: pathwayEnrollments = [] } = useQuery({
    queryKey: ['allPathwayEnrollments'],
    queryFn: () => base44.entities.PathwayEnrollment.list()
  });

  const { data: courseInstances = [] } = useQuery({
    queryKey: ['courseInstances'],
    queryFn: () => base44.entities.CourseInstance.list()
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: pathways = [] } = useQuery({
    queryKey: ['pathways'],
    queryFn: () => base44.entities.Pathway.list()
  });

  const { data: acceptedApplications = [] } = useQuery({
    queryKey: ['acceptedApplications'],
    queryFn: () => base44.entities.Application.filter({ status: 'accepted' })
  });

  const acceptedEmails = new Set(acceptedApplications.map(a => a.email));

  const students = users.filter(u => {
    if (u.role === 'admin') return false;
    // Only show users who have an accepted application
    return acceptedEmails.has(u.email);
  });

  const getStudentEnrollments = (userEmail) => {
    return enrollments.filter(e => e.user_email === userEmail);
  };

  const getStudentPathwayEnrollments = (userEmail) => {
    return pathwayEnrollments.filter(pe => pe.user_email === userEmail);
  };

  const getCourseInstanceDetails = (instanceId) => {
    const instance = courseInstances.find(ci => ci.id === instanceId);
    if (!instance) return null;
    const course = courses.find(c => c.id === instance.course_id);
    return { instance, course };
  };

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId) => {
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      await base44.entities.Enrollment.delete(enrollmentId);
      
      // Decrement course instance enrollment count
      if (enrollment?.course_instance_id) {
        const instance = courseInstances.find(ci => ci.id === enrollment.course_instance_id);
        if (instance) {
          await base44.entities.CourseInstance.update(enrollment.course_instance_id, {
            current_enrollment: Math.max(0, (instance.current_enrollment || 1) - 1)
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
    }
  });

  const deletePathwayEnrollmentMutation = useMutation({
    mutationFn: (pathwayEnrollmentId) => base44.entities.PathwayEnrollment.delete(pathwayEnrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPathwayEnrollments'] });
    }
  });

  const updateEnrollmentStatusMutation = useMutation({
    mutationFn: ({ enrollmentId, status }) => base44.entities.Enrollment.update(enrollmentId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEnrollments'] });
    }
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data) => {
      const enrollment = await base44.entities.Enrollment.create(data);
      
      // Update course instance enrollment count
      if (data.course_instance_id) {
        const instance = courseInstances.find(ci => ci.id === data.course_instance_id);
        if (instance) {
          await base44.entities.CourseInstance.update(data.course_instance_id, {
            current_enrollment: (instance.current_enrollment || 0) + 1
          });
        }
      }
      
      return enrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
      setShowAddCourseDialog(false);
      setSelectedCourseInstance('');
    }
  });

  const createPathwayEnrollmentMutation = useMutation({
    mutationFn: (data) => base44.entities.PathwayEnrollment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPathwayEnrollments'] });
      setShowAddPathwayDialog(false);
      setSelectedPathway('');
    }
  });

  const handleAddCourseEnrollment = () => {
    if (!selectedCourseInstance || !selectedStudent) return;

    // Check for duplicate enrollment
    const existingEnrollment = enrollments.find(
      e => e.user_email === selectedStudent.email && e.course_instance_id === selectedCourseInstance
    );

    if (existingEnrollment) {
      alert('This student is already enrolled in this course instance.');
      return;
    }

    const instance = courseInstances.find(ci => ci.id === selectedCourseInstance);
    
    createEnrollmentMutation.mutate({
      user_email: selectedStudent.email,
      course_id: instance.course_id,
      course_instance_id: selectedCourseInstance,
      status: 'active',
      enrolled_date: new Date().toISOString()
    });
  };

  const handleAddPathwayEnrollment = () => {
    if (!selectedPathway || !selectedStudent) return;

    // Check for duplicate enrollment
    const existingEnrollment = pathwayEnrollments.find(
      pe => pe.user_email === selectedStudent.email && pe.pathway_id === selectedPathway
    );

    if (existingEnrollment) {
      alert('This student is already enrolled in this pathway.');
      return;
    }

    createPathwayEnrollmentMutation.mutate({
      pathway_id: selectedPathway,
      user_email: selectedStudent.email,
      status: 'active',
      enrolled_date: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#1e3a5f]" />
        <h2 className="text-2xl font-semibold text-slate-900">Student Management</h2>
      </div>

      <div className="grid gap-4">
        {students.map(student => {
          const studentEnrollments = getStudentEnrollments(student.email);
          const studentPathways = getStudentPathwayEnrollments(student.email);

          return (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedUser(expandedUser === student.id ? null : student.id)}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{student.full_name}</h3>
                    <p className="text-sm text-slate-600">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {studentEnrollments.length} {studentEnrollments.length === 1 ? 'course' : 'courses'}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {studentPathways.length} {studentPathways.length === 1 ? 'pathway' : 'pathways'}
                    </Badge>
                  </div>
                </div>

                {expandedUser === student.id && (
                  <div className="mt-4 pt-4 border-t space-y-6">
                    {/* Course Enrollments */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-600" />
                          <p className="text-sm font-medium text-slate-700">Course Enrollments</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowAddCourseDialog(true);
                          }}
                          className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Course
                        </Button>
                      </div>
                      {studentEnrollments.length > 0 ? (
                        <div className="space-y-2">
                          {studentEnrollments.map(enrollment => {
                            const details = getCourseInstanceDetails(enrollment.course_instance_id);
                            return (
                              <div key={enrollment.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-slate-900">
                                    {details?.course?.title_en || 'Unknown Course'}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {details?.instance?.cohort_name || 'Unknown Cohort'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <select
                                      value={enrollment.status}
                                      onChange={(e) => updateEnrollmentStatusMutation.mutate({
                                        enrollmentId: enrollment.id,
                                        status: e.target.value
                                      })}
                                      className="text-xs border border-slate-300 rounded px-2 py-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="active">Active</option>
                                      <option value="completed">Completed</option>
                                      <option value="dropped">Dropped</option>
                                    </select>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Remove this enrollment?')) {
                                      deleteEnrollmentMutation.mutate(enrollment.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No course enrollments</p>
                      )}
                    </div>

                    {/* Pathway Enrollments */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-slate-600" />
                          <p className="text-sm font-medium text-slate-700">Certificate/Pathway Enrollments</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowAddPathwayDialog(true);
                          }}
                          className="bg-[#c4933f] hover:bg-[#b38636]"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Pathway
                        </Button>
                      </div>
                      {studentPathways.length > 0 ? (
                        <div className="space-y-2">
                          {studentPathways.map(pathwayEnrollment => {
                            const pathway = pathways.find(p => p.id === pathwayEnrollment.pathway_id);
                            return (
                              <div key={pathwayEnrollment.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-slate-900">
                                    {pathway?.title_en || 'Unknown Pathway'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${pathwayEnrollment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {pathwayEnrollment.status}
                                    </Badge>
                                    {pathwayEnrollment.certificate_issued && (
                                      <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                        Certificate Issued
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Remove this pathway enrollment?')) {
                                      deletePathwayEnrollmentMutation.mutate(pathwayEnrollment.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No pathway enrollments</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Course Dialog */}
      <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course Enrollment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Student: {selectedStudent?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Select Course Instance
              </label>
              <Select value={selectedCourseInstance} onValueChange={setSelectedCourseInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course instance" />
                </SelectTrigger>
                <SelectContent>
                  {courseInstances.map(instance => {
                    const course = courses.find(c => c.id === instance.course_id);
                    return (
                      <SelectItem key={instance.id} value={instance.id}>
                        {course?.title_en} - {instance.cohort_name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddCourseEnrollment}
              disabled={!selectedCourseInstance || createEnrollmentMutation.isPending}
              className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]"
            >
              {createEnrollmentMutation.isPending ? 'Adding...' : 'Add Enrollment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pathway Dialog */}
      <Dialog open={showAddPathwayDialog} onOpenChange={setShowAddPathwayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pathway Enrollment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Student: {selectedStudent?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Select Pathway/Certificate
              </label>
              <Select value={selectedPathway} onValueChange={setSelectedPathway}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pathway" />
                </SelectTrigger>
                <SelectContent>
                  {pathways.map(pathway => (
                    <SelectItem key={pathway.id} value={pathway.id}>
                      {pathway.title_en} ({pathway.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddPathwayEnrollment}
              disabled={!selectedPathway || createPathwayEnrollmentMutation.isPending}
              className="w-full bg-[#c4933f] hover:bg-[#b38636]"
            >
              {createPathwayEnrollmentMutation.isPending ? 'Adding...' : 'Add Enrollment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}