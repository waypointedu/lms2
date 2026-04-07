import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

export default function AvailabilityManager({ user }) {
   const [selectedTermId, setSelectedTermId] = useState(null);
   const queryClient = useQueryClient();

   const { data: terms = [] } = useQuery({
     queryKey: ['academicTerms'],
     queryFn: () => base44.entities.AcademicTerm.list('-start_date')
   });

   useEffect(() => {
     if (terms.length > 0 && !selectedTermId) {
       setSelectedTermId(terms[0].id);
     }
   }, [terms]);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' })
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['instructorAvailability', user?.email],
    queryFn: () => base44.entities.InstructorAvailability.filter({ instructor_email: user?.email }),
    enabled: !!user?.email
  });

  const upsertAvailabilityMutation = useMutation({
    mutationFn: async (data) => {
      const existing = availability.find(a => a.term_id === data.term_id);
      if (existing) {
        return base44.entities.InstructorAvailability.update(existing.id, data);
      } else {
        return base44.entities.InstructorAvailability.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorAvailability'] });
    }
  });

  const handleToggle = (termId, field, value) => {
    const existing = availability.find(a => a.term_id === termId) || {
      instructor_email: user.email,
      term_id: termId,
      available: true,
      max_courses: 2,
      preferred_courses: []
    };

    upsertAvailabilityMutation.mutate({
      ...existing,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Teaching Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {terms.filter(t => t.status !== 'completed').map(term => {
              const termAvailability = availability.find(a => a.term_id === term.id);
              const isAvailable = termAvailability?.available ?? true;

              return (
                <div key={term.id} className="border rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{term.name}</h3>
                      <p className="text-sm text-slate-600">
                        {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(term.id, 'available', !isAvailable)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        isAvailable
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Not Available
                        </>
                      )}
                    </button>
                  </div>

                  {isAvailable && (
                    <div className="space-y-4 pl-4 border-l-2 border-green-200">
                      <div>
                        <Label>Max courses you can teach</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={termAvailability?.max_courses || 2}
                          onChange={(e) => handleToggle(term.id, 'max_courses', parseInt(e.target.value))}
                          className="w-32"
                        />
                      </div>

                      <div>
                        <Label>Preferred Courses</Label>
                        <div className="space-y-2 mt-2">
                          {courses.map(course => {
                            const isPreferred = termAvailability?.preferred_courses?.includes(course.id);
                            return (
                              <label key={course.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={isPreferred}
                                  onCheckedChange={(checked) => {
                                    const current = termAvailability?.preferred_courses || [];
                                    const updated = checked
                                      ? [...current, course.id]
                                      : current.filter(id => id !== course.id);
                                    handleToggle(term.id, 'preferred_courses', updated);
                                  }}
                                />
                                <span className="text-sm">{course.title_en}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label>Notes (optional)</Label>
                        <Textarea
                          value={termAvailability?.notes || ''}
                          onChange={(e) => handleToggle(term.id, 'notes', e.target.value)}
                          placeholder="Any scheduling preferences or constraints..."
                          className="h-20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}