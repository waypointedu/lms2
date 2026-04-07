import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Trophy, Zap, Heart, Flame, Crown } from "lucide-react";

const SEED_ACHIEVEMENTS = [
  {
    title_en: "First Steps",
    title_es: "Primeros Pasos",
    description_en: "Complete your first lesson",
    description_es: "Completa tu primera lección",
    icon: "Star",
    points: 50,
    trigger_type: "first_lesson"
  },
  {
    title_en: "Quiz Master",
    title_es: "Maestro de Cuestionarios",
    description_en: "Score perfectly on a quiz",
    description_es: "Obtén una puntuación perfecta en un cuestionario",
    icon: "Trophy",
    points: 100,
    trigger_type: "perfect_quiz"
  },
  {
    title_en: "Course Completion",
    title_es: "Finalización del Curso",
    description_en: "Successfully complete an entire course",
    description_es: "Completa exitosamente un curso completo",
    icon: "Crown",
    points: 250,
    trigger_type: "course_complete"
  },
  {
    title_en: "Week Warrior",
    title_es: "Guerrero de Semana",
    description_en: "Maintain a 7-day reading streak",
    description_es: "Mantén una racha de lectura de 7 días",
    icon: "Flame",
    points: 75,
    trigger_type: "streak_7"
  },
  {
    title_en: "Dedicated Scholar",
    title_es: "Erudito Dedicado",
    description_en: "Maintain a 30-day reading streak",
    description_es: "Mantén una racha de lectura de 30 días",
    icon: "Zap",
    points: 150,
    trigger_type: "streak_30"
  }
];

const SEED_BADGES = [
  {
    title_en: "Biblical Foundation",
    title_es: "Fundación Bíblica",
    description_en: "Complete Biblical Studies courses",
    description_es: "Completa cursos de Estudios Bíblicos",
    icon: "Book",
    color: "gold",
    badge_type: "course_completion",
    xp_reward: 100,
    requirement_count: 3
  },
  {
    title_en: "Culture Scholar",
    title_es: "Erudito de Cultura",
    description_en: "Master religion and culture studies",
    description_es: "Domina estudios de religión y cultura",
    icon: "Globe",
    color: "silver",
    badge_type: "course_completion",
    xp_reward: 150,
    requirement_count: 2
  },
  {
    title_en: "Consistency Champion",
    title_es: "Campeón de Consistencia",
    description_en: "Maintain reading streaks",
    description_es: "Mantén rachas de lectura",
    icon: "Flame",
    color: "bronze",
    badge_type: "reading_streak",
    xp_reward: 75,
    requirement_count: 10
  },
  {
    title_en: "Community Builder",
    title_es: "Constructor de Comunidad",
    description_en: "Earn peer endorsements",
    description_es: "Obtén respaldos de compañeros",
    icon: "Users",
    color: "blue",
    badge_type: "peer_endorsement",
    xp_reward: 125,
    requirement_count: 5
  }
];

export default function GamificationManager() {
  const [activeTab, setActiveTab] = useState('achievements');
  const [seeded, setSeeded] = useState(false);
  const queryClient = useQueryClient();

  const { data: achievements = [], isLoading: achievLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list()
  });

  const { data: badges = [], isLoading: badgeLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list()
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      if (achievements.length === 0) {
        await base44.entities.Achievement.bulkCreate(SEED_ACHIEVEMENTS);
      }
      if (badges.length === 0) {
        await base44.entities.Badge.bulkCreate(SEED_BADGES);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setSeeded(true);
    }
  });

  useEffect(() => {
    if (!seeded && achievements.length === 0 && badges.length === 0 && !achievLoading && !badgeLoading) {
      seedMutation.mutate();
    }
  }, [achievements.length, badges.length, achievLoading, badgeLoading, seeded]);

  const items = activeTab === 'achievements' ? achievements : badges;
  const isLoading = activeTab === 'achievements' ? achievLoading : badgeLoading;

  const getIconColor = (badgeColor) => {
    const colors = {
      gold: "text-yellow-600",
      silver: "text-gray-400",
      bronze: "text-orange-600",
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600"
    };
    return colors[badgeColor] || "text-slate-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button 
          variant={activeTab === 'achievements' ? 'default' : 'outline'}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </Button>
        <Button 
          variant={activeTab === 'badges' ? 'default' : 'outline'}
          onClick={() => setActiveTab('badges')}
        >
          Badges
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === 'achievements' ? 'Achievements' : 'Badges'}</CardTitle>
          <p className="text-sm text-slate-500 mt-2">Pre-configured rewards. View only.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No {activeTab} yet</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 ${getIconColor(item.color || item.points)}`}>
                      {item.icon === 'Star' && <Star className="w-6 h-6" />}
                      {item.icon === 'Trophy' && <Trophy className="w-6 h-6" />}
                      {item.icon === 'Zap' && <Zap className="w-6 h-6" />}
                      {item.icon === 'Heart' && <Heart className="w-6 h-6" />}
                      {item.icon === 'Flame' && <Flame className="w-6 h-6" />}
                      {item.icon === 'Crown' && <Crown className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.title_en}</p>
                      <p className="text-xs text-slate-600 mt-1">{item.description_en}</p>
                      {activeTab === 'achievements' ? (
                        <p className="text-xs text-blue-600 font-medium mt-2">{item.points} XP</p>
                      ) : (
                        <p className="text-xs text-green-600 font-medium mt-2">{item.xp_reward} XP reward</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}