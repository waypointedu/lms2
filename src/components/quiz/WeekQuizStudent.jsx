import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';

export default function WeekQuizStudent({ weekId, user, lang }) {
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const queryClient = useQueryClient();

  const { data: quiz } = useQuery({
    queryKey: ['weekQuiz', weekId],
    queryFn: async () => {
      const quizzes = await base44.entities.WeekQuiz.filter({ week_id: weekId });
      return quizzes[0];
    },
    enabled: !!weekId
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['weekQuizAttempts', weekId, user.email],
    queryFn: () => base44.entities.WeekQuizAttempt.filter({
      week_id: weekId,
      user_email: user.email
    }),
    enabled: !!weekId && !!user.email
  });

  const submitMutation = useMutation({
    mutationFn: async (answers) => {
      const questions = quiz.questions || [];
      const attemptNumber = attempts.length + 1;
      const answersArray = questions.map((q, idx) => ({
        question_index: idx,
        selected_option_index: answers[idx] ?? -1,
        is_correct: answers[idx] !== undefined && q.options[answers[idx]]?.is_correct || false
      }));

      const correctCount = answersArray.filter(a => a.is_correct).length;
      const rawScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const penalty = (attemptNumber - 1) * (quiz.retake_penalty || 5);
      const finalScore = Math.max(0, rawScore - penalty);
      const passed = finalScore >= (quiz.pass_threshold || 70);

      // Get course_id from week
      const weeks = await base44.entities.Week.filter({ id: weekId });
      const week = weeks[0];

      const attempt = await base44.entities.WeekQuizAttempt.create({
        user_email: user.email,
        quiz_id: quiz.id,
        week_id: weekId,
        course_id: week?.course_id,
        answers: answersArray,
        raw_score: rawScore,
        final_score: finalScore,
        attempt_number: attemptNumber,
        passed,
        completed_at: new Date().toISOString()
      });

      return { attempt, finalScore, passed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['weekQuizAttempts'] });
      setShowResults(true);
      alert(`${lang === 'es' ? 'Calificación' : 'Grade'}: ${data.finalScore}% - ${data.passed ? (lang === 'es' ? 'Aprobado' : 'Passed') : (lang === 'es' ? 'No Aprobado' : 'Not Passed')}`);
    }
  });

  const handleSubmit = () => {
    const questions = quiz.questions || [];
    if (Object.keys(currentAnswers).length !== questions.length) {
      alert(lang === 'es' ? 'Por favor responde todas las preguntas' : 'Please answer all questions');
      return;
    }
    setIsRetaking(false);
    submitMutation.mutate(currentAnswers);
  };

  const handleRetake = () => {
    setCurrentAnswers({});
    setShowResults(false);
    setIsRetaking(true);
  };

  if (!quiz) return null;

  const questions = quiz.questions || [];
  const lastAttempt = attempts[attempts.length - 1];
  const canRetake = quiz.unlimited_retakes || attempts.length === 0;
  const nextAttemptPenalty = attempts.length * (quiz.retake_penalty || 5);

  const text = {
    en: {
      title: 'Quiz',
      instructions: 'Instructions',
      question: 'Question',
      submit: 'Submit Quiz',
      retake: 'Retake Quiz',
      attempts: 'Attempts',
      score: 'Score',
      passed: 'Passed',
      failed: 'Not Passed',
      penalty: 'Retake Penalty',
      correct: 'Correct',
      incorrect: 'Incorrect',
      yourAnswer: 'Your answer'
    },
    es: {
      title: 'Quiz',
      instructions: 'Instrucciones',
      question: 'Pregunta',
      submit: 'Enviar Quiz',
      retake: 'Reintentar Quiz',
      attempts: 'Intentos',
      score: 'Calificación',
      passed: 'Aprobado',
      failed: 'No Aprobado',
      penalty: 'Penalización por Reintento',
      correct: 'Correcto',
      incorrect: 'Incorrecto',
      yourAnswer: 'Tu respuesta'
    }
  };

  const t = text[lang];

  const quizTitle = quiz[`title_${lang}`] || quiz.title_en;
  const instructions = quiz[`instructions_${lang}`] || quiz.instructions_en;

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          {quizTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {instructions && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">{instructions}</p>
          </div>
        )}

        {lastAttempt && !showResults && !isRetaking && (
          <div className={`rounded-lg p-4 ${lastAttempt.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{t.score}: {lastAttempt.final_score}%</span>
                <span className={`ml-3 text-sm ${lastAttempt.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {lastAttempt.passed ? t.passed : t.failed}
                </span>
              </div>
              <span className="text-sm text-slate-600">{t.attempts}: {attempts.length}</span>
            </div>
            {canRetake && !lastAttempt.passed && (
              <p className="text-sm text-slate-600 mt-2">
                {t.penalty}: -{nextAttemptPenalty}%
              </p>
            )}
          </div>
        )}

        {(!lastAttempt || !lastAttempt.passed || showResults || isRetaking) && (
          <div className="space-y-6">
            {questions.map((question, qIdx) => {
              const questionText = question[`question_${lang}`] || question.question_en;
              const lastAnswer = lastAttempt?.answers?.find(a => a.question_index === qIdx);
              const showCorrectAnswer = showResults && lastAttempt;

              return (
                <div key={qIdx} className="space-y-3">
                  <h4 className="font-semibold text-slate-900">
                    {t.question} {qIdx + 1}: {questionText}
                  </h4>
                  <RadioGroup
                    value={currentAnswers[qIdx]?.toString()}
                    onValueChange={(val) => setCurrentAnswers({...currentAnswers, [qIdx]: parseInt(val)})}
                    disabled={showResults}
                  >
                    {question.options.map((option, optIdx) => {
                      const optionText = option[`text_${lang}`] || option.text_en;
                      const isSelected = showResults && lastAnswer?.selected_option_index === optIdx;
                      const isCorrect = option.is_correct;

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center space-x-2 p-3 rounded-lg border ${
                            showResults && isSelected && isCorrect ? 'bg-emerald-50 border-emerald-200' :
                            showResults && isSelected && !isCorrect ? 'bg-red-50 border-red-200' :
                            showResults && isCorrect ? 'bg-emerald-50 border-emerald-200' :
                            'border-slate-200'
                          }`}
                        >
                          <RadioGroupItem value={optIdx.toString()} id={`q${qIdx}-opt${optIdx}`} />
                          <Label htmlFor={`q${qIdx}-opt${optIdx}`} className="flex-1 cursor-pointer flex items-center justify-between">
                            <span>{optionText}</span>
                            {showResults && isSelected && (
                              <span className="text-sm flex items-center gap-1">
                                {isCorrect ? (
                                  <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t.correct}</>
                                ) : (
                                  <><XCircle className="w-4 h-4 text-red-600" /> {t.incorrect}</>
                                )}
                              </span>
                            )}
                            {showResults && !isSelected && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              );
            })}

            {!showResults && (
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || Object.keys(currentAnswers).length !== questions.length}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {t.submit}
                </Button>
                {canRetake && attempts.length > 0 && (
                  <Button variant="outline" onClick={handleRetake}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.retake}
                  </Button>
                )}
              </div>
            )}

            {showResults && canRetake && (
              <Button onClick={handleRetake} className="bg-purple-600 hover:bg-purple-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.retake}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}