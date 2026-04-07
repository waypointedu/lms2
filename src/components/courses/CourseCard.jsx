import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Clock, BookOpen, ArrowRight, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProgressBar from '@/components/common/ProgressBar';

export default function CourseCard({ course, lang = 'en', progress = 0, enrolled = false, courseInstanceId = null }) {
  const title = course[`title_${lang}`] || course.title_en;
  const description = course[`description_${lang}`] || course.description_en;
  
  const languageMap = {
    en: 'EN',
    es: 'ES',
    ps: 'PS',
    fa: 'FA',
    km: 'KM'
  };
  
  const availableLanguages = course.language_availability || ['en'];

  // If enrolled and has instance ID, go to CourseView, otherwise go to Course details
  const linkUrl = enrolled && courseInstanceId
    ? `CourseView?id=${course.id}&courseInstanceId=${courseInstanceId}&lang=${lang}`
    : `Course?id=${course.id}&lang=${lang}`;

  return (
    <Link
      to={createPageUrl(linkUrl)}
      className="group block"
    >
      <article className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300">
        {course.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={course.cover_image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/40" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1 mr-2">
              <Globe className="w-3 h-3 text-slate-500" />
              {availableLanguages.map((l, i) => (
                <Badge key={i} variant="outline" className="text-xs px-1.5 py-0 border-slate-300">
                  {languageMap[l]}
                </Badge>
              ))}
            </div>
            {course.tags?.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-600 font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#1e3a5f] transition-colors line-clamp-2">
            {title}
          </h3>

          <p className="text-slate-500 text-sm mb-4 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            {course.duration_weeks && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {course.duration_weeks} {lang === 'es' ? 'semanas' : 'weeks'}
              </span>
            )}
            {course.credits && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {course.credits} {lang === 'es' ? 'créditos' : 'credits'}
              </span>
            )}
          </div>

          {enrolled && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">
                  {lang === 'es' ? 'Progreso' : 'Progress'}
                </span>
                <span className="font-medium text-slate-700">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          <div className="flex items-center text-[#1e3a5f] font-medium text-sm group-hover:gap-2 transition-all">
            <span>{lang === 'es' ? 'Ver curso' : 'View course'}</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}