import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, Circle, Clock, FileText, PlayCircle } from "lucide-react";

export default function ModuleAccordion({ 
  modules, 
  lessons, 
  completedLessons = [], 
  lang = 'en',
  courseId 
}) {
  const getLessonsForModule = (moduleId) => {
    return lessons
      .filter(l => l.module_id === moduleId)
      .sort((a, b) => a.order_index - b.order_index);
  };

  const getModuleProgress = (moduleId) => {
    const moduleLessons = getLessonsForModule(moduleId);
    if (moduleLessons.length === 0) return 0;
    const completed = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  return (
    <Accordion type="single" collapsible className="space-y-3">
      {modules.map((module, index) => {
        const moduleTitle = module[`title_${lang}`] || module.title_en;
        const moduleLessons = getLessonsForModule(module.id);
        const progress = getModuleProgress(module.id);

        return (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border border-slate-100 rounded-xl overflow-hidden bg-white"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4 text-left w-full pr-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                  <span className="text-[#1e3a5f] font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">{moduleTitle}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{moduleLessons.length} {lang === 'es' ? 'lecciones' : 'lessons'}</span>
                    {module.estimated_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {module.estimated_hours}h
                      </span>
                    )}
                    {progress > 0 && (
                      <span className="text-[#1e3a5f] font-medium">{progress}%</span>
                    )}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="ml-14 space-y-1">
                {moduleLessons.map((lesson) => {
                  const lessonTitle = lesson[`title_${lang}`] || lesson.title_en;
                  const isCompleted = completedLessons.includes(lesson.id);

                  return (
                    <Link
                      key={lesson.id}
                      to={createPageUrl(`Lesson?id=${lesson.id}&lang=${lang}`)}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-slate-400" />
                      )}
                      <span className={`flex-1 ${isCompleted ? 'text-slate-500' : 'text-slate-700'}`}>
                        {lessonTitle}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400">
                        {lesson.video_url && <PlayCircle className="w-4 h-4" />}
                        {lesson.estimated_minutes && (
                          <span className="text-xs">{lesson.estimated_minutes} min</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}