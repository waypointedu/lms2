import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Mail, BookOpen, Edit2, ArrowLeft, ExternalLink } from "lucide-react";

export default function FacultyProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['facultyProfile', targetEmail],
    queryFn: () => base44.entities.InstructorProfile.filter({ instructor_email: targetEmail }),
    enabled: !!targetEmail
  });

  const profile = profiles[0];

  const canEdit = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.email === targetEmail
  );

  const coursesByCategory = (profile?.courses_taught || []).reduce((acc, c) => {
    const cat = c.category || 'Courses';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c.title);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Faculty profile not found.</p>
          <Link to={createPageUrl('Faculty')}>
            <Button variant="outline">← Back to Faculty</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl('Faculty')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Faculty
          </Link>
          <Link to={createPageUrl('Home')}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png"
              alt="Waypoint Institute"
              className="h-9"
            />
          </Link>
          {canEdit ? (
            <Link to={`/FacultyProfileEdit?email=${encodeURIComponent(targetEmail)}`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-slate-600">
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            </Link>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-24">

        {/* HERO */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-16 pb-16 border-b border-slate-100">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-light text-slate-300">
                  {(profile.display_name || '?')[0]}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest text-[#c4933f] uppercase mb-2">
              {profile.faculty_type === 'core' ? 'Core Faculty' : 'Contributing Faculty'}
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-slate-900 mb-1">{profile.display_name}</h1>
            {profile.faculty_type === 'core' && profile.title && (
              <p className="text-base text-[#1e3a5f] font-medium mb-3">{profile.title}</p>
            )}
            {profile.positioning_sentence && (
              <p className="text-slate-500 leading-relaxed text-sm md:text-base max-w-lg">
                {profile.positioning_sentence}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-5">
              <a href={`mailto:${profile.instructor_email}`}>
                <Button size="sm" variant="outline" className="gap-2 border-slate-300 text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]">
                  <Mail className="w-3.5 h-3.5" />
                  Contact
                </Button>
              </a>
              <Link to={createPageUrl('Catalog')}>
                <Button size="sm" variant="outline" className="gap-2 border-slate-300 text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]">
                  <BookOpen className="w-3.5 h-3.5" />
                  View Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        {profile.overview && (
          <Section label="Overview">
            <p className="text-slate-700 leading-relaxed text-base">{profile.overview}</p>
          </Section>
        )}

        {/* TEACHING */}
        {Object.keys(coursesByCategory).length > 0 && (
          <Section label="Courses Taught">
            <div className="space-y-5">
              {Object.entries(coursesByCategory).map(([category, titles]) => (
                <div key={category}>
                  <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">{category}</p>
                  <ul className="space-y-1.5">
                    {titles.map((t, i) => (
                      <li key={i} className="text-slate-700 flex items-start gap-2">
                        <span className="text-[#c4933f] mt-1 text-xs">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* SEMINARS */}
        {profile.seminars?.length > 0 && (
          <Section label="Seminars & Intensives">
            <ul className="space-y-1.5">
              {profile.seminars.map((s, i) => (
                <li key={i} className="text-slate-700 flex items-start gap-2">
                  <span className="text-[#c4933f] mt-1 text-xs">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* EDUCATION */}
        {profile.education?.length > 0 && (
          <Section label="Education">
            <ul className="space-y-4">
              {profile.education.map((edu, i) => (
                <li key={i} className="text-slate-700">
                  <p className="font-medium text-slate-900">{edu.degree}{edu.note ? <span className="font-normal text-slate-500 ml-2 text-sm italic">({edu.note})</span> : null}</p>
                  <p className="text-sm text-slate-500">{edu.institution}{edu.year ? `, ${edu.year}` : ''}</p>
                  {edu.dissertation && (
                    <p className="text-xs text-slate-400 mt-1 italic">Dissertation: {edu.dissertation}</p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* BOOKS */}
        {profile.books?.length > 0 && (
          <Section label="Books">
            <div className="space-y-3">
              {profile.books.map((book, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span className="text-slate-900 font-medium">{book.title}</span>
                  {book.note && (
                    <span className="text-sm text-slate-400 italic">{book.note}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* LECTURES */}
        {profile.lectures?.length > 0 && (
          <Section label="Lectures & Media">
            <div className="space-y-3">
              {profile.lectures.map((lecture, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-slate-900 font-medium">{lecture.title}</p>
                    {lecture.venue && <p className="text-sm text-slate-500">{lecture.venue}</p>}
                  </div>
                  {lecture.url && (
                    <a href={lecture.url} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-12">
      <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-5 pb-3 border-b border-slate-100">
        {label}
      </h2>
      {children}
    </div>
  );
}