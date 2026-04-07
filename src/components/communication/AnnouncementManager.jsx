import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Send } from "lucide-react";

export default function AnnouncementManager() {
  const [formData, setFormData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create({
      ...data,
      created_by: 'admin@waypoint.edu'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setFormData(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setFormData(null);
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  });

  const handleSubmit = () => {
    if (!formData?.title || !formData?.content) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      target_audience: 'all',
      priority: 'normal',
      published: false
    });
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData(announcement);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{announcement.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {announcement.target_audience} • {announcement.priority} priority
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${announcement.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {announcement.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 mb-3">{announcement.content}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(announcement)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(announcement.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData ? (
              <>
                <Input 
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                <Textarea 
                  placeholder="Content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="h-24"
                />
                <Select value={formData.target_audience} onValueChange={(val) => setFormData({...formData, target_audience: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="instructors">Instructors</SelectItem>
                    <SelectItem value="admins">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({...formData, published: checked})}
                  />
                  <label className="text-sm">Publish immediately</label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} className="flex-1" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    {editingId ? 'Update' : 'Post'}
                  </Button>
                  <Button onClick={() => {setFormData(null); setEditingId(null);}} variant="outline" size="sm">Cancel</Button>
                </div>
              </>
            ) : (
              <Button onClick={handleNew} className="w-full">Create New</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}