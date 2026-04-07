import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight, FileText, BookOpen, MessageSquare, ClipboardCheck, FileEdit } from 'lucide-react';

export default function CourseNav({ course, weeks, currentWeekId, lang }) {
  const [expandedWeeks, setExpandedWeeks] = useState([currentWeekId]);

  const toggleWeek = (weekId) => {
    setExpandedWeeks(prev =>
      prev.includes(weekId) ? prev.filter(id => id !== weekId) : [...prev, weekId]
    );
  };

  const text = {
    en: {
      overview: 'Overview',
      lesson: 'Lesson',
      reading: 'Reading',
      discussion: 'Discussion',
      quiz: 'Quiz',
      written: 'Written Assignment',
      week: 'Week'
    },
    es: {
      overview: 'Descripción',
      lesson: 'Lección',
      reading: 'Lectura',
      discussion: 'Discusión',
      quiz: 'Quiz',
      written: 'Tarea Escrita',
      week: 'Semana'
    }
  };

  const t = text[lang];

  return (
    <div className="w-64 bg-white border-r border-slate-200 fixed left-0 top-16 bottom-0 overflow-y-auto hidden lg:block">
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-4 truncate">
          {course[`title_${lang}`] || course.title_en}
        </h3>
        
        <div className="space-y-1">
          {weeks.map(week => {
            const isExpanded = expandedWeeks.includes(week.id);
            const weekTitle = week[`title_${lang}`] || week.title_en;
            
            return (
              <div key={week.id}>
                <button
                  onClick={() => toggleWeek(week.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentWeekId === week.id
                      ? 'bg-[#1e3a5f] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{t.week} {week.week_number}</span>
                </button>
                
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      to={createPageUrl(`Week?id=${week.id}&lang=${lang}#overview`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t.overview}
                    </Link>
                    
                    <Link
                      to={createPageUrl(`Week?id=${week.id}&lang=${lang}#lesson`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {t.lesson}
                    </Link>
                    
                    {week.reading_assignment_en && (
                      <Link
                        to={createPageUrl(`Week?id=${week.id}&lang=${lang}#reading`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {t.reading}
                      </Link>
                    )}
                    
                    {week.has_discussion && (
                      <Link
                        to={createPageUrl(`Week?id=${week.id}&lang=${lang}#discussion`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t.discussion}
                      </Link>
                    )}
                    
                    {week.has_quiz && (
                      <Link
                        to={createPageUrl(`Week?id=${week.id}&lang=${lang}#quiz`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {t.quiz}
                      </Link>
                    )}
                    
                    {week.has_written_assignment && (
                      <Link
                        to={createPageUrl(`Week?id=${week.id}&lang=${lang}#written`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        {t.written}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}