import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Award, MessageSquare, TrendingUp } from "lucide-react";

export default function QuickStats({ userProfile, userBadges, endorsements, readingSessions }) {
  const stats = [
    {
      icon: BookOpen,
      label: "Pages Read",
      value: userProfile?.total_pages_read || 0,
      color: "bg-blue-500"
    },
    {
      icon: Award,
      label: "Badges Earned",
      value: userBadges?.length || 0,
      color: "bg-purple-500"
    },
    {
      icon: MessageSquare,
      label: "Peer Endorsements",
      value: endorsements?.length || 0,
      color: "bg-green-500"
    },
    {
      icon: TrendingUp,
      label: "Reading Hours",
      value: Math.round((userProfile?.total_reading_minutes || 0) / 60),
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-md border-slate-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}