import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FileUploader from '@/components/upload/FileUploader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Save, Edit2, BookOpen } from "lucide-react";

export default function ModuleLessonEditor({ courseId, modules, lessons, lang }) {
  const queryClient = useQueryClient();
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [newModule, setNewModule] = useState(null);
  const [newLesson, setNewLesson] = useState(null);

  const moduleCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Module.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setNewModule(null);
    }
  });

  const moduleUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Module.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setEditingModule(null);
    }
  });

  const moduleDeleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Module.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] })
  });

  const lessonCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Lesson.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setNewLesson(null);
    }
  });

  const lessonUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lesson.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setEditingLesson(null);
    }
  });

  const lessonDeleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lesson.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] })
  });

  const sortedModules = [...(modules || [])].sort((a, b) => a.order_index - b.order_index);

  const text = {
    en: {
      addModule: "Add Module",
      saveModule: "Save Module",
      editModule: "Edit Module",
      deleteModule: "Delete Module",
      moduleName: "Module Name",
      moduleDesc: "Description",
      order: "Order",
      estimatedHours: "Estimated Hours",
      addLesson: "Add Lesson",
      saveLesson: "Save Lesson",
      editLesson: "Edit Lesson",
      deleteLesson: "Delete Lesson",
      lessonTitle: "Lesson Title",
      lessonContent: "Content (Markdown)",
      estimatedMin: "Estimated Minutes",
      videoUrl: "Video URL (optional)",
      cancel: "Cancel",
      lessons: "Lessons",
      noModules: "No modules yet"
    },
    es: {
      addModule: "Añadir Módulo",
      saveModule: "Guardar Módulo",
      editModule: "Editar Módulo",
      deleteModule: "Eliminar Módulo",
      moduleName: "Nombre del Módulo",
      moduleDesc: "Descripción",
      order: "Orden",
      estimatedHours: "Horas Estimadas",
      addLesson: "Añadir Lección",
      saveLesson: "Guardar Lección",
      editLesson: "Editar Lección",
      deleteLesson: "Eliminar Lección",
      lessonTitle: "Título de la Lección",
      lessonContent: "Contenido (Markdown)",
      estimatedMin: "Minutos Estimados",
      videoUrl: "URL de Video (opcional)",
      cancel: "Cancelar",
      lessons: "Lecciones",
      noModules: "Sin módulos aún"
    }
  };

  const t = text[lang];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-900">
          {lang === 'es' ? 'Módulos y Lecciones' : 'Modules & Lessons'}
        </h3>
        <Button onClick={() => setNewModule({ course_id: courseId, title_en: '', order_index: sortedModules.length })} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t.addModule}
        </Button>
      </div>

      {newModule && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>{lang === 'es' ? 'Nuevo Módulo' : 'New Module'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.moduleName} (EN)</Label>
                <Input value={newModule.title_en} onChange={(e) => setNewModule({...newModule, title_en: e.target.value})} />
              </div>
              <div>
                <Label>{t.moduleName} (ES)</Label>
                <Input value={newModule.title_es || ''} onChange={(e) => setNewModule({...newModule, title_es: e.target.value})} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.moduleDesc} (EN)</Label>
                <Textarea value={newModule.description_en || ''} onChange={(e) => setNewModule({...newModule, description_en: e.target.value})} />
              </div>
              <div>
                <Label>{t.moduleDesc} (ES)</Label>
                <Textarea value={newModule.description_es || ''} onChange={(e) => setNewModule({...newModule, description_es: e.target.value})} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.order}</Label>
                <Input type="number" value={newModule.order_index} onChange={(e) => setNewModule({...newModule, order_index: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>{t.estimatedHours}</Label>
                <Input type="number" value={newModule.estimated_hours || 0} onChange={(e) => setNewModule({...newModule, estimated_hours: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => moduleCreateMutation.mutate(newModule)} disabled={!newModule.title_en}>
                <Save className="w-4 h-4 mr-2" />
                {t.saveModule}
              </Button>
              <Button variant="outline" onClick={() => setNewModule(null)}>{t.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedModules.length === 0 && !newModule && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            {t.noModules}
          </CardContent>
        </Card>
      )}

      <Accordion type="single" collapsible className="space-y-4">
        {sortedModules.map((module) => {
          const moduleLessons = (lessons || []).filter(l => l.module_id === module.id).sort((a, b) => a.order_index - b.order_index);
          
          return (
            <AccordionItem key={module.id} value={module.id} className="border rounded-lg bg-white">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3 text-left flex-1">
                  <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
                  <div>
                    <div className="font-semibold">{module.title_en}</div>
                    <div className="text-sm text-slate-500">{moduleLessons.length} {t.lessons}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {editingModule === module.id ? (
                  <Card className="mb-4 bg-slate-50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>{t.moduleName} (EN)</Label>
                          <Input value={module.title_en} onChange={(e) => moduleUpdateMutation.mutate({ id: module.id, data: {...module, title_en: e.target.value} })} />
                        </div>
                        <div>
                          <Label>{t.moduleName} (ES)</Label>
                          <Input value={module.title_es || ''} onChange={(e) => moduleUpdateMutation.mutate({ id: module.id, data: {...module, title_es: e.target.value} })} />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setEditingModule(null)}>{lang === 'es' ? 'Cerrar' : 'Close'}</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => setEditingModule(module.id)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t.editModule}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setNewLesson({ module_id: module.id, title_en: '', order_index: moduleLessons.length, content_en: '' })}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addLesson}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => moduleDeleteMutation.mutate(module.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.deleteModule}
                    </Button>
                  </div>
                )}

                {newLesson && newLesson.module_id === module.id && (
                  <Card className="mb-4 bg-green-50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>{t.lessonTitle} (EN)</Label>
                          <Input value={newLesson.title_en} onChange={(e) => setNewLesson({...newLesson, title_en: e.target.value})} />
                        </div>
                        <div>
                          <Label>{t.lessonTitle} (ES)</Label>
                          <Input value={newLesson.title_es || ''} onChange={(e) => setNewLesson({...newLesson, title_es: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <Label>{t.lessonContent} (EN)</Label>
                        <Textarea rows={8} value={newLesson.content_en} onChange={(e) => setNewLesson({...newLesson, content_en: e.target.value})} placeholder="# Lesson Title\n\nYour markdown content..." />
                      </div>
                      <div>
                        <Label>{t.lessonContent} (ES)</Label>
                        <Textarea rows={8} value={newLesson.content_es || ''} onChange={(e) => setNewLesson({...newLesson, content_es: e.target.value})} placeholder="# Título de la Lección\n\nTu contenido markdown..." />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FileUploader
                          label="Upload Video"
                          accept="video/*"
                          onUploadComplete={(url) => setNewLesson({ ...newLesson, video_url: url })}
                          lang={lang}
                        />
                        <FileUploader
                          label="Upload Audio/Document"
                          accept="audio/*,.pdf,.doc,.docx,image/*"
                          onUploadComplete={(url) => {
                            const attachments = newLesson.attachments || [];
                            attachments.push({ title: 'Attachment', url });
                            setNewLesson({ ...newLesson, attachments });
                          }}
                          lang={lang}
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>{t.order}</Label>
                          <Input type="number" value={newLesson.order_index} onChange={(e) => setNewLesson({...newLesson, order_index: parseInt(e.target.value)})} />
                        </div>
                        <div>
                          <Label>{t.estimatedMin}</Label>
                          <Input type="number" value={newLesson.estimated_minutes || 0} onChange={(e) => setNewLesson({...newLesson, estimated_minutes: parseInt(e.target.value)})} />
                        </div>
                        <div>
                          <Label>{t.videoUrl}</Label>
                          <Input value={newLesson.video_url || ''} onChange={(e) => setNewLesson({...newLesson, video_url: e.target.value})} placeholder="https://youtube.com/..." />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => lessonCreateMutation.mutate(newLesson)} disabled={!newLesson.title_en}>
                          <Save className="w-4 h-4 mr-2" />
                          {t.saveLesson}
                        </Button>
                        <Button variant="outline" onClick={() => setNewLesson(null)}>{t.cancel}</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {moduleLessons.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg p-4 bg-slate-50">
                      {editingLesson === lesson.id ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>{t.lessonTitle} (EN)</Label>
                              <Input value={lesson.title_en} onChange={(e) => lessonUpdateMutation.mutate({ id: lesson.id, data: {...lesson, title_en: e.target.value} })} />
                            </div>
                            <div>
                              <Label>{t.lessonTitle} (ES)</Label>
                              <Input value={lesson.title_es || ''} onChange={(e) => lessonUpdateMutation.mutate({ id: lesson.id, data: {...lesson, title_es: e.target.value} })} />
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setEditingLesson(null)}>{lang === 'es' ? 'Cerrar' : 'Close'}</Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{lesson.order_index}. {lesson.title_en}</div>
                            <div className="text-sm text-slate-500">{lesson.estimated_minutes || 0} min</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingLesson(lesson.id)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => lessonDeleteMutation.mutate(lesson.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}