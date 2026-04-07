import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import QuizQuestion from '@/components/quiz/QuizQuestion';

export default function QuizContainer({ quizId, user, courseId, lessonId, lang = 'en', onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: quiz } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => base44.entities.Quiz.filter({ id: quizId }),
    select: (data) => data[0],
    enabled: !!quizId
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', quizId],
    queryFn: () => base44.entities.Question.filter({ quiz_id: quizId }),
    select: (data) => data.sort((a, b) => a.order_index - b.order_index),
    enabled: !!quizId
  });

  const { data: previousAttempts = [] } = useQuery({
    queryKey: ['quizAttempts', quizId, user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ quiz_id: quizId, user_email: user?.email }),
    enabled: !!user?.email && !!quizId
  });

  const submitMutation = useMutation({
    mutationFn: (attemptData) => base44.entities.QuizAttempt.create(attemptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizAttempts', quizId, user?.email] });
    }
  });

  const canAttempt = !quiz?.max_attempts || previousAttempts.length < quiz.max_attempts;
  const bestScore = previousAttempts.length > 0 
    ? Math.max(...previousAttempts.map(a => a.score)) 
    : null;
  const hasPassed = previousAttempts.some(a => a.passed);

  const quizTitle = quiz?.[`title_${lang}`] || quiz?.title_en || 'Quiz';
  const instructions = quiz?.[`instructions_${lang}`] || quiz?.instructions_en;

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    let correct = 0;
    let total = questions.length;

    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (q.question_type === 'multiple_choice') {
        const correctOption = q.options?.find(o => o.is_correct);
        const correctText = correctOption?.[`text_${lang}`] || correctOption?.text_en;
        if (userAnswer === correctText) correct++;
      } else if (q.question_type === 'multi_select') {
        const correctOptions = q.options?.filter(o => o.is_correct).map(o => o[`text_${lang}`] || o.text_en);
        const userArray = Array.isArray(userAnswer) ? userAnswer : [];
        if (JSON.stringify([...userArray].sort()) === JSON.stringify([...correctOptions].sort())) {
          correct++;
        }
      }
    });

    return Math.round((correct / total) * 100);
  };

  const handleSubmit = async () => {
    const score = calculateScore();
    const passed = score >= (quiz?.pass_threshold || 70);
    
    const attemptData = {
      user_email: user.email,
      quiz_id: quizId,
      lesson_id: lessonId,
      course_id: courseId,
      answers: Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        selected_answer: JSON.stringify(ans),
        is_correct: false // Will be calculated
      })),
      score,
      passed,
      attempt_number: previousAttempts.length + 1,
      completed_at: new Date().toISOString()
    };

    await submitMutation.mutateAsync(attemptData);
    setResult({ score, passed });
    setSubmitted(true);
    
    if (passed && onComplete) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setResult(null);
  };

  if (!quiz || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  if (submitted && result) {
    return (
      <Card className="border-slate-100">
        <CardContent className="pt-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
            result.passed ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          
          <h3 className="text-2xl font-semibold mb-2">
            {result.passed 
              ? (lang === 'es' ? '¡Felicidades!' : 'Congratulations!') 
              : (lang === 'es' ? 'Sigue intentando' : 'Keep trying')}
          </h3>
          
          <p className="text-4xl font-bold text-slate-900 mb-2">{result.score}%</p>
          <p className="text-slate-500 mb-6">
            {lang === 'es' ? 'Puntaje para aprobar:' : 'Passing score:'} {quiz.pass_threshold || 70}%
          </p>

          {!result.passed && canAttempt && previousAttempts.length < (quiz.max_attempts || 2) && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {lang === 'es' ? 'Intentar de nuevo' : 'Try again'}
            </Button>
          )}

          {quiz.show_immediate_feedback && (
            <div className="mt-8 text-left space-y-6">
              <h4 className="font-semibold text-slate-900">
                {lang === 'es' ? 'Revisión de respuestas' : 'Answer Review'}
              </h4>
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-xl">
                  <p className="font-medium mb-2">{i + 1}. {q[`question_text_${lang}`] || q.question_text_en}</p>
                  <QuizQuestion
                    question={q}
                    answer={answers[q.id]}
                    onAnswer={() => {}}
                    showFeedback={true}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (hasPassed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-emerald-900 mb-2">
            {lang === 'es' ? 'Quiz completado' : 'Quiz Completed'}
          </h3>
          <p className="text-emerald-700">
            {lang === 'es' ? 'Tu mejor puntaje:' : 'Your best score:'} {bestScore}%
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!canAttempt) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-amber-900 mb-2">
            {lang === 'es' ? 'Intentos agotados' : 'No attempts remaining'}
          </h3>
          <p className="text-amber-700">
            {lang === 'es' 
              ? `Has usado todos tus ${quiz.max_attempts} intentos. Tu mejor puntaje: ${bestScore}%` 
              : `You've used all ${quiz.max_attempts} attempts. Your best score: ${bestScore}%`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{quizTitle}</CardTitle>
          <span className="text-sm text-slate-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-1" />
        {instructions && (
          <p className="text-sm text-slate-500 mt-4">{instructions}</p>
        )}
      </CardHeader>

      <CardContent>
        <QuizQuestion
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={(ans) => handleAnswer(currentQuestion.id, ans)}
          lang={lang}
        />
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          {lang === 'es' ? 'Anterior' : 'Previous'}
        </Button>

        <div className="flex gap-2">
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={!answers[currentQuestion.id]}
            >
              {lang === 'es' ? 'Siguiente' : 'Next'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
            >
              {submitMutation.isPending 
                ? (lang === 'es' ? 'Enviando...' : 'Submitting...')
                : (lang === 'es' ? 'Enviar quiz' : 'Submit quiz')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}