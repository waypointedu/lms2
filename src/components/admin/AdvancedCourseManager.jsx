import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Copy, Archive, FileText } from "lucide-react";

export default function AdvancedCourseManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [showVersions, setShowVersions] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.CourseTemplate.list()
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', showVersions],
    queryFn: () => base44.entities.CourseContentVersion.filter({ course_id: showVersions }),
    enabled: !!showVersions
  });

  const batchUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }) => 
      Promise.all(ids.map(id => base44.entities.Course.update(id, updates))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setSelectedCourses(new Set());
    }
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const template = templates.find(t => t.id === templateId);
      return base44.entities.Course.create({
        title_en: `${template.name} - Copy`,
        status: 'draft',
        description_en: template.description || '',
        language_availability: ['en']
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const revertVersionMutation = useMutation({
    mutationFn: async (versionId) => {
      const version = versions.find(v => v.id === versionId);
      await base44.entities.Course.update(version.course_id, version.course_snapshot);
      await base44.entities.CourseContentVersion.update(versionId, { is_current: true });
      queryClient.invalidateQueries({ queryKey: ['courses', 'versions'] });
    }
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title_en.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedCourses.size === filteredCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(filteredCourses.map(c => c.id)));
    }
  };

  const handleBatchAction = (action) => {
    const ids = Array.from(selectedCourses);
    if (action === 'publish') {
      batchUpdateMutation.mutate({ ids, updates: { status: 'published' } });
    } else if (action === 'archive') {
      batchUpdateMutation.mutate({ ids, updates: { status: 'archived' } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedCourses.size > 0 && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{selectedCourses.size} courses selected</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBatchAction('publish')}>Publish</Button>
                <Button size="sm" variant="outline" onClick={() => handleBatchAction('archive')}>Archive</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Checkbox checked={selectedCourses.size === filteredCourses.length} onChange={handleSelectAll} />
            Courses ({filteredCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCourses.map(course => (
              <div key={course.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Checkbox 
                  checked={selectedCourses.has(course.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedCourses);
                    if (e.target.checked) newSet.add(course.id);
                    else newSet.delete(course.id);
                    setSelectedCourses(newSet);
                  }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{course.title_en}</p>
                  <p className="text-xs text-slate-500">{course.status}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowVersions(course.id)}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {templates.map(template => (
              <div key={template.id} className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-sm mb-2">{template.name}</p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => createFromTemplateMutation.mutate(template.id)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      {showVersions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map(version => (
                <div key={version.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">v{version.version_number}</p>
                    <p className="text-xs text-slate-500">{version.change_summary}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => revertVersionMutation.mutate(version.id)}
                    disabled={version.is_current}
                  >
                    {version.is_current ? 'Current' : 'Revert'}
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setShowVersions(null)}>Close</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}