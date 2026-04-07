import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function ReadingTracker({ weekId, courseId, userEmail }) {
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!weekId || !courseId || !userEmail) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrolled / pageHeight) * 100;
      maxScroll.current = Math.max(maxScroll.current, scrollPercent);
    };

    const logSession = async () => {
      if (hasLogged.current) return;
      hasLogged.current = true;

      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      const scrollPercentage = Math.min(maxScroll.current, 100);
      
      const qualifiedAsRead = timeSpent >= 300 && scrollPercentage >= 70;

      try {
        const today = new Date().toISOString().split('T')[0];
        
        await base44.entities.ReadingSession.create({
          user_email: userEmail,
          week_id: weekId,
          course_id: courseId,
          time_spent_seconds: timeSpent,
          scroll_percentage: scrollPercentage,
          session_date: today,
          qualified_as_read: qualifiedAsRead
        });

        if (qualifiedAsRead) {
          const profiles = await base44.entities.UserProfile.filter({ user_email: userEmail });
          if (profiles.length > 0) {
            const profile = profiles[0];
            const lastReadDate = profile.last_reading_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = 1;
            if (lastReadDate === yesterdayStr) {
              newStreak = (profile.reading_streak_days || 0) + 1;
            } else if (lastReadDate === today) {
              newStreak = profile.reading_streak_days || 1;
            }

            const estimatedPages = Math.floor(timeSpent / 120);

            await base44.entities.UserProfile.update(profile.id, {
              reading_streak_days: newStreak,
              longest_reading_streak: Math.max(newStreak, profile.longest_reading_streak || 0),
              last_reading_date: today,
              total_pages_read: (profile.total_pages_read || 0) + estimatedPages,
              total_reading_minutes: (profile.total_reading_minutes || 0) + Math.floor(timeSpent / 60),
              total_xp: (profile.total_xp || 0) + 50
            });
          }
        }
      } catch (error) {
        console.error('Failed to log reading session:', error);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', logSession);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', logSession);
      logSession();
    };
  }, [weekId, courseId, userEmail]);

  return null;
}