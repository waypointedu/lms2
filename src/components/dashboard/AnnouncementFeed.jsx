import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, AlertCircle } from "lucide-react";
import { format } from 'date-fns';

export default function AnnouncementFeed({ user, lang = 'en' }) {
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements', 'published'],
    queryFn: async () => {
      const all = await base44.entities.Announcement.filter({ published: true });
      
      // Filter by user role
      const userRole = user.user_type || user.role || 'user';
      const filtered = all.filter(a => {
        if (a.target_audience === 'all') return true;
        if (a.target_audience === 'students' && !['instructor', 'admin'].includes(userRole)) return true;
        if (a.target_audience === 'instructors' && userRole === 'instructor') return true;
        if (a.target_audience === 'admins' && userRole === 'admin') return true;
        return false;
      });
      
      return filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);
    },
    enabled: !!user
  });

  if (announcements.length === 0) {
    return null;
  }

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700'
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#1e3a5f]" />
          <CardTitle className="text-xl">
            {lang === 'es' ? 'Anuncios' : 'Announcements'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {announcements.map(announcement => (
            <div key={announcement.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
                <Badge className={priorityColors[announcement.priority]}>
                  {announcement.priority}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 line-clamp-3 mb-2">{announcement.content}</p>
              <p className="text-xs text-slate-400">
                {format(new Date(announcement.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}