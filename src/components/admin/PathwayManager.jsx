import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Award, Trash2, GripVertical, Users, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function PathwayManager({ lang, user }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title_en: '', title_es: '', description_en: '', description_es: '',
    type: 'certificate', is_linear: false, course_ids: [], estimated_months: 0, total_credits: 0,
    status: 'draft', certificate_template: ''
  });
  const [manageStudents, setManageStudents] = useState(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: pathways = [] } = useQuery({
    queryKey: ['pathways'],
    queryFn: () => base44.entities.Pathway.list()
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: pathwayEnrollments = [] } = useQuery({
    queryKey: ['pathwayEnrollments'],
    queryFn: () => base44.entities.PathwayEnrollment.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editing && editing !== 'new') {
        return base44.entities.Pathway.update(editing, data);
      } else {
        return base44.entities.Pathway.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      setEditing(null);
      setForm({ title_en: '', title_es: '', description_en: '', description_es: '', type: 'certificate', is_linear: false, course_ids: [], estimated_months: 0, total_credits: 0, status: 'draft', certificate_template: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pathway.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      setDeleteConfirm(null);
    }
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async ({ pathwayId, email }) => {
      const student = allUsers.find(u => u.email === email);
      return base44.entities.PathwayEnrollment.create({
        pathway_id: pathwayId,
        user_email: email,
        status: 'active',
        enrolled_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathwayEnrollments'] });
      setStudentEmail('');
    }
  });

  const removeStudentMutation = useMutation({
    mutationFn: (enrollmentId) => base44.entities.PathwayEnrollment.delete(enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pathwayEnrollments'] })
  });

  const handleEdit = (pathway) => {
    setEditing(pathway.id);
    setForm(pathway);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newIds = Array.from(form.course_ids);
    const [moved] = newIds.splice(result.source.index, 1);
    newIds.splice(result.destination.index, 0, moved);
    setForm({ ...form, course_ids: newIds });
  };

  const addCourse = (courseId) => {
    if (!form.course_ids.includes(courseId)) {
      setForm({ ...form, course_ids: [...form.course_ids, courseId] });
    }
  };

  const removeCourse = (courseId) => {
    setForm({ ...form, course_ids: form.course_ids.filter(id => id !== courseId) });
  };

  const getEnrolledStudents = (pathwayId) => {
    return pathwayEnrollments.filter(e => e.pathway_id === pathwayId);
  };

  const text = {
    en: { 
      title: 'Pathway Manager', new: 'New Pathway', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', 
      courses: 'Courses in Pathway', addCourse: 'Add Course', type: 'Type', status: 'Status', 
      estimated: 'Est. Months', credits: 'Total Credits', certificate: 'Certificate Template',
      manageStudents: 'Manage Students', enrollStudent: 'Enroll Student', studentEmail: 'Student Email',
      enroll: 'Enroll', enrolled: 'Enrolled Students', remove: 'Remove', noStudents: 'No students enrolled',
      deleteConfirm: 'Delete Pathway?', deleteWarning: 'This action cannot be undone. All student enrollments will be lost.',
      confirmDelete: 'Yes, Delete'
    },
    es: { 
      title: 'Gestor de Rutas', new: 'Nueva Ruta', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar',
      courses: 'Cursos en la Ruta', addCourse: 'Añadir Curso', type: 'Tipo', status: 'Estado',
      estimated: 'Meses Est.', credits: 'Créditos Totales', certificate: 'Plantilla de Certificado',
      manageStudents: 'Gestionar Estudiantes', enrollStudent: 'Inscribir Estudiante', studentEmail: 'Email del Estudiante',
      enroll: 'Inscribir', enrolled: 'Estudiantes Inscritos', remove: 'Eliminar', noStudents: 'No hay estudiantes inscritos',
      deleteConfirm: '¿Eliminar Ruta?', deleteWarning: 'Esta acción no se puede deshacer. Todas las inscripciones se perderán.',
      confirmDelete: 'Sí, Eliminar'
    }
  };
  const t = text[lang];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        <Button onClick={() => setEditing('new')} className="bg-[#1e3a5f]">
          <Plus className="w-4 h-4 mr-2" />
          {t.new}
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing === 'new' ? t.new : t.edit}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Title (EN)" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
              <Input placeholder="Title (ES)" value={form.title_es} onChange={(e) => setForm({ ...form, title_es: e.target.value })} />
              <Textarea placeholder="Description (EN)" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
              <Textarea placeholder="Description (ES)" value={form.description_es} onChange={(e) => setForm({ ...form, description_es: e.target.value })} />
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">{t.type}</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="post_certificate">Post-Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Linear</label>
                <Select value={form.is_linear ? 'yes' : 'no'} onValueChange={(v) => setForm({ ...form, is_linear: v === 'yes' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No (Modular)</SelectItem>
                    <SelectItem value="yes">Yes (Locked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t.status}</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" placeholder={t.estimated} value={form.estimated_months} onChange={(e) => setForm({ ...form, estimated_months: Number(e.target.value) })} />
              <Input type="number" placeholder={t.credits} value={form.total_credits} onChange={(e) => setForm({ ...form, total_credits: Number(e.target.value) })} />
            </div>

            <div>
              <label className="text-sm font-medium">{t.courses}</label>
              <Select onValueChange={addCourse}>
                <SelectTrigger><SelectValue placeholder={t.addCourse} /></SelectTrigger>
                <SelectContent>
                  {courses.filter(c => !form.course_ids.includes(c.id)).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="courses">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="mt-3 space-y-2">
                      {form.course_ids.map((id, i) => {
                        const course = courses.find(c => c.id === id);
                        return (
                          <Draggable key={id} draggableId={id} index={i}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div {...provided.dragHandleProps}><GripVertical className="w-5 h-5 text-slate-400" /></div>
                                <span className="flex-1">{i + 1}. {course?.title_en || id}</span>
                                <Button size="sm" variant="ghost" onClick={() => removeCourse(id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <Textarea placeholder={t.certificate} value={form.certificate_template} onChange={(e) => setForm({ ...form, certificate_template: e.target.value })} rows={3} />

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>{t.cancel}</Button>
              <Button onClick={() => saveMutation.mutate(form)} className="bg-[#1e3a5f]">{t.save}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {pathways.map(pathway => (
          <Card key={pathway.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-[#1e3a5f]" />
                    <h3 className="text-lg font-semibold">{pathway[`title_${lang}`] || pathway.title_en}</h3>
                    <Badge>{pathway.type}</Badge>
                    <Badge variant={pathway.status === 'published' ? 'default' : 'secondary'}>{pathway.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{pathway[`description_${lang}`] || pathway.description_en}</p>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>{pathway.course_ids?.length || 0} courses</span>
                    {pathway.estimated_months > 0 && <span>{pathway.estimated_months} months</span>}
                    {pathway.total_credits > 0 && <span>{pathway.total_credits} credits</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setManageStudents(pathway)}>
                    <Users className="w-4 h-4 mr-1" />
                    {t.manageStudents}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(pathway)}><Edit2 className="w-4 h-4" /></Button>
                  {(user?.role === 'admin' || user?.user_type === 'admin') && (
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(pathway)}><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manage Students Dialog */}
      {manageStudents && (
        <Dialog open={!!manageStudents} onOpenChange={() => setManageStudents(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.manageStudents}: {manageStudents[`title_${lang}`] || manageStudents.title_en}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={studentEmail} onValueChange={setStudentEmail}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t.studentEmail} />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter(u => (u.user_type === 'student' || (!u.user_type && u.role === 'user')))
                      .filter(u => !getEnrolledStudents(manageStudents.id).some(e => e.user_email === u.email))
                      .map(u => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name} ({u.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => enrollStudentMutation.mutate({ pathwayId: manageStudents.id, email: studentEmail })}
                  disabled={!studentEmail}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t.enroll}
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t.enrolled}</h4>
                {getEnrolledStudents(manageStudents.id).length === 0 ? (
                  <p className="text-sm text-slate-500">{t.noStudents}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang === 'es' ? 'Estudiante' : 'Student'}</TableHead>
                        <TableHead>{lang === 'es' ? 'Estado' : 'Status'}</TableHead>
                        <TableHead>{lang === 'es' ? 'Inscrito' : 'Enrolled'}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getEnrolledStudents(manageStudents.id).map(enrollment => {
                        const student = allUsers.find(u => u.email === enrollment.user_email);
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell>{student?.full_name || enrollment.user_email}</TableCell>
                            <TableCell><Badge>{enrollment.status}</Badge></TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(enrollment.enrolled_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => removeStudentMutation.mutate(enrollment.id)}
                              >
                                {t.remove}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.deleteConfirm}</DialogTitle>
              <DialogDescription>{t.deleteWarning}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t.cancel}</Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              >
                {t.confirmDelete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}