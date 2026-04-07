import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Archive, Eye, CheckCircle, Trash2, Users, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CourseManager({ lang = 'en', user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [manageUsers, setManageUsers] = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['allCourses'],
    queryFn: () => base44.entities.Course.list('-created_date')
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['allEnrollments'],
    queryFn: () => base44.entities.Enrollment.list()
  });

  const { data: instructorAssignments = [] } = useQuery({
    queryKey: ['courseInstructors'],
    queryFn: () => base44.entities.CourseInstructor.list()
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Course.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
      setDeleteConfirm(null);
    }
  });

  const enrollUserMutation = useMutation({
    mutationFn: async ({ courseId, email, isInstructor }) => {
      if (isInstructor) {
        const userObj = allUsers.find(u => u.email === email);
        return base44.entities.CourseInstructor.create({
          course_id: courseId,
          instructor_email: email,
          instructor_name: userObj?.full_name || email
        });
      } else {
        return base44.entities.Enrollment.create({
          course_id: courseId,
          user_email: email,
          enrollment_date: new Date().toISOString(),
          status: 'active'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseInstructors'] });
      setSelectedUserEmail('');
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ recordId, isInstructor }) => {
      if (isInstructor) {
        return base44.entities.CourseInstructor.delete(recordId);
      } else {
        return base44.entities.Enrollment.delete(recordId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseInstructors'] });
    }
  });

  const filteredCourses = courses.filter(c => {
    const title = c.title_en + (c.title_es || '');
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const statusColors = {
    draft: "bg-slate-100 text-slate-700",
    published: "bg-emerald-100 text-emerald-700",
    archived: "bg-amber-100 text-amber-700"
  };

  const getCourseUsers = (courseId) => {
    const students = enrollments.filter(e => e.course_id === courseId);
    const instructors = instructorAssignments.filter(i => i.course_id === courseId);
    return { students, instructors };
  };

  const text = {
    en: {
      title: "Course Management",
      search: "Search courses...",
      newCourse: "New Course",
      status: "Status",
      actions: "Actions",
      publish: "Publish",
      unpublish: "Unpublish",
      archive: "Archive",
      edit: "Edit",
      view: "View",
      delete: "Delete",
      noCourses: "No courses found.",
      manageUsers: "Manage Users",
      enrollUser: "Enroll User/Instructor",
      selectUser: "Select User",
      enroll: "Enroll",
      instructors: "Instructors",
      students: "Students",
      remove: "Remove",
      noInstructors: "No instructors assigned",
      noStudents: "No students enrolled",
      deleteConfirm: "Delete Course?",
      deleteWarning: "This will permanently delete the course and all its content. Student progress will be lost.",
      confirmDelete: "Yes, Delete"
    },
    es: {
      title: "Gestión de Cursos",
      search: "Buscar cursos...",
      newCourse: "Nuevo Curso",
      status: "Estado",
      actions: "Acciones",
      publish: "Publicar",
      unpublish: "Despublicar",
      archive: "Archivar",
      edit: "Editar",
      view: "Ver",
      delete: "Eliminar",
      noCourses: "No se encontraron cursos.",
      manageUsers: "Gestionar Usuarios",
      enrollUser: "Inscribir Usuario/Instructor",
      selectUser: "Seleccionar Usuario",
      enroll: "Inscribir",
      instructors: "Instructores",
      students: "Estudiantes",
      remove: "Eliminar",
      noInstructors: "No hay instructores asignados",
      noStudents: "No hay estudiantes inscritos",
      deleteConfirm: "¿Eliminar Curso?",
      deleteWarning: "Esto eliminará permanentemente el curso y todo su contenido. Se perderá el progreso de los estudiantes.",
      confirmDelete: "Sí, Eliminar"
    }
  };

  const t = text[lang];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">{t.title}</h2>
        <Link to={createPageUrl(`CourseEditor?lang=${lang}`)}>
          <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
            <Plus className="w-4 h-4" />
            {t.newCourse}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Input
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>{lang === 'es' ? 'Título' : 'Title'}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{lang === 'es' ? 'Idiomas' : 'Languages'}</TableHead>
              <TableHead>{lang === 'es' ? 'Creado' : 'Created'}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e3a5f] mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  {t.noCourses}
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map(course => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    {course.title_en}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[course.status]}>
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {course.language_availability?.map(l => (
                        <Badge key={l} variant="outline" className="text-xs">
                          {l.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(course.created_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`CourseView?id=${course.id}&lang=${lang}`)} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {t.view}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`CourseEditor?id=${course.id}&lang=${lang}`)} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            {t.edit}
                          </Link>
                        </DropdownMenuItem>
                        {course.status !== 'published' && (
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: course.id, status: 'published' })}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t.publish}
                          </DropdownMenuItem>
                        )}
                        {course.status === 'published' && (
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: course.id, status: 'draft' })}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            {t.unpublish}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: course.id, status: 'archived' })}
                          className="flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          {t.archive}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setManageUsers(course)}
                          className="flex items-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          {t.manageUsers}
                        </DropdownMenuItem>
                        {(user?.role === 'admin' || user?.user_type === 'admin') && (
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(course)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t.delete}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Manage Users Dialog */}
      {manageUsers && (
        <Dialog open={!!manageUsers} onOpenChange={() => setManageUsers(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.manageUsers}: {manageUsers.title_en}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex gap-2">
                <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t.selectUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map(u => {
                      const isEnrolled = getCourseUsers(manageUsers.id).students.some(e => e.user_email === u.email);
                      const isInstructor = getCourseUsers(manageUsers.id).instructors.some(i => i.instructor_email === u.email);
                      if (isEnrolled || isInstructor) return null;
                      
                      const roleLabel = (u.user_type === 'instructor' || u.user_type === 'admin') ? ' [Instructor]' : ' [Student]';
                      return (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name} ({u.email}){roleLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    const userObj = allUsers.find(u => u.email === selectedUserEmail);
                    const isInstructor = userObj?.user_type === 'instructor' || userObj?.user_type === 'admin';
                    enrollUserMutation.mutate({ 
                      courseId: manageUsers.id, 
                      email: selectedUserEmail,
                      isInstructor 
                    });
                  }}
                  disabled={!selectedUserEmail}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t.enroll}
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t.instructors}</h4>
                {getCourseUsers(manageUsers.id).instructors.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.noInstructors}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang === 'es' ? 'Nombre' : 'Name'}</TableHead>
                        <TableHead>{lang === 'es' ? 'Email' : 'Email'}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCourseUsers(manageUsers.id).instructors.map(instructor => (
                        <TableRow key={instructor.id}>
                          <TableCell>{instructor.instructor_name}</TableCell>
                          <TableCell>{instructor.instructor_email}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeUserMutation.mutate({ recordId: instructor.id, isInstructor: true })}
                            >
                              {t.remove}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">{t.students}</h4>
                {getCourseUsers(manageUsers.id).students.length === 0 ? (
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
                      {getCourseUsers(manageUsers.id).students.map(enrollment => {
                        const student = allUsers.find(u => u.email === enrollment.user_email);
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell>{student?.full_name || enrollment.user_email}</TableCell>
                            <TableCell><Badge>{enrollment.status}</Badge></TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(enrollment.enrollment_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => removeUserMutation.mutate({ recordId: enrollment.id, isInstructor: false })}
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