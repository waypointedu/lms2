import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, ExternalLink, Save } from 'lucide-react';

export default function WrittenAssignmentGrading({ weekId, courseId, lang }) {
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const { data: submissions = [] } = useQuery({
    queryKey: ['writtenSubmissions', weekId],
    queryFn: () => base44.entities.WrittenAssignmentSubmission.filter({ week_id: weekId }),
    enabled: !!weekId
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WrittenAssignmentSubmission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writtenSubmissions'] });
      setGradingSubmissionId(null);
      setGrade('');
      setFeedback('');
    }
  });

  const handleGrade = (submissionId) => {
    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) return;

    gradeMutation.mutate({
      id: submissionId,
      data: {
        grade: gradeNum,
        instructor_feedback: feedback,
        status: 'graded',
        graded_date: new Date().toISOString()
      }
    });
  };

  const startGrading = (submission) => {
    setGradingSubmissionId(submission.id);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.instructor_feedback || '');
  };

  const text = {
    en: {
      title: 'Written Assignment Submissions',
      student: 'Student',
      submitted: 'Submitted',
      graded: 'Graded',
      viewDoc: 'View Document',
      grade: 'Grade',
      feedback: 'Feedback',
      save: 'Save Grade',
      cancel: 'Cancel',
      noSubmissions: 'No submissions yet',
      gradeLabel: 'Grade (0-100)',
      feedbackLabel: 'Instructor Feedback'
    },
    es: {
      title: 'Envíos de Tareas Escritas',
      student: 'Estudiante',
      submitted: 'Enviado',
      graded: 'Calificado',
      viewDoc: 'Ver Documento',
      grade: 'Calificación',
      feedback: 'Comentarios',
      save: 'Guardar Calificación',
      cancel: 'Cancelar',
      noSubmissions: 'No hay envíos aún',
      gradeLabel: 'Calificación (0-100)',
      feedbackLabel: 'Comentarios del Instructor'
    }
  };

  const t = text[lang];

  const getGoogleDocsEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return `https://docs.google.com/document/d/${match[1]}/preview`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          {t.noSubmissions}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t.title}</h3>
      {submissions.map(submission => {
        const embedUrl = getGoogleDocsEmbedUrl(submission.google_docs_url);
        const isGrading = gradingSubmissionId === submission.id;

        return (
          <Card key={submission.id} className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{submission.user_name}</span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  submission.status === 'graded'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {submission.status === 'graded' ? t.graded : t.submitted}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Docs Embed */}
              {embedUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-[600px]"
                    frameBorder="0"
                  />
                </div>
              ) : (
                <a
                  href={submission.google_docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1e3a5f] hover:underline flex items-center gap-1"
                >
                  {t.viewDoc} <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {isGrading ? (
                <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                  <div>
                    <Label htmlFor={`grade-${submission.id}`}>{t.gradeLabel}</Label>
                    <Input
                      id={`grade-${submission.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="85"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`feedback-${submission.id}`}>{t.feedbackLabel}</Label>
                    <Textarea
                      id={`feedback-${submission.id}`}
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={lang === 'es' ? 'Excelente trabajo...' : 'Great work...'}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setGradingSubmissionId(null)}>
                      {t.cancel}
                    </Button>
                    <Button
                      onClick={() => handleGrade(submission.id)}
                      disabled={gradeMutation.isPending}
                      className="bg-[#1e3a5f]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t.save}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                  {submission.status === 'graded' ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-slate-900">{submission.grade}%</span>
                        {submission.instructor_feedback && (
                          <div className="text-sm text-slate-600">
                            <strong>{t.feedback}:</strong> {submission.instructor_feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">{lang === 'es' ? 'Sin calificar' : 'Not graded'}</span>
                  )}
                  <Button onClick={() => startGrading(submission)} variant="outline">
                    {submission.status === 'graded' ? (lang === 'es' ? 'Editar' : 'Edit') : (lang === 'es' ? 'Calificar' : 'Grade')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}