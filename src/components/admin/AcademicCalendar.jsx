import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from 'date-fns';

export default function AcademicCalendar({ lang = 'en' }) {
  const [showTermDialog, setShowTermDialog] = useState(false);
  const [showInstanceDialog, setShowInstanceDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [editingInstance, setEditingInstance] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  const queryClient = useQueryClient();

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list('-start_date')
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' })
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['courseInstances', selectedTerm],
    queryFn: () => selectedTerm 
      ? base44.entities.CourseInstance.filter({ term_id: selectedTerm })
      : base44.entities.CourseInstance.list('-start_date'),
    enabled: true
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => base44.entities.User.list()
  });

  const createTermMutation = useMutation({
    mutationFn: (data) => base44.entities.AcademicTerm.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicTerms'] });
      setShowTermDialog(false);
      setEditingTerm(null);
    }
  });

  const updateTermMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AcademicTerm.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicTerms'] });
      setShowTermDialog(false);
      setEditingTerm(null);
    }
  });

  const createInstanceMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseInstance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
      setShowInstanceDialog(false);
      setEditingInstance(null);
    }
  });

  const updateInstanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseInstance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
      setShowInstanceDialog(false);
      setEditingInstance(null);
    }
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseInstance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseInstances'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Terms Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Academic Terms
            </CardTitle>
            <Dialog open={showTermDialog} onOpenChange={setShowTermDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingTerm(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Term
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTerm ? 'Edit Term' : 'Create New Term'}</DialogTitle>
                </DialogHeader>
                <TermForm
                  term={editingTerm}
                  onSubmit={(data) => {
                    if (editingTerm) {
                      updateTermMutation.mutate({ id: editingTerm.id, data });
                    } else {
                      createTermMutation.mutate(data);
                    }
                  }}
                  onCancel={() => setShowTermDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {terms.map(term => (
              <div key={term.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{term.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    term.status === 'active' ? 'bg-green-100 text-green-700' :
                    term.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {term.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  {format(new Date(term.start_date), 'MMM d, yyyy')} - {format(new Date(term.end_date), 'MMM d, yyyy')}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedTerm(term.id)}
                >
                  View Courses ({instances.filter(i => i.term_id === term.id).length})
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Instances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Course Schedule {selectedTerm && `- ${terms.find(t => t.id === selectedTerm)?.name || ''}`}
            </CardTitle>
            <div className="flex gap-2">
              {selectedTerm && (
                <Button size="sm" variant="outline" onClick={() => setSelectedTerm(null)}>
                  View All
                </Button>
              )}
              <Dialog open={showInstanceDialog} onOpenChange={setShowInstanceDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingInstance(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingInstance ? 'Edit Course Instance' : 'Schedule New Course'}</DialogTitle>
                  </DialogHeader>
                  <CourseInstanceForm
                    instance={editingInstance}
                    courses={courses}
                    terms={terms}
                    instructors={instructors}
                    onSubmit={(data) => {
                      if (editingInstance) {
                        updateInstanceMutation.mutate({ id: editingInstance.id, data });
                      } else {
                        createInstanceMutation.mutate(data);
                      }
                    }}
                    onCancel={() => setShowInstanceDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instances.map(instance => {
              const course = courses.find(c => c.id === instance.course_id);
              const term = terms.find(t => t.id === instance.term_id);
              
              return (
                <div key={instance.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {course?.[`title_${lang}`] || course?.title_en} - {instance.cohort_name}
                      </h3>
                      <p className="text-sm text-slate-600">{term?.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingInstance(instance);
                          setShowInstanceDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInstanceMutation.mutate(instance.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Dates</p>
                      <p className="font-medium">
                        {format(new Date(instance.start_date), 'MMM d')} - {format(new Date(instance.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Instructors</p>
                      <p className="font-medium">
                        {instance.instructor_emails?.length > 0 
                          ? `${instance.instructor_emails.length} assigned` 
                          : 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Enrollment</p>
                      <p className="font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {instance.current_enrollment || 0} / {instance.max_students || '∞'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Schedule</p>
                      <p className="font-medium">{instance.meeting_schedule || 'Self-paced'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TermForm({ term, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(term || {
    name: '',
    start_date: '',
    end_date: '',
    enrollment_open_date: '',
    enrollment_close_date: '',
    status: 'upcoming'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Term Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="e.g., Spring 2025"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            required
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Enrollment Opens</Label>
          <Input
            type="date"
            value={formData.enrollment_open_date}
            onChange={(e) => setFormData({...formData, enrollment_open_date: e.target.value})}
          />
        </div>
        <div>
          <Label>Enrollment Closes</Label>
          <Input
            type="date"
            value={formData.enrollment_close_date}
            onChange={(e) => setFormData({...formData, enrollment_close_date: e.target.value})}
          />
        </div>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Term</Button>
      </div>
    </form>
  );
}

function CourseInstanceForm({ instance, courses, terms, instructors, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(instance || {
    course_id: '',
    term_id: '',
    cohort_name: '',
    instructor_emails: [],
    start_date: '',
    end_date: '',
    max_students: null,
    meeting_schedule: '',
    status: 'scheduled'
  });

  const { data: semesterAvailability = [] } = useQuery({
    queryKey: ['semesterAvailability', formData.term_id],
    queryFn: () => formData.term_id ? base44.entities.InstructorSemesterAvailability.filter({ term_id: formData.term_id }) : [],
    enabled: !!formData.term_id
  });

  const { data: allInstances = [] } = useQuery({
    queryKey: ['courseInstances', formData.term_id],
    queryFn: () => formData.term_id ? base44.entities.CourseInstance.filter({ term_id: formData.term_id }) : [],
    enabled: !!formData.term_id
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleInstructor = (email) => {
    const current = formData.instructor_emails || [];
    if (current.includes(email)) {
      setFormData({...formData, instructor_emails: current.filter(e => e !== email)});
    } else {
      setFormData({...formData, instructor_emails: [...current, email]});
    }
  };

  // Count current assignments per instructor for this term
  const getInstructorLoadAndMax = (email) => {
    const availability = semesterAvailability.find(a => a.instructor_email === email);
    const currentLoad = allInstances.filter(inst => (inst.instructor_emails || []).includes(email) && inst.id !== instance?.id).length;
    const maxCourses = availability?.max_courses || 3;
    return { currentLoad, maxCourses };
  };

  // Filter instructors: must have a semester availability record for this term (is_available defaults to true if not explicitly false)
  const availableInstructors = (!formData.course_id || !formData.term_id) ? [] : instructors.filter(u => {
    const availability = semesterAvailability.find(a => a.instructor_email === u.email);
    if (!availability) return false;
    if (availability.is_available === false) return false;

    // Always show already-assigned instructors so they can be deselected
    const alreadyAssigned = (formData.instructor_emails || []).includes(u.email);
    if (alreadyAssigned) return true;

    const { currentLoad, maxCourses } = getInstructorLoadAndMax(u.email);
    return currentLoad < maxCourses;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Course</Label>
          <Select value={formData.course_id} onValueChange={(value) => setFormData({...formData, course_id: value})} required>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Term</Label>
          <Select value={formData.term_id} onValueChange={(value) => setFormData({...formData, term_id: value})} required>
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Cohort Name</Label>
        <Input
          value={formData.cohort_name}
          onChange={(e) => setFormData({...formData, cohort_name: e.target.value})}
          placeholder="e.g., Cohort A, Evening Section"
          required
        />
      </div>

      <div>
        <Label>Instructors</Label>
        {!formData.course_id || !formData.term_id ? (
          <p className="text-sm text-slate-500 p-3 border rounded-lg bg-slate-50">
            Select a course and term first to see available instructors
          </p>
        ) : availableInstructors.length === 0 ? (
          <p className="text-sm text-amber-600 p-3 border rounded-lg bg-amber-50">
            No instructors available for this term. Instructors must have submitted their semester availability for the selected term.
          </p>
        ) : (
          <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {availableInstructors.map(instructor => {
              const { currentLoad, maxCourses } = getInstructorLoadAndMax(instructor.email);
              const isSelected = formData.instructor_emails?.includes(instructor.email);
              const displayCount = isSelected ? currentLoad + 1 : currentLoad;
              return (
                <label key={instructor.email} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleInstructor(instructor.email)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{instructor.full_name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {displayCount}/{maxCourses} courses this semester
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            required
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Max Students (optional)</Label>
          <Input
            type="number"
            value={formData.max_students || ''}
            onChange={(e) => setFormData({...formData, max_students: e.target.value ? parseInt(e.target.value) : null})}
            placeholder="Leave blank for unlimited"
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Meeting Schedule (optional)</Label>
        <Input
          value={formData.meeting_schedule || ''}
          onChange={(e) => setFormData({...formData, meeting_schedule: e.target.value})}
          placeholder="e.g., Tuesdays 7pm GMT, or leave blank for self-paced"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Course Instance</Button>
      </div>
    </form>
  );
}