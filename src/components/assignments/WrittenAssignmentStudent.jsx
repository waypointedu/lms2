import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, FileText, ExternalLink, Clock, Upload } from 'lucide-react';

export default function WrittenAssignmentStudent({ week, courseId, user, lang }) {
  const [docsUrl, setDocsUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: submission } = useQuery({
    queryKey: ['writtenSubmission', week.id, user.email],
    queryFn: async () => {
      const subs = await base44.entities.WrittenAssignmentSubmission.filter({
        week_id: week.id,
        user_email: user.email
      });
      return subs[0];
    },
    enabled: !!week.id && !!user.email
  });

  const submitMutation = useMutation({
    mutationFn: async (url) => {
      if (submission) {
        return await base44.entities.WrittenAssignmentSubmission.update(submission.id, {
          google_docs_url: url,
          submitted_date: new Date().toISOString()
        });
      } else {
        return await base44.entities.WrittenAssignmentSubmission.create({
          week_id: week.id,
          course_id: courseId,
          user_email: user.email,
          user_name: user.full_name || user.email,
          google_docs_url: url,
          submitted_date: new Date().toISOString(),
          status: 'submitted'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writtenSubmission'] });
      setDocsUrl('');
    },
    onError: (error) => {
      console.error('Submission error:', error);
      alert(lang === 'es' ? 'Error al enviar la tarea' : 'Error submitting assignment');
    }
  });

  const handleSubmit = () => {
    if (!docsUrl.trim()) return;
    submitMutation.mutate(docsUrl);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      submitMutation.mutate(file_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert(lang === 'es' ? 'Error al subir el archivo' : 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const text = {
    en: {
      title: 'Written Assignment',
      instructions: 'Assignment Instructions',
      submit: 'Submit Google Docs Link',
      resubmit: 'Update Submission',
      placeholder: 'Paste your Google Docs link here',
      uploadFile: 'Upload File',
      or: 'or',
      submitted: 'Submitted',
      graded: 'Graded',
      grade: 'Grade',
      feedback: 'Instructor Feedback',
      viewDoc: 'View Document',
      pending: 'Pending Review'
    },
    es: {
      title: 'Tarea Escrita',
      instructions: 'Instrucciones de la Tarea',
      submit: 'Enviar Enlace de Google Docs',
      resubmit: 'Actualizar Envío',
      placeholder: 'Pega tu enlace de Google Docs aquí',
      uploadFile: 'Subir Archivo',
      or: 'o',
      submitted: 'Enviado',
      graded: 'Calificado',
      grade: 'Calificación',
      feedback: 'Comentarios del Instructor',
      viewDoc: 'Ver Documento',
      pending: 'Pendiente de Revisión'
    }
  };

  const t = text[lang];

  const assignmentText = week[`written_assignment_${lang}`] || week.written_assignment_en;

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignmentText && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">{t.instructions}</h4>
            <div 
              className="text-slate-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: assignmentText }}
            />
          </div>
        )}

        {submission ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">{t.submitted}</span>
              </div>
              <a
                href={submission.google_docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1e3a5f] hover:underline flex items-center gap-1 text-sm"
              >
                {t.viewDoc} <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {submission.status === 'graded' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-blue-900">{t.graded}</span>
                  <span className="text-2xl font-bold text-blue-700">{submission.grade}%</span>
                </div>
                {submission.instructor_feedback && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-1">{t.feedback}:</p>
                    <p className="text-slate-600 text-sm">{submission.instructor_feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="w-4 h-4" />
                {t.pending}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="docs-url">{t.resubmit}</Label>
              <div className="flex gap-2">
                <Input
                  id="docs-url"
                  value={docsUrl}
                  onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder={t.placeholder}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !docsUrl.trim()}
                  className="bg-[#1e3a5f]"
                >
                  {t.resubmit}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docs-url">{t.submit}</Label>
              <div className="flex gap-2">
                <Input
                  id="docs-url"
                  value={docsUrl}
                  onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder={t.placeholder}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !docsUrl.trim()}
                  className="bg-[#1e3a5f]"
                >
                  {t.submit}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'es' 
                  ? 'Asegúrate de que tu documento de Google Docs esté configurado para que "cualquiera con el enlace pueda ver/comentar"'
                  : 'Make sure your Google Docs is set to "Anyone with the link can view/comment"'}
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">{t.or}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">{t.uploadFile}</Label>
              <div className="flex items-center gap-2">
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading || submitMutation.isPending}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById('file-upload').click()}
                  disabled={uploading || submitMutation.isPending}
                  variant="outline"
                  className="w-full border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
                >
                  {uploading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      {lang === 'es' ? 'Subiendo...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {lang === 'es' ? 'Seleccionar Archivo' : 'Choose File'}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'es' 
                  ? 'Formatos aceptados: PDF, DOC, DOCX, TXT'
                  : 'Accepted formats: PDF, DOC, DOCX, TXT'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}