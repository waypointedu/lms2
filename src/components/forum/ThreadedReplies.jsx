import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2 } from 'lucide-react';

const MAX_DEPTH = 4;

function ReplyNode({ reply, allReplies, user, isInstructor, lang, nestedReplyingTo, setNestedReplyingTo, nestedReplyTexts, setNestedReplyTexts, onSubmitNestedReply, onDeleteReply, onUpdateReply, depth = 0 }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);

  const children = allReplies
    .filter(r => r.parent_id === reply.id)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const isReplying = nestedReplyingTo === reply.id;
  const canReply = user && depth < MAX_DEPTH;
  const canEdit = user && reply.user_email === user.email;
  const canDelete = user && (reply.user_email === user.email || isInstructor);

  return (
    <div className={depth > 0 ? 'pl-4 border-l-2 border-slate-100 mt-2 space-y-2' : ''}>
      <div className="flex items-start gap-2">
        <div
          className="rounded-full flex items-center justify-center font-semibold flex-shrink-0 text-white"
          style={{
            width: `${Math.max(24, 32 - depth * 2)}px`,
            height: `${Math.max(24, 32 - depth * 2)}px`,
            fontSize: depth > 1 ? '10px' : '12px',
            backgroundColor: depth === 0 ? '#334155' : '#64748b'
          }}
        >
          {(reply.user_name || reply.user_email)?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className={`font-medium text-slate-900 ${depth > 0 ? 'text-xs' : 'text-sm'}`}>{reply.user_name || reply.user_email?.split('@')[0]}</p>
              <span className="text-xs text-slate-400">{new Date(reply.created_date).toLocaleDateString()}</span>
            </div>
            {(canEdit || canDelete) && !editing && (
              <div className="flex gap-1">
                {canEdit && (
                  <button
                    onClick={() => { setEditing(true); setEditText(reply.content); }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      if (confirm(lang === 'es' ? '¿Eliminar respuesta?' : 'Delete this reply?')) {
                        onDeleteReply(reply.id);
                      }
                    }}
                    className="p-1 text-red-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="mb-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => { onUpdateReply(reply.id, editText); setEditing(false); }}
                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                  disabled={!editText.trim()}
                >
                  {lang === 'es' ? 'Guardar' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <p className={`text-slate-600 ${depth > 0 ? 'text-xs' : 'text-sm'}`}>{reply.content}</p>
          )}

          {canReply && !editing && (
            <button
              onClick={() => setNestedReplyingTo(isReplying ? null : reply.id)}
              className="text-xs text-[#1e3a5f] hover:underline mt-1"
            >
              {lang === 'es' ? 'Responder' : 'Reply'}
            </button>
          )}

          {isReplying && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={nestedReplyTexts[reply.id] || ''}
                onChange={(e) => setNestedReplyTexts(prev => ({ ...prev, [reply.id]: e.target.value }))}
                placeholder={`@${reply.user_name || reply.user_email?.split('@')[0]}: ...`}
                rows={2}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onSubmitNestedReply(reply)}
                  disabled={!nestedReplyTexts[reply.id]?.trim()}
                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
                >
                  {lang === 'es' ? 'Enviar' : 'Send'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setNestedReplyingTo(null)}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}

          {children.map(child => (
            <ReplyNode
              key={child.id}
              reply={child}
              allReplies={allReplies}
              user={user}
              isInstructor={isInstructor}
              lang={lang}
              nestedReplyingTo={nestedReplyingTo}
              setNestedReplyingTo={setNestedReplyingTo}
              nestedReplyTexts={nestedReplyTexts}
              setNestedReplyTexts={setNestedReplyTexts}
              onSubmitNestedReply={onSubmitNestedReply}
              onDeleteReply={onDeleteReply}
              onUpdateReply={onUpdateReply}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ThreadedReplies({ postId, allReplies, user, isInstructor, lang, nestedReplyingTo, setNestedReplyingTo, nestedReplyTexts, setNestedReplyTexts, onSubmitNestedReply, onDeleteReply, onUpdateReply }) {
  const topLevel = allReplies
    .filter(r => r.post_id === postId && !r.parent_id)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (topLevel.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-200">
      {topLevel.map(reply => (
        <ReplyNode
          key={reply.id}
          reply={reply}
          allReplies={allReplies}
          user={user}
          isInstructor={isInstructor}
          lang={lang}
          nestedReplyingTo={nestedReplyingTo}
          setNestedReplyingTo={setNestedReplyingTo}
          nestedReplyTexts={nestedReplyTexts}
          setNestedReplyTexts={setNestedReplyTexts}
          onSubmitNestedReply={onSubmitNestedReply}
          onDeleteReply={onDeleteReply}
          onUpdateReply={onUpdateReply}
          depth={0}
        />
      ))}
    </div>
  );
}