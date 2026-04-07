import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Flame, BookOpen, Star, Palette, Crown } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';
import MobileNav from '@/components/common/MobileNav';

export default function Profile() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user?.email });
      if (profiles.length > 0) return profiles[0];
      
      const newProfile = await base44.entities.UserProfile.create({
        user_email: user?.email,
        total_xp: 0,
        current_level: 1,
        reading_streak_days: 0
      });
      return newProfile;
    },
    enabled: !!user?.email
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['user-badges', user?.email],
    queryFn: async () => {
      const userBadges = await base44.entities.UserBadge.filter({ user_email: user?.email });
      const badgeIds = userBadges.map(ub => ub.badge_id);
      if (badgeIds.length === 0) return [];
      
      const allBadges = await base44.entities.Badge.list();
      return allBadges.filter(b => badgeIds.includes(b.id));
    },
    enabled: !!user?.email,
    initialData: []
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => base44.entities.Badge.list(),
    initialData: []
  });

  const updateThemeMutation = useMutation({
    mutationFn: (theme) => base44.entities.UserProfile.update(profile.id, { theme_color: theme }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const updateBorderMutation = useMutation({
    mutationFn: (border) => base44.entities.UserProfile.update(profile.id, { avatar_border: border }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const text = {
    en: {
      title: "My Profile",
      level: "Level",
      xp: "XP",
      streak: "Day Streak",
      pages_read: "Pages Read",
      minutes: "Reading Minutes",
      badges: "Badges Earned",
      my_badges: "My Badges",
      all_badges: "All Badges",
      locked: "Locked",
      customize: "Customize Profile",
      theme: "Theme Color",
      border: "Avatar Border",
      themes: {
        default: "Default",
        forest: "Forest",
        ocean: "Ocean",
        sunset: "Sunset",
        royal: "Royal"
      },
      borders: {
        none: "None",
        bronze: "Bronze",
        silver: "Silver",
        gold: "Gold",
        platinum: "Platinum"
      },
      stats_title: "Reading Stats"
    },
    es: {
      title: "Mi Perfil",
      level: "Nivel",
      xp: "XP",
      streak: "Racha de Días",
      pages_read: "Páginas Leídas",
      minutes: "Minutos de Lectura",
      badges: "Insignias Ganadas",
      my_badges: "Mis Insignias",
      all_badges: "Todas las Insignias",
      locked: "Bloqueado",
      customize: "Personalizar Perfil",
      theme: "Color del Tema",
      border: "Borde de Avatar",
      themes: {
        default: "Predeterminado",
        forest: "Bosque",
        ocean: "Océano",
        sunset: "Atardecer",
        royal: "Real"
      },
      borders: {
        none: "Ninguno",
        bronze: "Bronce",
        silver: "Plata",
        gold: "Oro",
        platinum: "Platino"
      },
      stats_title: "Estadísticas de Lectura"
    }
  };

  const t = text[lang];

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full" />
      </div>
    );
  }

  const earnedBadgeIds = badges.map(b => b.id);
  const level = profile.current_level || 1;
  const xpForNextLevel = level * 1000;
  const xpProgress = ((profile.total_xp || 0) % 1000) / 10;

  const themeColors = {
    default: 'from-slate-600 to-slate-800',
    forest: 'from-green-600 to-emerald-800',
    ocean: 'from-blue-600 to-cyan-800',
    sunset: 'from-orange-600 to-pink-800',
    royal: 'from-purple-600 to-indigo-800'
  };

  const borderColors = {
    none: 'border-slate-200',
    bronze: 'border-amber-600',
    silver: 'border-slate-400',
    gold: 'border-yellow-500',
    platinum: 'border-purple-500'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint" className="h-10" />
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      {/* Hero Card */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card className={`border-4 ${borderColors[profile.avatar_border || 'none']}`}>
          <CardContent className={`p-8 bg-gradient-to-br ${themeColors[profile.theme_color || 'default']} text-white rounded-xl`}>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                <Crown className="w-12 h-12" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{user.full_name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>{t.level} {level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{profile.total_xp || 0} {t.xp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    <span>{profile.reading_streak_days || 0} {t.streak}</span>
                  </div>
                </div>
                <div className="mt-4 bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-[#1e3a5f] mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{profile.total_pages_read || 0}</div>
              <div className="text-sm text-slate-500">{t.pages_read}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{profile.reading_streak_days || 0}</div>
              <div className="text-sm text-slate-500">{t.streak}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-[#c4933f] mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{badges.length}</div>
              <div className="text-sm text-slate-500">{t.badges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{Math.round((profile.total_reading_minutes || 0) / 60)}</div>
              <div className="text-sm text-slate-500">{t.minutes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="badges" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">{t.my_badges}</TabsTrigger>
            <TabsTrigger value="customize">{t.customize}</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {allBadges.map(badge => {
                const isEarned = earnedBadgeIds.includes(badge.id);
                const Icon = Award;
                
                return (
                  <Card key={badge.id} className={!isEarned ? 'opacity-50' : ''}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                        isEarned ? 'bg-gradient-to-br from-[#c4933f] to-[#1e3a5f]' : 'bg-slate-200'
                      }`}>
                        <Icon className={`w-8 h-8 ${isEarned ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {lang === 'es' ? badge.title_es || badge.title_en : badge.title_en}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {lang === 'es' ? badge.description_es || badge.description_en : badge.description_en}
                      </p>
                      {!isEarned && (
                        <Badge variant="outline" className="mt-2">{t.locked}</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="customize" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    {t.theme}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.keys(themeColors).map(theme => (
                      <button
                        key={theme}
                        onClick={() => updateThemeMutation.mutate(theme)}
                        className={`h-16 rounded-xl bg-gradient-to-br ${themeColors[theme]} ${
                          profile.theme_color === theme ? 'ring-4 ring-[#1e3a5f]' : ''
                        }`}
                      >
                        <span className="sr-only">{t.themes[theme]}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    {t.border}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.keys(borderColors).map(border => (
                      <button
                        key={border}
                        onClick={() => updateBorderMutation.mutate(border)}
                        className={`h-16 rounded-xl border-4 ${borderColors[border]} ${
                          profile.avatar_border === border ? 'ring-4 ring-[#1e3a5f]' : ''
                        } bg-white flex items-center justify-center`}
                      >
                        <span className="text-xs font-medium text-slate-600">{t.borders[border]}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav lang={lang} currentPage="Profile" />
    </div>
  );
}