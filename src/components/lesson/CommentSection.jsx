import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function CommentSection({ lessonId, user, lang }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', lessonId],
    queryFn: () => base44.entities.Comment.filter({ lesson_id: lessonId })
  });

  const createComment = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', lessonId] });
      setNewComment('');
    }
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment.mutate({
      lesson_id: lessonId,
      user_email: user.email,
      user_name: user.full_name || user.email,
      content: newComment
    });
  };

  const text = {
    en: { title: 'Discussion', placeholder: 'Share your thoughts or ask a question...', post: 'Post' },
    es: { title: 'Discusión', placeholder: 'Comparte tus ideas o haz una pregunta...', post: 'Publicar' }
  };
  const t = text[lang];

  const sortedComments = [...comments].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MessageCircle className="w-5 h-5" />
        {t.title}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.placeholder}
            rows={3}
            className="text-base"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!newComment.trim()} size="lg">
              <Send className="w-4 h-4 mr-2" />
              {t.post}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sortedComments.map(comment => (
          <Card key={comment.id} className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-slate-900">{comment.user_name}</div>
                <div className="text-xs text-slate-500">
                  {format(new Date(comment.created_date), 'MMM d, yyyy')}
                </div>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}