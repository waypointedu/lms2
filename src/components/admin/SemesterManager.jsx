import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit2, Trash2 } from "lucide-react";

export default function SemesterManager() {
  const queryClient = useQueryClient();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    season: 'Spring',
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    enrollment_open_date: '',
    enrollment_close_date: '',
    status: 'upcoming'
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: () => base44.entities.AcademicTerm.list('-start_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const termData = {
        ...data,
        name: `${data.season} ${data.year}`
      };
      return base44.entities.AcademicTerm.create(termData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicTerms'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const termData = {
        ...data,
        name: `${data.season} ${data.year}`
      };
      return base44.entities.AcademicTerm.update(id, termData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicTerms'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AcademicTerm.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicTerms'] });
    }
  });

  const resetForm = () => {
    setFormData({
      season: 'Spring',
      year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      enrollment_open_date: '',
      enrollment_close_date: '',
      status: 'upcoming'
    });
    setEditingTerm(null);
    setShowNewDialog(false);
  };

  const handleSubmit = () => {
    if (editingTerm) {
      updateMutation.mutate({ id: editingTerm.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      season: term.season || 'Spring',
      year: term.year || new Date().getFullYear(),
      start_date: term.start_date,
      end_date: term.end_date,
      enrollment_open_date: term.enrollment_open_date || '',
      enrollment_close_date: term.enrollment_close_date || '',
      status: term.status
    });
    setShowNewDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-900">Academic Terms</h2>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
              <Plus className="w-4 h-4 mr-2" />
              New Term
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTerm ? 'Edit Term' : 'Create New Term'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Season</Label>
                  <Select value={formData.season} onValueChange={(val) => setFormData({ ...formData, season: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                      <SelectItem value="Fall">Fall</SelectItem>
                      <SelectItem value="Winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    placeholder="2025"
                  />
                </div>
              </div>
              <div className="text-sm text-slate-500">
                Term name: <span className="font-medium">{formData.season} {formData.year}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Enrollment Opens</Label>
                  <Input
                    type="date"
                    value={formData.enrollment_open_date}
                    onChange={(e) => setFormData({ ...formData, enrollment_open_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Enrollment Closes</Label>
                  <Input
                    type="date"
                    value={formData.enrollment_close_date}
                    onChange={(e) => setFormData({ ...formData, enrollment_close_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
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
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button
                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingTerm ? 'Update' : 'Create'} Term
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {terms.map(term => (
          <Card key={term.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">{term.name}</h3>
                    <Badge className={
                      term.status === 'active' ? 'bg-green-100 text-green-800' :
                      term.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }>
                      {term.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>📅 {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}</p>
                    {term.enrollment_open_date && (
                      <p>Enrollment: {new Date(term.enrollment_open_date).toLocaleDateString()} - {new Date(term.enrollment_close_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(term)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(term.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}