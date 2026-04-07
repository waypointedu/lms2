import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Save, Trash2, HelpCircle } from 'lucide-react';

export default function WeekQuizEditor({ weekId, lang }) {
  const [editingQuiz, setEditingQuiz] = useState(null);
  const queryClient = useQueryClient();

  const { data: quizzes = [] } = useQuery({
    queryKey: ['weekQuizzes', weekId],
    queryFn: () => base44.entities.WeekQuiz.filter({ week_id: weekId }),
    enabled: !!weekId
  });

  const quiz = quizzes[0];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WeekQuiz.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekQuizzes'] });
      setEditingQuiz(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WeekQuiz.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekQuizzes'] });
      setEditingQuiz(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WeekQuiz.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekQuizzes'] })
  });

  const startEdit = () => {
    if (quiz) {
      setEditingQuiz(quiz);
    } else {
      setEditingQuiz({
        week_id: weekId,
        title_en: 'Week Quiz',
        questions: [],
        pass_threshold: 70,
        retake_penalty: 5,
        unlimited_retakes: true
      });
    }
  };

  const addQuestion = () => {
    const questions = editingQuiz.questions || [];
    questions.push({
      question_en: '',
      question_es: '',
      options: [
        { text_en: '', text_es: '', is_correct: false },
        { text_en: '', text_es: '', is_correct: false },
        { text_en: '', text_es: '', is_correct: false },
        { text_en: '', text_es: '', is_correct: false }
      ],
      points: 1
    });
    setEditingQuiz({...editingQuiz, questions});
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...editingQuiz.questions];
    questions[index][field] = value;
    setEditingQuiz({...editingQuiz, questions});
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const questions = [...editingQuiz.questions];
    questions[qIndex].options[oIndex][field] = value;
    setEditingQuiz({...editingQuiz, questions});
  };

  const deleteQuestion = (index) => {
    const questions = editingQuiz.questions.filter((_, i) => i !== index);
    setEditingQuiz({...editingQuiz, questions});
  };

  const saveQuiz = () => {
    if (editingQuiz.id) {
      updateMutation.mutate({ id: editingQuiz.id, data: editingQuiz });
    } else {
      createMutation.mutate(editingQuiz);
    }
  };

  const text = {
    en: { title: 'Quiz Editor', create: 'Create Quiz', edit: 'Edit Quiz', save: 'Save', cancel: 'Cancel', delete: 'Delete Quiz', quizTitle: 'Quiz Title', instructions: 'Instructions', passThreshold: 'Pass Threshold (%)', retakePenalty: 'Retake Penalty (%)', addQuestion: 'Add Question', question: 'Question', option: 'Option', correct: 'Correct Answer', points: 'Points', deleteQ: 'Delete Question' },
    es: { title: 'Editor de Quiz', create: 'Crear Quiz', edit: 'Editar Quiz', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar Quiz', quizTitle: 'Título del Quiz', instructions: 'Instrucciones', passThreshold: 'Umbral de Aprobación (%)', retakePenalty: 'Penalización por Reintento (%)', addQuestion: 'Añadir Pregunta', question: 'Pregunta', option: 'Opción', correct: 'Respuesta Correcta', points: 'Puntos', deleteQ: 'Eliminar Pregunta' }
  };
  const t = text[lang];

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-600" />
          {t.title}
        </h4>
        {!editingQuiz && (
          <Button onClick={startEdit} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {quiz ? t.edit : t.create}
          </Button>
        )}
      </div>

      {editingQuiz && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="pt-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.quizTitle} (EN)</Label>
                <Input value={editingQuiz.title_en || ''} onChange={(e) => setEditingQuiz({...editingQuiz, title_en: e.target.value})} />
              </div>
              <div>
                <Label>{t.quizTitle} (ES)</Label>
                <Input value={editingQuiz.title_es || ''} onChange={(e) => setEditingQuiz({...editingQuiz, title_es: e.target.value})} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.instructions} (EN)</Label>
                <Textarea value={editingQuiz.instructions_en || ''} onChange={(e) => setEditingQuiz({...editingQuiz, instructions_en: e.target.value})} rows={2} />
              </div>
              <div>
                <Label>{t.instructions} (ES)</Label>
                <Textarea value={editingQuiz.instructions_es || ''} onChange={(e) => setEditingQuiz({...editingQuiz, instructions_es: e.target.value})} rows={2} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.passThreshold}</Label>
                <Input type="number" value={editingQuiz.pass_threshold || 70} onChange={(e) => setEditingQuiz({...editingQuiz, pass_threshold: Number(e.target.value)})} />
              </div>
              <div>
                <Label>{t.retakePenalty}</Label>
                <Input type="number" value={editingQuiz.retake_penalty || 5} onChange={(e) => setEditingQuiz({...editingQuiz, retake_penalty: Number(e.target.value)})} />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base">{lang === 'es' ? 'Preguntas' : 'Questions'}</Label>
                <Button size="sm" variant="outline" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addQuestion}
                </Button>
              </div>

              {(editingQuiz.questions || []).map((q, qIndex) => (
                <Card key={qIndex} className="mb-4 bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm">{t.question} {qIndex + 1}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => deleteQuestion(qIndex)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Textarea placeholder="Question (EN)" value={q.question_en || ''} onChange={(e) => updateQuestion(qIndex, 'question_en', e.target.value)} rows={2} />
                      <Textarea placeholder="Pregunta (ES)" value={q.question_es || ''} onChange={(e) => updateQuestion(qIndex, 'question_es', e.target.value)} rows={2} />
                    </div>

                    <div className="space-y-2">
                      {q.options?.map((opt, oIndex) => (
                        <div key={oIndex} className="flex gap-2 items-center">
                          <span className="text-xs font-mono w-6">{String.fromCharCode(65 + oIndex)}</span>
                          <Input placeholder="Option (EN)" value={opt.text_en || ''} onChange={(e) => updateOption(qIndex, oIndex, 'text_en', e.target.value)} />
                          <Input placeholder="Opción (ES)" value={opt.text_es || ''} onChange={(e) => updateOption(qIndex, oIndex, 'text_es', e.target.value)} />
                          <div className="flex items-center gap-1 px-2">
                            <Checkbox checked={opt.is_correct} onCheckedChange={(c) => updateOption(qIndex, oIndex, 'is_correct', c)} />
                            <Label className="text-xs whitespace-nowrap">{t.correct}</Label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Input type="number" placeholder={t.points} value={q.points || 1} onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))} className="w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 justify-end border-t pt-4">
              <Button variant="outline" onClick={() => setEditingQuiz(null)}>{t.cancel}</Button>
              {editingQuiz.id && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editingQuiz.id); setEditingQuiz(null); }}>{t.delete}</Button>}
              <Button onClick={saveQuiz} className="bg-purple-600 hover:bg-purple-700"><Save className="w-4 h-4 mr-2" />{t.save}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {quiz && !editingQuiz && (
        <div className="text-sm text-slate-600 bg-purple-50 p-4 rounded-lg">
          <strong>{quiz.title_en}</strong> • {quiz.questions?.length || 0} questions • {quiz.pass_threshold}% to pass • {quiz.retake_penalty}% penalty per retake
        </div>
      )}
    </div>
  );
}