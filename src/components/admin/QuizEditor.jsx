import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, HelpCircle } from "lucide-react";

export default function QuizEditor({ lessons, quizzes, questions, lang }) {
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState('');
  const [newQuiz, setNewQuiz] = useState(null);
  const [newQuestion, setNewQuestion] = useState(null);

  const quizCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Quiz.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setNewQuiz(null);
    }
  });

  const questionCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Question.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setNewQuestion(null);
    }
  });

  const questionDeleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] })
  });

  const addOption = () => {
    if (!newQuestion) return;
    const options = newQuestion.options || [];
    setNewQuestion({
      ...newQuestion,
      options: [...options, { text_en: '', text_es: '', is_correct: false }]
    });
  };

  const updateOption = (index, field, value) => {
    const options = [...newQuestion.options];
    options[index][field] = value;
    setNewQuestion({ ...newQuestion, options });
  };

  const removeOption = (index) => {
    const options = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options });
  };

  const text = {
    en: {
      title: "Quiz Management",
      selectLesson: "Select Lesson",
      createQuiz: "Create Quiz",
      quizTitle: "Quiz Title",
      instructions: "Instructions",
      passThreshold: "Pass Threshold (%)",
      maxAttempts: "Max Attempts",
      showFeedback: "Show Immediate Feedback",
      addQuestion: "Add Question",
      questionText: "Question Text",
      questionType: "Question Type",
      multipleChoice: "Multiple Choice",
      multiSelect: "Multi-Select",
      shortAnswer: "Short Answer",
      options: "Options",
      addOption: "Add Option",
      correct: "Correct",
      points: "Points",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      noQuiz: "No quiz for this lesson yet"
    },
    es: {
      title: "Gestión de Quizzes",
      selectLesson: "Seleccionar Lección",
      createQuiz: "Crear Quiz",
      quizTitle: "Título del Quiz",
      instructions: "Instrucciones",
      passThreshold: "Umbral de Aprobación (%)",
      maxAttempts: "Intentos Máximos",
      showFeedback: "Mostrar Retroalimentación Inmediata",
      addQuestion: "Añadir Pregunta",
      questionText: "Texto de la Pregunta",
      questionType: "Tipo de Pregunta",
      multipleChoice: "Opción Múltiple",
      multiSelect: "Multi-Selección",
      shortAnswer: "Respuesta Corta",
      options: "Opciones",
      addOption: "Añadir Opción",
      correct: "Correcta",
      points: "Puntos",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      noQuiz: "Sin quiz para esta lección aún"
    }
  };

  const t = text[lang];

  const selectedLessonQuizzes = selectedLesson ? quizzes.filter(q => q.lesson_id === selectedLesson) : [];
  const selectedQuiz = selectedLessonQuizzes[0];
  const quizQuestions = selectedQuiz ? questions.filter(q => q.quiz_id === selectedQuiz.id).sort((a, b) => a.order_index - b.order_index) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HelpCircle className="w-6 h-6 text-[#1e3a5f]" />
        <h3 className="text-xl font-semibold text-slate-900">{t.title}</h3>
      </div>

      <div>
        <Label>{t.selectLesson}</Label>
        <Select value={selectedLesson} onValueChange={setSelectedLesson}>
          <SelectTrigger>
            <SelectValue placeholder={t.selectLesson} />
          </SelectTrigger>
          <SelectContent>
            {lessons.map(lesson => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedLesson && !selectedQuiz && !newQuiz && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">{t.noQuiz}</p>
            <Button onClick={() => setNewQuiz({ lesson_id: selectedLesson, title_en: '', pass_threshold: 70, max_attempts: 2, show_immediate_feedback: true })}>
              <Plus className="w-4 h-4 mr-2" />
              {t.createQuiz}
            </Button>
          </CardContent>
        </Card>
      )}

      {newQuiz && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>{lang === 'es' ? 'Nuevo Quiz' : 'New Quiz'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.quizTitle} (EN)</Label>
                <Input value={newQuiz.title_en} onChange={(e) => setNewQuiz({...newQuiz, title_en: e.target.value})} />
              </div>
              <div>
                <Label>{t.quizTitle} (ES)</Label>
                <Input value={newQuiz.title_es || ''} onChange={(e) => setNewQuiz({...newQuiz, title_es: e.target.value})} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.instructions} (EN)</Label>
                <Textarea value={newQuiz.instructions_en || ''} onChange={(e) => setNewQuiz({...newQuiz, instructions_en: e.target.value})} />
              </div>
              <div>
                <Label>{t.instructions} (ES)</Label>
                <Textarea value={newQuiz.instructions_es || ''} onChange={(e) => setNewQuiz({...newQuiz, instructions_es: e.target.value})} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t.passThreshold}</Label>
                <Input type="number" value={newQuiz.pass_threshold} onChange={(e) => setNewQuiz({...newQuiz, pass_threshold: parseFloat(e.target.value)})} />
              </div>
              <div>
                <Label>{t.maxAttempts}</Label>
                <Input type="number" value={newQuiz.max_attempts} onChange={(e) => setNewQuiz({...newQuiz, max_attempts: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => quizCreateMutation.mutate(newQuiz)} disabled={!newQuiz.title_en}>
                <Save className="w-4 h-4 mr-2" />
                {t.save}
              </Button>
              <Button variant="outline" onClick={() => setNewQuiz(null)}>{t.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuiz && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{selectedQuiz.title_en}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-slate-600">
                  {quizQuestions.length} {lang === 'es' ? 'preguntas' : 'questions'}
                </div>
                <Button size="sm" onClick={() => setNewQuestion({ quiz_id: selectedQuiz.id, question_text_en: '', question_type: 'multiple_choice', options: [], order_index: quizQuestions.length })}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addQuestion}
                </Button>
              </div>

              {newQuestion && (
                <Card className="mb-4 bg-green-50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t.questionText} (EN)</Label>
                        <Textarea value={newQuestion.question_text_en} onChange={(e) => setNewQuestion({...newQuestion, question_text_en: e.target.value})} />
                      </div>
                      <div>
                        <Label>{t.questionText} (ES)</Label>
                        <Textarea value={newQuestion.question_text_es || ''} onChange={(e) => setNewQuestion({...newQuestion, question_text_es: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t.questionType}</Label>
                        <Select value={newQuestion.question_type} onValueChange={(v) => setNewQuestion({...newQuestion, question_type: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">{t.multipleChoice}</SelectItem>
                            <SelectItem value="multi_select">{t.multiSelect}</SelectItem>
                            <SelectItem value="short_answer">{t.shortAnswer}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t.points}</Label>
                        <Input type="number" value={newQuestion.points || 1} onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    {(newQuestion.question_type === 'multiple_choice' || newQuestion.question_type === 'multi_select') && (
                      <div>
                        <Label>{t.options}</Label>
                        <div className="space-y-2">
                          {(newQuestion.options || []).map((option, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <Input placeholder="Option (EN)" value={option.text_en} onChange={(e) => updateOption(i, 'text_en', e.target.value)} />
                              <Input placeholder="Opción (ES)" value={option.text_es || ''} onChange={(e) => updateOption(i, 'text_es', e.target.value)} />
                              <div className="flex items-center gap-2 px-3">
                                <Checkbox checked={option.is_correct} onCheckedChange={(checked) => updateOption(i, 'is_correct', checked)} />
                                <Label className="text-xs">{t.correct}</Label>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeOption(i)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addOption}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t.addOption}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={() => questionCreateMutation.mutate(newQuestion)} disabled={!newQuestion.question_text_en}>
                        <Save className="w-4 h-4 mr-2" />
                        {t.save}
                      </Button>
                      <Button variant="outline" onClick={() => setNewQuestion(null)}>{t.cancel}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {quizQuestions.map((question, i) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium mb-2">{i + 1}. {question.question_text_en}</div>
                        <div className="text-sm text-slate-600">
                          {question.question_type} • {question.points} {lang === 'es' ? 'puntos' : 'points'}
                        </div>
                        {question.options && (
                          <div className="mt-2 space-y-1">
                            {question.options.map((opt, j) => (
                              <div key={j} className="text-sm flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${opt.is_correct ? 'bg-green-600' : 'bg-slate-300'}`} />
                                {opt.text_en}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => questionDeleteMutation.mutate(question.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}