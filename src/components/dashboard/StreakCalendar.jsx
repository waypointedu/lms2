import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export default function StreakCalendar({ userProfile, readingSessions }) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const hasReadingOnDay = (day) => {
    return readingSessions.some(session => 
      session.qualified_as_read && isSameDay(new Date(session.session_date), day)
    );
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Reading Streak</CardTitle>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-slate-900">
              {userProfile?.reading_streak_days || 0}
            </span>
            <span className="text-sm text-slate-500">days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-400">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const hasReading = hasReadingOnDay(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = day.getMonth() === today.getMonth();
            
            return (
              <div
                key={index}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                  !isCurrentMonth
                    ? 'text-slate-300'
                    : isToday
                    ? 'bg-[#1e3a5f] text-white font-bold ring-2 ring-[#1e3a5f] ring-offset-2'
                    : hasReading
                    ? 'bg-green-500 text-white font-semibold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Current Streak</p>
            <p className="text-xl font-bold text-slate-900">{userProfile?.reading_streak_days || 0} days</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Longest Streak</p>
            <p className="text-xl font-bold text-slate-900">{userProfile?.longest_reading_streak || 0} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}