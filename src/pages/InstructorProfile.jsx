import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, ArrowLeft } from "lucide-react";
import MobileNav from '@/components/common/MobileNav';

export default function InstructorProfile() {
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newEducation, setNewEducation] = useState({ degree: '', field: '', institution: '', year: '' });
  const [newProfDev, setNewProfDev] = useState({ type: 'paper', title: '', details: '', date: '' });
  const [profileData, setProfileData] = useState({
    bio: '',
    education: [],
    professional_development: []
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      fetchProfile(u.email);
    }).catch(() => setUser(null));
  }, []);

  const fetchProfile = async (email) => {
    const profiles = await base44.entities.InstructorProfile.filter({ instructor_email: email });
    if (profiles.length > 0) {
      setProfileData({
        ...profiles[0],
        education: profiles[0].education || [],
        professional_development: profiles[0].professional_development || []
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (profileData.id) {
        return base44.entities.InstructorProfile.update(profileData.id, profileData);
      } else {
        return base44.entities.InstructorProfile.create({
          instructor_email: user.email,
          ...profileData
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorProfile'] });
    }
  });

  const addEducation = () => {
    if (newEducation.degree && newEducation.institution) {
      setProfileData({
        ...profileData,
        education: [...profileData.education, { ...newEducation, year: parseInt(newEducation.year) || new Date().getFullYear() }]
      });
      setNewEducation({ degree: '', field: '', institution: '', year: '' });
    }
  };

  const removeEducation = (index) => {
    setProfileData({
      ...profileData,
      education: profileData.education.filter((_, i) => i !== index)
    });
  };

  const addProfDev = () => {
    if (newProfDev.title) {
      setProfileData({
        ...profileData,
        professional_development: [...profileData.professional_development, newProfDev]
      });
      setNewProfDev({ type: 'paper', title: '', details: '', date: '' });
    }
  };

  const removeProfDev = (index) => {
    setProfileData({
      ...profileData,
      professional_development: profileData.professional_development.filter((_, i) => i !== index)
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 text-slate-700 hover:text-[#1e3a5f]">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Your Profile</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="bio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bio">Biography</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="profdev">Professional Dev</TabsTrigger>
          </TabsList>

          <TabsContent value="bio">
            <Card>
              <CardHeader>
                <CardTitle>Your Biography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write a compelling biography that appears on your course pages..."
                  value={profileData.bio || ''}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="h-32"
                />
                <div className="text-sm text-slate-500">
                  This biography will appear on course pages where you teach.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Educational Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Degree</label>
                      <Input
                        placeholder="e.g., M.Div., Ph.D."
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Field of Study</label>
                      <Input
                        placeholder="e.g., Theology"
                        value={newEducation.field}
                        onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Institution</label>
                      <Input
                        placeholder="University name"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Year Completed</label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={newEducation.year}
                        onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={addEducation} className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                </div>

                <div className="space-y-2">
                  {profileData.education?.map((edu, i) => (
                    <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{edu.degree} in {edu.field}</p>
                        <p className="text-sm text-slate-600">{edu.institution} • {edu.year}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeEducation(i)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profdev">
            <Card>
              <CardHeader>
                <CardTitle>Professional Development</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Type</label>
                    <select
                      value={newProfDev.type}
                      onChange={(e) => setNewProfDev({ ...newProfDev, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="paper">Paper/Publication</option>
                      <option value="conference_presentation">Conference Presentation</option>
                      <option value="conference_attendance">Conference Attendance</option>
                      <option value="research">Research</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Title</label>
                    <Input
                      placeholder="Title of paper, presentation, etc."
                      value={newProfDev.title}
                      onChange={(e) => setNewProfDev({ ...newProfDev, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Details</label>
                    <Textarea
                      placeholder="Where published, venue, publication details..."
                      value={newProfDev.details}
                      onChange={(e) => setNewProfDev({ ...newProfDev, details: e.target.value })}
                      className="h-20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Date</label>
                    <Input
                      type="date"
                      value={newProfDev.date}
                      onChange={(e) => setNewProfDev({ ...newProfDev, date: e.target.value })}
                    />
                  </div>
                  <Button onClick={addProfDev} className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </div>

                <div className="space-y-2">
                  {profileData.professional_development?.map((pd, i) => (
                    <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{pd.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{pd.type.replace('_', ' ')} • {pd.date}</p>
                        {pd.details && <p className="text-sm text-slate-600 mt-1">{pd.details}</p>}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeProfDev(i)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
            size="lg"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      <MobileNav lang="en" currentPage="InstructorProfile" />
    </div>
  );
}