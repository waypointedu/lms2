import React from 'react';
import { Award, Star, Trophy, Flame, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  Award, Star, Trophy, Flame, Target, Zap
};

const colorMap = {
  blue: 'bg-blue-100 text-blue-600 border-blue-300',
  green: 'bg-green-100 text-green-600 border-green-300',
  purple: 'bg-purple-100 text-purple-600 border-purple-300',
  gold: 'bg-amber-100 text-amber-600 border-amber-300',
  red: 'bg-red-100 text-red-600 border-red-300'
};

export default function AchievementBadge({ achievement, size = 'md', showPoints = false }) {
  const Icon = iconMap[achievement.icon] || Award;
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className={`${sizeClasses} rounded-full border-2 ${colorMap[achievement.badge_color]} flex items-center justify-center`}>
        <Icon className={iconSize} />
      </div>
      {showPoints && (
        <div className="text-xs font-semibold text-slate-600">+{achievement.points} pts</div>
      )}
    </motion.div>
  );
}