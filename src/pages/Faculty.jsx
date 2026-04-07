import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from '@/components/common/PublicHeader';

export default function Faculty() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['facultyProfiles'],
    queryFn: () => base44.entities.InstructorProfile.filter({ is_published: true })
  });

  // Fix order: Josh (Academic Director) left, Michael (Operations Director) right
  const allCore = profiles.filter(p => p.faculty_type === 'core');
  const joshFirst = [...allCore].sort((a, b) => {
    if (a.instructor_email.includes('josh')) return -1;
    if (b.instructor_email.includes('josh')) return 1;
    return 0;
  });
  const coreFaculty = joshFirst;
  const contributingFaculty = profiles.filter(p => p.faculty_type === 'contributing');

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader lang="en" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-36 pb-24">
        {/* Hero */}
        <div className="mb-20 text-center">
          <h1 className="text-4xl md:text-6xl font-light text-slate-900 mb-6 leading-tight">
            Our <span className="italic text-[#c4933f]">Faculty</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Scholars and pastors committed to rigorous theological formation.
          </p>
        </div>

        {/* Core Faculty */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
          </div>
        ) : (
          <>
            {coreFaculty.length > 0 && (
              <div className="mb-20">
                <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-10 text-center">Core Faculty</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {coreFaculty.map(profile => (
                    <FacultyCard key={profile.id} profile={profile} isCore />
                  ))}
                </div>
              </div>
            )}

            {/* Contributing Faculty */}
            <div className="mb-20">
              <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-10 text-center">Contributing Faculty</p>
              {contributingFaculty.length === 0 ? (
                <p className="text-center text-slate-400 italic py-8">To be announced</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contributingFaculty.map(profile => (
                    <FacultyCard key={profile.id} profile={profile} isCore={false} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Teaching Philosophy */}
        <section className="p-8 md:p-14 bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8a] to-[#1e3a5f] rounded-3xl text-white shadow-2xl relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c4933f]/10 rounded-full blur-3xl" />
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-semibold mb-5">Our Teaching Philosophy</h2>
            <p className="text-base md:text-lg text-white/95 leading-relaxed">
              We believe theological education should be both accessible and rigorous. Our faculty are committed to shepherding students through deep engagement with Scripture, doctrine, and the Christian tradition—all while remaining grounded in the realities of ministry and mission.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4">Learn with us</h2>
          <p className="text-slate-600 mb-8 text-base md:text-lg max-w-2xl mx-auto">
            Experience world-class theological education from faculty who care deeply about your formation and calling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Apply')}>
              <Button size="lg" className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">Apply Now</Button>
            </Link>
            <Link to={createPageUrl('Catalog')}>
              <Button size="lg" variant="outline" className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
                View Courses
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function FacultyCard({ profile, isCore }) {
  const coursesByCategory = (profile.courses_taught || []).reduce((acc, c) => {
    const cat = c.category || 'Courses';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c.title);
    return acc;
  }, {});

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1e3a5f]/30 hover:shadow-lg transition-all duration-300">
      {/* Top: photo + name */}
      <div className="flex items-center gap-5 p-6 border-b border-slate-100 bg-slate-50">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 ring-2 ring-white shadow">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-light text-slate-400">
              {(profile.display_name || '?')[0]}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 leading-tight">{profile.display_name}</h3>
          {isCore && profile.title && (
            <p className="text-sm text-[#1e3a5f] mt-0.5">{profile.title}</p>
          )}
        </div>
      </div>

      {/* Courses & Seminars */}
      <div className="p-6 space-y-4">
        {Object.entries(coursesByCategory).length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Courses</p>
            <ul className="space-y-1">
              {Object.values(coursesByCategory).flat().map((title, i) => (
                <li key={i} className="text-sm text-slate-700">• {title}</li>
              ))}
            </ul>
          </div>
        )}

        {profile.seminars?.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Seminars</p>
            <ul className="space-y-1">
              {profile.seminars.map((s, i) => (
                <li key={i} className="text-sm text-slate-700">• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {(!profile.courses_taught?.length && !profile.seminars?.length) && (
          <p className="text-sm text-slate-400 italic">Courses coming soon</p>
        )}

        <div className="pt-2">
          <Link to={`/FacultyProfile?email=${encodeURIComponent(profile.instructor_email)}`}>
            <Button variant="outline" size="sm" className="w-full border-slate-300 text-slate-700 hover:border-[#1e3a5f] hover:text-[#1e3a5f] group">
              View Full Profile
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}