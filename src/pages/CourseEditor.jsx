import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Star, Plus, Edit2, Trash2 } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';
import WeekEditor from '@/components/admin/WeekEditor';
import ImageUploader from '@/components/upload/ImageUploader';

export default function CourseEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title_en: '',
    title_es: '',
    title_ps: '',
    title_fa: '',
    title_km: '',
    description_en: '',
    description_es: '',
    description_ps: '',
    description_fa: '',
    description_km: '',
    cover_image_url: '',
    tags: [],
    status: 'draft',
    language_availability: ['en'],
    credits: 4,
    duration_weeks: 16,
    prerequisites_en: '',
    prerequisites_es: '',
    prerequisites_ps: '',
    prerequisites_fa: '',
    prerequisites_km: '',
    learning_outcomes_en: [],
    learning_outcomes_es: [],
    learning_outcomes_ps: [],
    learning_outcomes_fa: [],
    learning_outcomes_km: [],
    order_index: 0
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      const isAuthorized = u.role === 'admin' || u.user_type === 'admin' || u.user_type === 'instructor';
      if (!isAuthorized) {
        window.location.href = createPageUrl('Dashboard');
      }
      setUser(u);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }),
    select: (data) => data[0],
    enabled: !!courseId
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => base44.entities.Module.filter({ course_id: courseId }),
    enabled: !!courseId
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (modules.length === 0) return [];
      const moduleIds = modules.map(m => m.id);
      const allLessons = await base44.entities.Lesson.list();
      return allLessons.filter(l => moduleIds.includes(l.module_id));
    },
    enabled: !!courseId && modules.length > 0
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: async () => {
      if (lessons.length === 0) return [];
      const lessonIds = lessons.map(l => l.id);
      const allQuizzes = await base44.entities.Quiz.list();
      return allQuizzes.filter(q => lessonIds.includes(q.lesson_id));
    },
    enabled: !!courseId && lessons.length > 0
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', courseId],
    queryFn: async () => {
      if (quizzes.length === 0) return [];
      const quizIds = quizzes.map(q => q.id);
      const allQuestions = await base44.entities.Question.list();
      return allQuestions.filter(q => quizIds.includes(q.quiz_id));
    },
    enabled: !!courseId && quizzes.length > 0
  });

  useEffect(() => {
    if (course) {
      setFormData(course);
    }
  }, [course]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (courseId) {
        return base44.entities.Course.update(courseId, data);
      } else {
        return base44.entities.Course.create(data);
      }
    },
    onSuccess: (savedCourse) => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
      const newCourseId = savedCourse.id || courseId;
      if (!courseId) {
        // New course - navigate to editor with ID so they can add weeks
        window.location.href = createPageUrl(`CourseEditor?id=${newCourseId}&lang=${lang}`);
      } else {
        // Existing course - stay on editor
        queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addOutcome = (langKey) => {
    const outcomes = formData[`learning_outcomes_${langKey}`] || [];
    updateField(`learning_outcomes_${langKey}`, [...outcomes, '']);
  };

  const updateOutcome = (langKey, index, value) => {
    const outcomes = [...(formData[`learning_outcomes_${langKey}`] || [])];
    outcomes[index] = value;
    updateField(`learning_outcomes_${langKey}`, outcomes);
  };

  const removeOutcome = (langKey, index) => {
    const outcomes = formData[`learning_outcomes_${langKey}`] || [];
    updateField(`learning_outcomes_${langKey}`, outcomes.filter((_, i) => i !== index));
  };

  const text = {
    en: {
      title: courseId ? "Edit Course" : "New Course",
      save: "Save Course",
      english: "English",
      spanish: "Spanish",
      basicInfo: "Basic Information",
      titleLabel: "Course Title",
      descLabel: "Description",
      coverUrl: "Cover Image",
      tags: "Tags (comma-separated)",
      status: "Status",
      credits: "Credits",
      duration: "Duration (weeks)",
      prerequisites: "Prerequisites",
      outcomes: "Learning Outcomes",
      addOutcome: "Add Outcome",
      langAvail: "Available Languages"
    },
    es: {
      title: courseId ? "Editar Curso" : "Nuevo Curso",
      save: "Guardar Curso",
      english: "Inglés",
      spanish: "Español",
      basicInfo: "Información Básica",
      titleLabel: "Título del Curso",
      descLabel: "Descripción",
      coverUrl: "Imagen de Portada",
      tags: "Etiquetas (separadas por comas)",
      status: "Estado",
      credits: "Créditos",
      duration: "Duración (semanas)",
      prerequisites: "Requisitos previos",
      outcomes: "Resultados de Aprendizaje",
      addOutcome: "Añadir Resultado",
      langAvail: "Idiomas Disponibles"
    }
  };

  const t = text[lang];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">Waypoint Institute</span>
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to={createPageUrl(`Admin?lang=${lang}`)}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'es' ? 'Volver al admin' : 'Back to admin'}
        </Link>

        <h1 className="text-3xl font-light text-slate-900 mb-8">{t.title}</h1>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="en" className="mb-6">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Spanish</TabsTrigger>
              <TabsTrigger value="ps">Pashtu</TabsTrigger>
              <TabsTrigger value="fa">Persian</TabsTrigger>
              <TabsTrigger value="km">Khmer</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.basicInfo} (EN)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t.titleLabel}</Label>
                    <Input
                      value={formData.title_en}
                      onChange={(e) => updateField('title_en', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t.descLabel}</Label>
                    <Textarea
                      value={formData.description_en}
                      onChange={(e) => updateField('description_en', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>{t.prerequisites}</Label>
                    <Textarea
                      value={formData.prerequisites_en}
                      onChange={(e) => updateField('prerequisites_en', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>{t.outcomes}</Label>
                    <div className="space-y-2">
                      {(formData.learning_outcomes_en || []).map((outcome, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={outcome}
                            onChange={(e) => updateOutcome('en', i, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOutcome('en', i)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOutcome('en')}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t.addOutcome}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="es" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.basicInfo} (ES)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t.titleLabel}</Label>
                    <Input
                      value={formData.title_es}
                      onChange={(e) => updateField('title_es', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t.descLabel}</Label>
                    <Textarea
                      value={formData.description_es}
                      onChange={(e) => updateField('description_es', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>{t.prerequisites}</Label>
                    <Textarea
                      value={formData.prerequisites_es}
                      onChange={(e) => updateField('prerequisites_es', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>{t.outcomes}</Label>
                    <div className="space-y-2">
                      {(formData.learning_outcomes_es || []).map((outcome, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={outcome}
                            onChange={(e) => updateOutcome('es', i, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOutcome('es', i)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOutcome('es')}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t.addOutcome}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {['ps', 'fa', 'km'].map(langCode => {
              const langNames = { ps: 'Pashtu', fa: 'Persian', km: 'Khmer' };
              return (
                <TabsContent key={langCode} value={langCode} className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.basicInfo} ({langNames[langCode].toUpperCase()})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>{t.titleLabel}</Label>
                        <Input
                          value={formData[`title_${langCode}`] || ''}
                          onChange={(e) => updateField(`title_${langCode}`, e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{t.descLabel}</Label>
                        <Textarea
                          value={formData[`description_${langCode}`] || ''}
                          onChange={(e) => updateField(`description_${langCode}`, e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>{t.prerequisites}</Label>
                        <Textarea
                          value={formData[`prerequisites_${langCode}`] || ''}
                          onChange={(e) => updateField(`prerequisites_${langCode}`, e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>{t.outcomes}</Label>
                        <div className="space-y-2">
                          {(formData[`learning_outcomes_${langCode}`] || []).map((outcome, i) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                value={outcome}
                                onChange={(e) => updateOutcome(langCode, i, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOutcome(langCode, i)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOutcome(langCode)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {t.addOutcome}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{lang === 'es' ? 'Configuración' : 'Settings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.status}</Label>
                  <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.credits}</Label>
                  <Input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => updateField('credits', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>{t.duration}</Label>
                  <Input
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) => updateField('duration_weeks', parseFloat(e.target.value))}
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageUploader 
                    label={t.coverUrl}
                    value={formData.cover_image_url}
                    onChange={(url) => updateField('cover_image_url', url)}
                  />
                </div>
              </div>

              <div>
                <Label>{t.tags}</Label>
                <Input
                  value={(formData.tags || []).join(', ')}
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Scripture, Theology, Formation"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to={createPageUrl(`Admin?lang=${lang}`)}>
              <Button variant="outline">{lang === 'es' ? 'Volver' : 'Back'}</Button>
            </Link>
            {courseId && (
              <Link to={createPageUrl(`Course?id=${courseId}&lang=${lang}`)}>
                <Button variant="outline">
                  {lang === 'es' ? 'Vista Estudiante' : 'Student View'}
                </Button>
              </Link>
            )}
            <Button
              type="submit"
              disabled={saveMutation.isPending || !formData.title_en}
              className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? '...' : t.save}
            </Button>
          </div>
        </form>

        {/* Week-based Course Structure */}
        {courseId && (
          <div className="mt-12">
            <WeekEditor courseId={courseId} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}