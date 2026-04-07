import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Send, MessageSquare } from "lucide-react";

export default function Inbox() {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [composeMode, setComposeMode] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => setUser(u));
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user?.email }, '-created_date'),
    enabled: !!user?.email
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setReplyText('');
      setRecipient('');
      setSubject('');
      setContent('');
      setComposeMode(false);
      setSelectedMessage(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedMessage(null);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    sendMutation.mutate({
      sender_email: user?.email,
      recipient_email: selectedMessage.sender_email,
      subject: `Re: ${selectedMessage.subject}`,
      content: replyText
    });
  };

  const handleSendCompose = () => {
    if (!recipient || !subject || !content) return;
    sendMutation.mutate({
      sender_email: user?.email,
      recipient_email: recipient,
      subject,
      content
    });
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Message List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages ({unreadCount})
            </CardTitle>
            <Button size="sm" onClick={() => setComposeMode(!composeMode)}>
              <Send className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  setComposeMode(false);
                  if (!msg.read) markReadMutation.mutate(msg.id);
                }}
                className={`p-3 rounded-lg cursor-pointer ${selectedMessage?.id === msg.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'} ${!msg.read ? 'font-semibold' : ''}`}
              >
                <p className="text-sm truncate">{msg.sender_email}</p>
                <p className="text-xs text-slate-500 truncate">{msg.subject}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message View / Compose */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            {composeMode ? 'New Message' : selectedMessage ? selectedMessage.subject : 'Select a message'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {composeMode ? (
            <>
              <Input 
                placeholder="To:"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <Input 
                placeholder="Subject:"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea 
                placeholder="Message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-32"
              />
              <div className="flex gap-2">
                <Button onClick={handleSendCompose} className="flex-1">Send</Button>
                <Button onClick={() => {setComposeMode(false); setRecipient(''); setSubject(''); setContent('');}} variant="outline">Cancel</Button>
              </div>
            </>
          ) : selectedMessage ? (
            <>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold mb-2">From: {selectedMessage.sender_email}</p>
                <p className="text-sm text-slate-600">{selectedMessage.content}</p>
              </div>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="h-20"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSendReply} className="flex-1" size="sm">Reply</Button>
                  <Button onClick={() => deleteMutation.mutate(selectedMessage.id)} variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-center py-8">Select a message or create a new one</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}