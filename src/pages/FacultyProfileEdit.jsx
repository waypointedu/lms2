import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save, ChevronUp, ChevronDown, Pencil, Check, X } from "lucide-react";

export default function FacultyProfileEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(null);

  // New item draft states
  const [newCourse, setNewCourse] = useState({ category: '', title: '' });
  const [newSeminar, setNewSeminar] = useState('');
  const [newResearch, setNewResearch] = useState('');
  const [newEducation, setNewEducation] = useState({ degree: '', institution: '', year: '', note: '', dissertation: '' });
  const [newBook, setNewBook] = useState({ title: '', note: '' });
  const [newLecture, setNewLecture] = useState({ title: '', venue: '', url: '' });

  // Editing states — key: index, value: draft object
  const [editingIdx, setEditingIdx] = useState({}); // { 'education-0': {...} }

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u.role !== 'admin' && u.email !== targetEmail) {
        navigate(`/FacultyProfile?email=${encodeURIComponent(targetEmail)}`);
      }
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, [targetEmail]);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['facultyProfileEdit', targetEmail],
    queryFn: () => base44.entities.InstructorProfile.filter({ instructor_email: targetEmail }),
    enabled: !!targetEmail
  });

  useEffect(() => {
    if (profiles.length > 0 && !form) {
      const p = profiles[0];
      setForm({
        id: p.id,
        instructor_email: p.instructor_email,
        display_name: p.display_name || '',
        title: p.title || '',
        photo_url: p.photo_url || '',
        positioning_sentence: p.positioning_sentence || '',
        overview: p.overview || '',
        faculty_type: p.faculty_type || 'contributing',
        is_published: p.is_published !== false,
        education: (p.education || []).map(edu => ({ ...edu, year: edu.year !== undefined && edu.year !== null ? String(edu.year) : '' })),
        courses_taught: p.courses_taught || [],
        seminars: p.seminars || [],
        research_areas: p.research_areas || [],
        books: p.books || [],
        lectures: p.lectures || [],
      });
    } else if (profiles.length === 0 && !isLoading && !form && targetEmail) {
      setForm({
        instructor_email: targetEmail,
        display_name: '',
        title: '',
        photo_url: '',
        positioning_sentence: '',
        overview: '',
        faculty_type: 'contributing',
        is_published: true,
        education: [],
        courses_taught: [],
        seminars: [],
        research_areas: [],
        books: [],
        lectures: [],
      });
    }
  }, [profiles, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        instructor_email: form.instructor_email,
        display_name: form.display_name,
        title: form.title,
        photo_url: form.photo_url,
        positioning_sentence: form.positioning_sentence,
        overview: form.overview,
        faculty_type: form.faculty_type,
        is_published: form.is_published,
        education: (form.education || []).map(edu => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          year: edu.year ? String(edu.year) : '',
          note: edu.note || '',
          dissertation: edu.dissertation || '',
        })),
        courses_taught: form.courses_taught || [],
        seminars: form.seminars || [],
        research_areas: form.research_areas || [],
        books: form.books || [],
        lectures: form.lectures || [],
      };
      if (form.id) return base44.entities.InstructorProfile.update(form.id, data);
      return base44.entities.InstructorProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facultyProfile', targetEmail] });
      queryClient.invalidateQueries({ queryKey: ['facultyProfiles'] });
      navigate(`/FacultyProfile?email=${encodeURIComponent(targetEmail)}`);
    }
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Array helpers
  const addToArray = (key, item) => setForm(f => ({ ...f, [key]: [...(f[key] || []), item] }));
  const removeFromArray = (key, index) => setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  const updateInArray = (key, index, item) => setForm(f => {
    const arr = [...f[key]];
    arr[index] = item;
    return { ...f, [key]: arr };
  });
  const moveInArray = (key, index, direction) => setForm(f => {
    const arr = [...f[key]];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return f;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    return { ...f, [key]: arr };
  });

  // Edit helpers
  const startEdit = (section, index, draft) => setEditingIdx(s => ({ ...s, [`${section}-${index}`]: draft }));
  const cancelEdit = (section, index) => setEditingIdx(s => { const n = { ...s }; delete n[`${section}-${index}`]; return n; });
  const getDraft = (section, index) => editingIdx[`${section}-${index}`];
  const setDraft = (section, index, val) => setEditingIdx(s => ({ ...s, [`${section}-${index}`]: val }));
  const commitEdit = (section, index) => {
    const draft = getDraft(section, index);
    if (draft !== undefined) {
      updateInArray(section, index, draft);
      cancelEdit(section, index);
    }
  };

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={`/FacultyProfile?email=${encodeURIComponent(targetEmail)}`}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="font-semibold text-slate-900">Edit Faculty Profile</h1>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            size="sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Basic Info */}
        <Section title="Basic Information">
          <Field label="Display Name">
            <Input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="e.g. Michael C. Barros" />
          </Field>
          <Field label="Title (core faculty only)">
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Scholar of Religion & Culture" />
          </Field>
          <Field label="Photo URL">
            <Input value={form.photo_url} onChange={e => set('photo_url', e.target.value)} placeholder="https://..." />
            {form.photo_url && (
              <img src={form.photo_url} alt="Preview" className="w-20 h-20 rounded-full object-cover mt-2 ring-2 ring-slate-200" />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Faculty Type">
              <select
                value={form.faculty_type}
                onChange={e => set('faculty_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="core">Core</option>
                <option value="contributing">Contributing</option>
              </select>
            </Field>
            <Field label="Published">
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={e => set('is_published', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_published" className="text-sm text-slate-600">Visible on Faculty page</label>
              </div>
            </Field>
          </div>
        </Section>

        {/* Narrative */}
        <Section title="Narrative">
          <Field label="Positioning Sentence">
            <Textarea
              value={form.positioning_sentence}
              onChange={e => set('positioning_sentence', e.target.value)}
              placeholder="One-sentence research positioning shown in profile hero..."
              className="h-16"
            />
          </Field>
          <Field label="Biographical Overview">
            <Textarea
              value={form.overview}
              onChange={e => set('overview', e.target.value)}
              placeholder="5–7 sentences, narrative not résumé..."
              className="h-36"
            />
          </Field>
        </Section>

        {/* Education */}
        <Section title="Education">
          <div className="space-y-2 mb-4">
            {form.education.map((edu, i) => {
              const draft = getDraft('education', i);
              if (draft !== undefined) {
                return (
                  <div key={i} className="bg-slate-50 border border-blue-200 rounded-lg px-3 py-3 space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Degree" value={draft.degree} onChange={e => setDraft('education', i, { ...draft, degree: e.target.value })} className="flex-1" />
                      <Input placeholder="Note (e.g. ABD)" value={draft.note || ''} onChange={e => setDraft('education', i, { ...draft, note: e.target.value })} className="w-32 flex-shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Institution" value={draft.institution} onChange={e => setDraft('education', i, { ...draft, institution: e.target.value })} className="flex-1" />
                      <Input placeholder="Year" value={draft.year || ''} onChange={e => setDraft('education', i, { ...draft, year: e.target.value })} className="w-24 flex-shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Dissertation title (optional)" value={draft.dissertation || ''} onChange={e => setDraft('education', i, { ...draft, dissertation: e.target.value })} className="flex-1" />
                      <button onClick={() => commitEdit('education', i)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => cancelEdit('education', i)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                    <button onClick={() => moveInArray('education', i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveInArray('education', i, 1)} disabled={i === form.education.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium">
                      {edu.degree}{edu.note ? <span className="font-normal text-slate-400 ml-1 italic">({edu.note})</span> : null}
                    </p>
                    <p className="text-xs text-slate-500">{edu.institution}{edu.year ? `, ${edu.year}` : ''}</p>
                    {edu.dissertation ? <p className="text-xs text-slate-400 italic mt-0.5">Diss: {edu.dissertation}</p> : null}
                  </div>
                  <button onClick={() => startEdit('education', i, { ...edu })} className="text-slate-300 hover:text-blue-400 mt-0.5"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFromArray('education', i)} className="text-slate-300 hover:text-red-400 mt-0.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Add New</p>
            <div className="flex gap-2">
              <Input placeholder="Degree (e.g. M.A. in Theology)" value={newEducation.degree} onChange={e => setNewEducation(v => ({ ...v, degree: e.target.value }))} className="flex-1" />
              <Input placeholder="Note (e.g. ABD)" value={newEducation.note} onChange={e => setNewEducation(v => ({ ...v, note: e.target.value }))} className="w-32 flex-shrink-0" />
            </div>
            <div className="flex gap-2">
              <Input placeholder="Institution" value={newEducation.institution} onChange={e => setNewEducation(v => ({ ...v, institution: e.target.value }))} className="flex-1" />
              <Input placeholder="Year (e.g. 2018 or current)" value={newEducation.year} onChange={e => setNewEducation(v => ({ ...v, year: e.target.value }))} className="w-40 flex-shrink-0" />
            </div>
            <div className="flex gap-2">
              <Input placeholder="Dissertation title (optional)" value={newEducation.dissertation} onChange={e => setNewEducation(v => ({ ...v, dissertation: e.target.value }))} className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => {
                if (newEducation.degree && newEducation.institution) {
                  addToArray('education', { ...newEducation });
                  setNewEducation({ degree: '', institution: '', year: '', note: '', dissertation: '' });
                }
              }}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        </Section>

        {/* Courses */}
        <Section title="Courses Taught">
          <div className="space-y-2 mb-4">
            {form.courses_taught.map((c, i) => {
              const draft = getDraft('courses_taught', i);
              if (draft !== undefined) {
                return (
                  <div key={i} className="flex gap-2 bg-slate-50 border border-blue-200 rounded-lg px-3 py-2 items-center">
                    <Input placeholder="Category" value={draft.category || ''} onChange={e => setDraft('courses_taught', i, { ...draft, category: e.target.value })} className="w-36 flex-shrink-0" />
                    <Input placeholder="Course title" value={draft.title} onChange={e => setDraft('courses_taught', i, { ...draft, title: e.target.value })} className="flex-1" />
                    <button onClick={() => commitEdit('courses_taught', i)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => cancelEdit('courses_taught', i)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveInArray('courses_taught', i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveInArray('courses_taught', i, 1)} disabled={i === form.courses_taught.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="text-xs text-slate-400 w-24 flex-shrink-0">{c.category}</span>
                  <span className="text-sm text-slate-800 flex-1">{c.title}</span>
                  <button onClick={() => startEdit('courses_taught', i, { ...c })} className="text-slate-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFromArray('courses_taught', i)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <Input placeholder="Category (e.g. Core Formation)" value={newCourse.category} onChange={e => setNewCourse(v => ({ ...v, category: e.target.value }))} className="w-40 flex-shrink-0" />
            <Input placeholder="Course title" value={newCourse.title} onChange={e => setNewCourse(v => ({ ...v, title: e.target.value }))} />
            <Button variant="outline" size="sm" onClick={() => {
              if (newCourse.title) { addToArray('courses_taught', { ...newCourse }); setNewCourse({ category: '', title: '' }); }
            }}><Plus className="w-4 h-4" /></Button>
          </div>
        </Section>

        {/* Seminars */}
        <Section title="Seminars & Intensives">
          <div className="space-y-2 mb-4">
            {form.seminars.map((s, i) => {
              const draft = getDraft('seminars', i);
              if (draft !== undefined) {
                return (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 border border-blue-200 rounded-lg px-3 py-2">
                    <Input value={draft} onChange={e => setDraft('seminars', i, e.target.value)} className="flex-1" />
                    <button onClick={() => commitEdit('seminars', i)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => cancelEdit('seminars', i)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveInArray('seminars', i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveInArray('seminars', i, 1)} disabled={i === form.seminars.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="text-sm text-slate-800 flex-1">{s}</span>
                  <button onClick={() => startEdit('seminars', i, s)} className="text-slate-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFromArray('seminars', i)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <Input placeholder="Seminar name" value={newSeminar} onChange={e => setNewSeminar(e.target.value)} />
            <Button variant="outline" size="sm" onClick={() => {
              if (newSeminar) { addToArray('seminars', newSeminar); setNewSeminar(''); }
            }}><Plus className="w-4 h-4" /></Button>
          </div>
        </Section>

        {/* Research Areas */}
        <Section title="Research Areas">
          <div className="space-y-2 mb-4">
            {form.research_areas.map((r, i) => {
              const draft = getDraft('research_areas', i);
              if (draft !== undefined) {
                return (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 border border-blue-200 rounded-lg px-3 py-2">
                    <Input value={draft} onChange={e => setDraft('research_areas', i, e.target.value)} className="flex-1" />
                    <button onClick={() => commitEdit('research_areas', i)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => cancelEdit('research_areas', i)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-800 flex-1">{r}</span>
                  <button onClick={() => startEdit('research_areas', i, r)} className="text-slate-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFromArray('research_areas', i)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <Input placeholder="Research area" value={newResearch} onChange={e => setNewResearch(e.target.value)} />
            <Button variant="outline" size="sm" onClick={() => {
              if (newResearch) { addToArray('research_areas', newResearch); setNewResearch(''); }
            }}><Plus className="w-4 h-4" /></Button>
          </div>
        </Section>

        {/* Books */}
        <Section title="Books">
          <div className="space-y-2 mb-4">
            {form.books.map((b, i) => {
              const draft = getDraft('books', i);
              if (draft !== undefined) {
                return (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 border border-blue-200 rounded-lg px-3 py-2">
                    <Input placeholder="Book title" value={draft.title} onChange={e => setDraft('books', i, { ...draft, title: e.target.value })} className="flex-1" />
                    <Input placeholder="Note" value={draft.note || ''} onChange={e => setDraft('books', i, { ...draft, note: e.target.value })} className="w-36 flex-shrink-0" />
                    <button onClick={() => commitEdit('books', i)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => cancelEdit('books', i)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveInArray('books', i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveInArray('books', i, 1)} disabled={i === form.books.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="text-sm text-slate-800 flex-1">{b.title}</span>
                  {b.note ? <span className="text-xs text-slate-400 italic">{b.note}</span> : null}
                  <button onClick={() => startEdit('books', i, { ...b })} className="text-slate-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFromArray('books', i)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <Input placeholder="Book title" value={newBook.title} onChange={e => setNewBook(v => ({ ...v, title: e.target.value }))} />
            <Input placeholder="Note (e.g. forthcoming)" value={newBook.note} onChange={e => setNewBook(v => ({ ...v, note: e.target.value }))} className="w-40 flex-shrink-0" />
            <Button variant="outline" size="sm" onClick={() => {
              if (newBook.title) { addToArray('books', { ...newBook }); setNewBook({ title: '', note: '' }); }
            }}><Plus className="w-4 h-4" /></Button>
          </div>
        </Section>

        {/* Lectures */}
        <Section title="Lectures & Media">
          <div className="space-y-2 mb-4">
            {form.lectures.map((l, i) => {
              const draft = getDraft('lectures', i);
              if (draft !== undefined) {
                return (
                  <div key={i} className="bg-slate-50 border border-blue-200 rounded-lg px-3 py-2 space-y-2">
                    <Input placeholder="Lecture title" value={draft.title} onChange={e => setDraft('lectures', i, { ...draft, title: e.target.value })} />
                    <div className="flex gap-2">
                      <Input placeholder="Venue / Event" value={draft.venue || ''} onChange={e => setDraft('lectures', i, { ...draft, venue: e.target.value })} className="flex-1" />
                      <Input placeholder="URL (optional)" value={draft.url || ''} onChange={e => setDraft('lectures', i, { ...draft, url: e.target.value })} className="flex-1" />
                      <button onClick={() => commitEdit('lectures', i)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => cancelEdit('lectures', i)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveInArray('lectures', i, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveInArray('lectures', i, 1)} disabled={i === form.lectures.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{l.title}</p>
                    {l.venue ? <p className="text-xs text-slate-400">{l.venue}</p> : null}
                  </div>
                  <button onClick={() => startEdit('lectures', i, { ...l })} className="text-slate-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFromArray('lectures', i)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3">
            <Input placeholder="Lecture title" value={newLecture.title} onChange={e => setNewLecture(v => ({ ...v, title: e.target.value }))} />
            <div className="flex gap-2">
              <Input placeholder="Venue / Event" value={newLecture.venue} onChange={e => setNewLecture(v => ({ ...v, venue: e.target.value }))} />
              <Input placeholder="URL (optional)" value={newLecture.url} onChange={e => setNewLecture(v => ({ ...v, url: e.target.value }))} />
              <Button variant="outline" size="sm" onClick={() => {
                if (newLecture.title) { addToArray('lectures', { ...newLecture }); setNewLecture({ title: '', venue: '', url: '' }); }
              }}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        </Section>

        <div className="flex justify-end pb-8">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            size="lg"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}