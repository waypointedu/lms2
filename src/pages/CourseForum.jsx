import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Pin, Lock, Send, ArrowLeft, User } from 'lucide-react';
import { format } from 'date-fns';
import LanguageToggle from '@/components/common/LanguageToggle';
import MobileNav from '@/components/common/MobileNav';

export default function CourseForum() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }),
    select: (data) => data[0],
    enabled: !!courseId
  });

  const { data: forums = [] } = useQuery({
    queryKey: ['forums', courseId],
    queryFn: async () => {
      const existing = await base44.entities.Forum.filter({ course_id: courseId });
      if (existing.length === 0) {
        // Auto-create announcement forum for this course
        const newForum = await base44.entities.Forum.create({
          course_id: courseId,
          title_en: 'Announcements',
          title_es: 'Anuncios',
          description_en: 'Instructor announcements and course updates',
          description_es: 'Anuncios del instructor y actualizaciones del curso'
        });
        return [newForum];
      }
      return existing;
    },
    enabled: !!courseId
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['forumPosts', courseId],
    queryFn: () => base44.entities.ForumPost.filter({ course_id: courseId }),
    select: (data) => data.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
      return new Date(b.last_reply_date || b.created_date) - new Date(a.last_reply_date || a.created_date);
    }),
    enabled: !!courseId
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts', courseId] });
      setNewPost({ title: '', content: '' });
      setShowNewPost(false);
    }
  });

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    let defaultForum = forums[0];
    if (!defaultForum) {
      // Create forum if it doesn't exist
      defaultForum = await base44.entities.Forum.create({
        course_id: courseId,
        title_en: 'General Discussion',
        title_es: 'Discusión General'
      });
      queryClient.invalidateQueries({ queryKey: ['forums', courseId] });
    }

    createPostMutation.mutate({
      forum_id: defaultForum.id,
      course_id: courseId,
      user_email: user.email,
      user_name: user.full_name || user.email,
      title: newPost.title,
      content: newPost.content,
      last_reply_date: new Date().toISOString()
    });
  };

  const text = {
    en: {
      title: 'Announcements',
      newPost: 'New Announcement',
      postTitle: 'Title',
      postContent: 'Your message...',
      submit: 'Post',
      cancel: 'Cancel',
      replies: 'replies',
      lastActivity: 'Last activity',
      noPosts: 'No announcements yet.',
      pinned: 'Pinned',
      locked: 'Locked',
      instructorOnly: 'Only instructors can create announcements'
    },
    es: {
      title: 'Anuncios',
      newPost: 'Nuevo Anuncio',
      postTitle: 'Título',
      postContent: 'Tu mensaje...',
      submit: 'Publicar',
      cancel: 'Cancelar',
      replies: 'respuestas',
      lastActivity: 'Última actividad',
      noPosts: 'Aún no hay anuncios.',
      pinned: 'Fijado',
      locked: 'Bloqueado',
      instructorOnly: 'Solo los instructores pueden crear anuncios'
    }
  };
  const t = text[lang];

  if (!user || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <Link
          to={createPageUrl(`Course?id=${courseId}&lang=${lang}`)}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {course[`title_${lang}`] || course.title_en}
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light text-slate-900">{t.title}</h1>
          {(user.role === 'admin' || user.role === 'instructor') && (
            <Button onClick={() => setShowNewPost(!showNewPost)} size="lg" className="bg-[#1e3a5f]">
              <MessageSquare className="w-5 h-5 mr-2" />
              {t.newPost}
            </Button>
          )}
        </div>

        {showNewPost && (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <Input
                placeholder={t.postTitle}
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="text-lg"
              />
              <Textarea
                placeholder={t.postContent}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={6}
                className="text-base"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                  className="bg-[#1e3a5f]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t.submit}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">{t.noPosts}</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Link key={post.id} to={createPageUrl(`ForumPost?postId=${post.id}&lang=${lang}`)}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[#1e3a5f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            {post.is_pinned && <Pin className="w-4 h-4 text-amber-600" />}
                            {post.title}
                            {post.is_locked && <Lock className="w-4 h-4 text-slate-400" />}
                          </h3>
                          <Badge variant="outline" className="shrink-0">
                            {post.reply_count || 0} {t.replies}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{post.user_name}</p>
                        <p className="text-slate-600 line-clamp-2 mb-3">{post.content}</p>
                        <div className="text-xs text-slate-400">
                          {t.lastActivity}: {format(new Date(post.last_reply_date || post.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      <MobileNav lang={lang} currentPage="Courses" />
    </div>
  );
}