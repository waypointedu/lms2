import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

export default function QuizQuestion({ 
  question, 
  answer, 
  onAnswer, 
  showFeedback = false,
  lang = 'en'
}) {
  const questionText = question[`question_text_${lang}`] || question.question_text_en;

  const renderOptions = () => {
    if (question.question_type === 'multiple_choice') {
      return (
        <RadioGroup value={answer || ''} onValueChange={onAnswer} className="space-y-3">
          {question.options?.map((option, i) => {
            const optionText = option[`text_${lang}`] || option.text_en;
            const isSelected = answer === optionText;
            const showCorrect = showFeedback && option.is_correct;
            const showIncorrect = showFeedback && isSelected && !option.is_correct;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  showCorrect
                    ? 'border-emerald-200 bg-emerald-50'
                    : showIncorrect
                    ? 'border-red-200 bg-red-50'
                    : isSelected
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <RadioGroupItem value={optionText} id={`q${question.id}-o${i}`} disabled={showFeedback} />
                <Label htmlFor={`q${question.id}-o${i}`} className="flex-1 cursor-pointer">
                  {optionText}
                </Label>
                {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            );
          })}
        </RadioGroup>
      );
    }

    if (question.question_type === 'multi_select') {
      const selectedArray = Array.isArray(answer) ? answer : [];
      return (
        <div className="space-y-3">
          {question.options?.map((option, i) => {
            const optionText = option[`text_${lang}`] || option.text_en;
            const isSelected = selectedArray.includes(optionText);
            const showCorrect = showFeedback && option.is_correct;
            const showIncorrect = showFeedback && isSelected && !option.is_correct;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  showCorrect
                    ? 'border-emerald-200 bg-emerald-50'
                    : showIncorrect
                    ? 'border-red-200 bg-red-50'
                    : isSelected
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <Checkbox
                  id={`q${question.id}-o${i}`}
                  checked={isSelected}
                  disabled={showFeedback}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onAnswer([...selectedArray, optionText]);
                    } else {
                      onAnswer(selectedArray.filter(a => a !== optionText));
                    }
                  }}
                />
                <Label htmlFor={`q${question.id}-o${i}`} className="flex-1 cursor-pointer">
                  {optionText}
                </Label>
                {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            );
          })}
        </div>
      );
    }

    if (question.question_type === 'short_answer') {
      return (
        <Input
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={lang === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
          disabled={showFeedback}
          className="max-w-lg"
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-slate-900">{questionText}</p>
      {renderOptions()}
    </div>
  );
}