import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trophy, Target } from 'lucide-react';
import AchievementBadge from '@/components/gamification/AchievementBadge';
import StreakDisplay from '@/components/gamification/StreakDisplay';
import LanguageToggle from '@/components/common/LanguageToggle';
import MobileNav from '@/components/common/MobileNav';

export default function Achievements() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list()
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', user?.email],
    queryFn: () => base44.entities.UserAchievement.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.email],
    queryFn: async () => {
      const streaks = await base44.entities.Streak.filter({ user_email: user?.email });
      return streaks[0];
    },
    enabled: !!user?.email
  });

  const earnedIds = userAchievements.map(ua => ua.achievement_id);
  const earnedAchievements = achievements.filter(a => earnedIds.includes(a.id));
  const unearnedAchievements = achievements.filter(a => !earnedIds.includes(a.id));

  const text = {
    en: {
      title: 'Your Achievements',
      points: 'Total Points',
      earned: 'Earned',
      locked: 'Locked',
      streak: 'Current Streak'
    },
    es: {
      title: 'Tus Logros',
      points: 'Puntos Totales',
      earned: 'Obtenidos',
      locked: 'Bloqueados',
      streak: 'Racha Actual'
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
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
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

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-slate-900 mb-8">{t.title}</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <Trophy className="w-12 h-12" />
              <div>
                <div className="text-3xl font-bold">{streak?.total_points || 0}</div>
                <div className="text-sm opacity-90">{t.points}</div>
              </div>
            </CardContent>
          </Card>

          <StreakDisplay streak={streak} lang={lang} />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-600" />
              {t.earned} ({earnedAchievements.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {earnedAchievements.map(achievement => (
                <Card key={achievement.id}>
                  <CardContent className="p-6 flex flex-col items-center gap-3">
                    <AchievementBadge achievement={achievement} size="lg" showPoints />
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">{achievement[`title_${lang}`] || achievement.title_en}</div>
                      <div className="text-xs text-slate-500 mt-1">{achievement[`description_${lang}`] || achievement.description_en}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-400" />
              {t.locked} ({unearnedAchievements.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unearnedAchievements.map(achievement => (
                <Card key={achievement.id} className="opacity-50">
                  <CardContent className="p-6 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                      <Target className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-600">{achievement[`title_${lang}`] || achievement.title_en}</div>
                      <div className="text-xs text-slate-500 mt-1">+{achievement.points} pts</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileNav lang={lang} currentPage="Achievements" />
    </div>
  );
}