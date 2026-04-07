import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Edit2, Trash2, ChevronDown, ChevronUp, Calendar, FileText } from 'lucide-react';
import FileUploader from '@/components/upload/FileUploader';
import WeekQuizEditor from '@/components/admin/WeekQuizEditor';
import RichTextEditor from '@/components/editor/RichTextEditor';
import WrittenAssignmentGrading from '@/components/assignments/WrittenAssignmentGrading';
import BlockEditor from '@/components/editor/BlockEditor';

export default function WeekEditor({ courseId, lang }) {
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [editingWeek, setEditingWeek] = useState(null);
  const queryClient = useQueryClient();

  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks', courseId],
    queryFn: () => base44.entities.Week.filter({ course_id: courseId }),
    enabled: !!courseId
  });

  const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Week.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      setEditingWeek(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Week.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      setEditingWeek(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Week.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weeks'] })
  });

  const startNewWeek = () => {
    setEditingWeek({
      course_id: courseId,
      week_number: sortedWeeks.length + 1,
      title_en: `Week ${sortedWeeks.length + 1}`,
      overview_en: '',
      content_blocks_en: [],
      content_blocks_es: [],
      has_quiz: false,
      has_discussion: false,
      has_written_assignment: false
    });
  };

  const saveWeek = () => {
    if (editingWeek.id) {
      updateMutation.mutate({ id: editingWeek.id, data: editingWeek });
    } else {
      createMutation.mutate(editingWeek);
    }
  };

  const text = {
    en: { addWeek: 'Add Week', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit Content', overview: 'Overview', lesson: 'Lesson', reading: 'Reading Assignment', discussion: 'Discussion Forum', written: 'Written Assignment', quiz: 'Quiz', hasQuiz: 'Has Quiz', hasDiscussion: 'Has Discussion', hasWritten: 'Has Written Assignment', upload: 'Upload Files' },
    es: { addWeek: 'Añadir Semana', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar Contenido', overview: 'Descripción', lesson: 'Lección', reading: 'Lectura Asignada', discussion: 'Foro de Discusión', written: 'Tarea Escrita', quiz: 'Quiz', hasQuiz: 'Tiene Quiz', hasDiscussion: 'Tiene Discusión', hasWritten: 'Tiene Tarea Escrita', upload: 'Subir Archivos' }
  };
  const t = text[lang];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{lang === 'es' ? 'Semanas del Curso' : 'Course Weeks'}</h3>
        <Button onClick={startNewWeek} className="bg-[#1e3a5f]">
          <Plus className="w-4 h-4 mr-2" />
          {t.addWeek}
        </Button>
      </div>

      {editingWeek && (
        <Card className="border-2 border-[#1e3a5f]">
          <CardHeader>
            <CardTitle>{editingWeek.id ? `${t.edit}: ${editingWeek.title_en}` : t.addWeek}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="es">Spanish</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="space-y-4 mt-4">
                <Input placeholder="Week Title" value={editingWeek.title_en || ''} onChange={(e) => setEditingWeek({...editingWeek, title_en: e.target.value})} />
                
                <div>
                  <Label>{t.overview}</Label>
                  <Textarea rows={4} placeholder="Week overview and learning objectives..." value={editingWeek.overview_en || ''} onChange={(e) => setEditingWeek({...editingWeek, overview_en: e.target.value})} />
                </div>

                <div>
                  <Label>{t.lesson}</Label>
                  <BlockEditor
                    value={editingWeek.content_blocks_en || []}
                    onChange={(blocks) => setEditingWeek({...editingWeek, content_blocks_en: blocks})}
                    lang="en"
                  />
                </div>

                <div>
                  <Label>{t.reading}</Label>
                  <Textarea rows={4} placeholder="Reading assignments, textbook pages, external resources..." value={editingWeek.reading_assignment_en || ''} onChange={(e) => setEditingWeek({...editingWeek, reading_assignment_en: e.target.value})} />
                </div>

                {editingWeek.has_written_assignment && (
                  <div>
                    <Label>{t.written}</Label>
                    <Textarea rows={6} placeholder="Written assignment instructions and requirements..." value={editingWeek.written_assignment_en || ''} onChange={(e) => setEditingWeek({...editingWeek, written_assignment_en: e.target.value})} />
                  </div>
                )}

                {editingWeek.has_discussion && (
                  <div>
                    <Label>{t.discussion} Prompt</Label>
                    <Textarea rows={4} placeholder="What should students discuss?" value={editingWeek.discussion_prompt_en || ''} onChange={(e) => setEditingWeek({...editingWeek, discussion_prompt_en: e.target.value})} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="es" className="space-y-4 mt-4">
                <Input placeholder="Título de la Semana" value={editingWeek.title_es || ''} onChange={(e) => setEditingWeek({...editingWeek, title_es: e.target.value})} />
                
                <div>
                  <Label>{t.overview}</Label>
                  <Textarea rows={4} placeholder="Descripción general de la semana..." value={editingWeek.overview_es || ''} onChange={(e) => setEditingWeek({...editingWeek, overview_es: e.target.value})} />
                </div>

                <div>
                  <Label>{t.lesson}</Label>
                  <BlockEditor
                    value={editingWeek.content_blocks_es || []}
                    onChange={(blocks) => setEditingWeek({...editingWeek, content_blocks_es: blocks})}
                    lang="es"
                  />
                </div>

                <div>
                  <Label>{t.reading}</Label>
                  <Textarea rows={4} placeholder="Lecturas asignadas..." value={editingWeek.reading_assignment_es || ''} onChange={(e) => setEditingWeek({...editingWeek, reading_assignment_es: e.target.value})} />
                </div>

                {editingWeek.has_written_assignment && (
                  <div>
                    <Label>{t.written}</Label>
                    <Textarea rows={6} placeholder="Instrucciones de la tarea..." value={editingWeek.written_assignment_es || ''} onChange={(e) => setEditingWeek({...editingWeek, written_assignment_es: e.target.value})} />
                  </div>
                )}

                {editingWeek.has_discussion && (
                  <div>
                    <Label>{t.discussion} Prompt</Label>
                    <Textarea rows={4} placeholder="¿Qué deben discutir los estudiantes?" value={editingWeek.discussion_prompt_es || ''} onChange={(e) => setEditingWeek({...editingWeek, discussion_prompt_es: e.target.value})} />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={editingWeek.has_quiz} onCheckedChange={(c) => setEditingWeek({...editingWeek, has_quiz: c})} />
                <Label>{t.hasQuiz}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={editingWeek.has_discussion} onCheckedChange={(c) => setEditingWeek({...editingWeek, has_discussion: c})} />
                <Label>{t.hasDiscussion}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={editingWeek.has_written_assignment} onCheckedChange={(c) => setEditingWeek({...editingWeek, has_written_assignment: c})} />
                <Label>{t.hasWritten}</Label>
              </div>
            </div>

            <div>
              <FileUploader
                label={t.upload}
                accept="*/*"
                onUploadComplete={(url, fileName) => {
                  if (url) {
                    const attachments = editingWeek.attachments || [];
                    attachments.push({ title: fileName || 'Attachment', url });
                    setEditingWeek({...editingWeek, attachments});
                  }
                }}
                lang={lang}
              />
              {editingWeek.attachments?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {editingWeek.attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                      <span className="truncate">{att.title}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          const newAttachments = editingWeek.attachments.filter((_, idx) => idx !== i);
                          setEditingWeek({...editingWeek, attachments: newAttachments});
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editingWeek.has_quiz && editingWeek.id && (
              <WeekQuizEditor weekId={editingWeek.id} lang={lang} />
            )}

            {editingWeek.has_written_assignment && editingWeek.id && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-4">{lang === 'es' ? 'Envíos de Tareas' : 'Assignment Submissions'}</h4>
                <WrittenAssignmentGrading weekId={editingWeek.id} courseId={courseId} lang={lang} />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditingWeek(null)}>{t.cancel}</Button>
              {editingWeek.id && <Button variant="destructive" onClick={() => deleteMutation.mutate(editingWeek.id)}>{t.delete}</Button>}
              <Button onClick={saveWeek} className="bg-[#1e3a5f]"><Save className="w-4 h-4 mr-2" />{t.save}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sortedWeeks.map(week => (
          <Card key={week.id}>
            <CardHeader className="cursor-pointer" onClick={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#1e3a5f]" />
                  <div>
                    <CardTitle className="text-base">{week[`title_${lang}`] || week.title_en}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      {week.has_quiz && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Quiz</span>}
                      {week.has_discussion && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Discussion</span>}
                      {week.has_written_assignment && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Written</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingWeek(week); }}><Edit2 className="w-4 h-4" /></Button>
                  {expandedWeek === week.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            {expandedWeek === week.id && (
              <CardContent>
                <div className="text-sm text-slate-600 space-y-2">
                  {week.overview_en && <p><strong>{t.overview}:</strong> {week[`overview_${lang}`] || week.overview_en}</p>}
                  {week.lesson_content_en && <p><FileText className="w-4 h-4 inline mr-1" />{t.lesson} content added</p>}
                  {week.reading_assignment_en && <p><FileText className="w-4 h-4 inline mr-1" />{t.reading} assigned</p>}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}