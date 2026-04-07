import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2 } from "lucide-react";

export default function SemesterAvailability({ user }) {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState({});
  const [editValues, setEditValues] = useState({});

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list('-start_date')
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['semesterAvailability', user?.email],
    queryFn: () => base44.entities.InstructorSemesterAvailability.filter({ 
      instructor_email: user?.email 
    }),
    enabled: !!user?.email
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: (data) => base44.entities.InstructorSemesterAvailability.create(data),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ['semesterAvailability'] });
      setSubmitted(prev => ({ ...prev, [newRecord.term_id]: true }));
    }
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InstructorSemesterAvailability.update(id, data),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: ['semesterAvailability'] });
      setSubmitted(prev => ({ ...prev, [updatedRecord.term_id]: true }));
      setEditValues(prev => {
        const newState = { ...prev };
        delete newState[updatedRecord.id];
        return newState;
      });
    }
  });

  const handleMarkAvailable = (termId, maxCourses) => {
    const record = getAvailabilityForTerm(termId);
    if (record) {
      updateAvailabilityMutation.mutate({
        id: record.id,
        data: { max_courses: maxCourses }
      });
    } else {
      createAvailabilityMutation.mutate({
        instructor_email: user.email,
        term_id: termId,
        max_courses: maxCourses
      });
    }
  };

  const handleAddAvailability = (termId) => {
    createAvailabilityMutation.mutate({
      instructor_email: user.email,
      term_id: termId,
      max_courses: 1,
      is_available: true
    });
  };

  const handleMaxCoursesChange = (recordId, termId, value) => {
    setEditValues(prev => ({ ...prev, [recordId]: value }));
    setSubmitted(prev => ({ ...prev, [termId]: false }));
  };

  const getAvailabilityForTerm = (termId) => {
    return availability.find(a => a.term_id === termId);
  };

  const upcomingTerms = terms.filter(t => t.status === 'upcoming' || t.status === 'active');
  const registeredTerms = upcomingTerms.filter(t => getAvailabilityForTerm(t.id));
  const availableTerms = upcomingTerms.filter(t => !getAvailabilityForTerm(t.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Semester Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registered Terms */}
          {registeredTerms.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Registered For</h3>
              <div className="space-y-2">
                {registeredTerms.map(term => {
                        const record = getAvailabilityForTerm(term.id);
                        const isSubmitted = submitted[term.id];
                        const currentValue = editValues[record?.id] !== undefined ? editValues[record?.id] : record?.max_courses;

                        return (
                          <div key={term.id} className={`border rounded-lg p-4 transition-all ${isSubmitted ? 'bg-slate-50' : ''}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{term.name}</h4>
                                <p className="text-sm text-slate-600">
                                  {new Date(term.start_date).toLocaleDateString()} – {new Date(term.end_date).toLocaleDateString()}
                                </p>
                              </div>
                              {isSubmitted && (
                                <Badge className="bg-green-100 text-green-800">Availability submitted</Badge>
                              )}
                            </div>

                            <div className={`space-y-3 ${isSubmitted ? 'opacity-50 pointer-events-none' : ''}`}>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Max Courses
                                </label>
                                <select
                                  value={currentValue || 0}
                                  onChange={(e) => handleMaxCoursesChange(record.id, term.id, parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                >
                                  {[0, 1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num === 0 ? 'Unavailable' : num}</option>
                                  ))}
                                </select>
                              </div>

                              {!isSubmitted && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkAvailable(term.id, currentValue)}
                                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a] w-full"
                                >
                                  Mark Available
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
              </div>
            </div>
          )}

          {/* Available Terms */}
          {availableTerms.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Available Semesters</h3>
              <div className="space-y-2">
                {availableTerms.map(term => (
                  <div key={term.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{term.name}</h4>
                        <p className="text-sm text-slate-600">
                          {new Date(term.start_date).toLocaleDateString()} – {new Date(term.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddAvailability(term.id)}
                        className="bg-[#1e3a5f]"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Register
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingTerms.length === 0 && (
            <p className="text-slate-500 text-center py-8">No upcoming semesters available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}