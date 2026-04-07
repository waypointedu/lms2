import React from 'react';
import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StreakDisplay({ streak, lang }) {
  const text = {
    en: { days: 'day streak', best: 'Best' },
    es: { days: 'días de racha', best: 'Mejor' }
  };
  const t = text[lang];

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative">
          <Flame className={`w-10 h-10 ${streak?.current_streak > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
          {streak?.current_streak > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {streak.current_streak}
            </div>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{streak?.current_streak || 0}</div>
          <div className="text-sm text-slate-600">{t.days}</div>
          {streak?.longest_streak > 0 && (
            <div className="text-xs text-slate-500">{t.best}: {streak.longest_streak}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}