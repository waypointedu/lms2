import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '@/components/common/PublicHeader';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Globe } from "lucide-react";

export default function About() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader lang={lang} />

      <div className="max-w-5xl mx-auto px-6 py-32">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-8 leading-tight">
            Mission, Ethos, and <span className="italic text-[#c4933f]">Faith</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Waypoint Institute exists to obey the Great Commission through a tuition-free Christian college education. Our students pursue the Good, the True, and the Beautiful together, rooted in Christ and welcoming disciples from every nation.
          </p>
          <div className="mt-10 p-8 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8a] rounded-2xl shadow-lg">
            <p className="text-xl md:text-2xl text-white italic leading-relaxed">
              "Go therefore and make disciples of all nations… teaching them to observe all that I have commanded you."
            </p>
            <p className="text-sm text-white/80 mt-3 font-medium">Matthew 28:19–20</p>
          </div>
        </div>

        {/* Mission */}
        <section className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-br from-slate-50 to-white p-10 md:p-12">
              <h2 className="text-4xl font-light text-slate-900 mb-6">Our Mission</h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Waypoint Institute forms resilient disciples who know Scripture, love the church, and live as witnesses wherever God places them. We do this through tuition-free college courses, pastoral presence, and capstone conversations that call each student to faithful obedience.
                </p>
                <p>
                  We steward contributor support to offer rigorous, college-level theological learning without barriers so believers in restricted or resource-limited contexts can be trained for gospel ministry.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-10 md:p-12 border-t border-slate-200">
              <h3 className="text-2xl font-semibold text-slate-900 mb-6">How Mission Shapes the Year</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="w-3 h-3 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
                  <span className="text-slate-700 text-lg">Courses run on a shared calendar with self-paced weeks and clearly defined checkpoints.</span>
                </li>
                <li className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="w-3 h-3 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
                  <span className="text-slate-700 text-lg">Capstone dialogues function as oral examinations to affirm mastery and shepherd growth.</span>
                </li>
                <li className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="w-3 h-3 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
                  <span className="text-slate-700 text-lg">Future associate pathways will invite students into collaborative research and witness.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tuition Free */}
        <section className="mb-20 p-10 md:p-14 bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8a] to-[#1e3a5f] rounded-3xl text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c4933f]/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-semibold mb-5">Always tuition-free, assessment costs covered</h2>
            <p className="text-xl text-white/95 leading-relaxed max-w-3xl">
              No application fees. No tuition bills. No charges for exams or capstones. Supporters underwrite every course so you never enter a credit card number for your college education, to study, demonstrate mastery, or graduate.
            </p>
          </div>
        </section>

        {/* Ethos */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-4">Our Ethos</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">These commitments flow from Christ and guide every lesson, discussion, and decision.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-[#1e3a5f]" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Christocentrism</h3>
              <p className="text-slate-600 leading-relaxed">
                Jesus is the center of history, the lens for Scripture, and the anchor of our hope. Every course, conversation, and assessment aims to magnify His lordship.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-full bg-[#c4933f]/10 flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-[#c4933f]" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Pursuit of Truth</h3>
              <p className="text-slate-600 leading-relaxed italic mb-3">
                "Whatever is true, whatever is honorable… if there is any excellence, if there is anything worthy of praise, think about these things."
              </p>
              <p className="text-sm text-slate-500">(Philippians 4:8)</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-full bg-[#2d5a8a]/10 flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-[#2d5a8a]" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Radical Accessibility</h3>
              <p className="text-slate-600 leading-relaxed">
                Jesus warned the Pharisees against shutting people out of the kingdom (Matthew 23:13). We do the opposite—removing financial, cultural, and technological barriers so every willing disciple can learn freely.
              </p>
            </div>
          </div>
        </section>

        {/* Faith Statement */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-4">Mere-Christian Statement of Faith</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We confess the Apostles' Creed with the historic church, standing shoulder to shoulder with believers across traditions and centuries.
            </p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-10 md:p-14 border-2 border-slate-200 shadow-xl">
            <h3 className="text-2xl md:text-3xl font-serif italic text-[#1e3a5f] mb-8 text-center">The Apostles' Creed</h3>
            <div className="text-slate-800 leading-relaxed space-y-3 text-lg max-w-3xl mx-auto text-center">
              <p>I believe in God, the Father almighty,</p>
              <p>maker of heaven and earth.</p>
              <p className="mt-5">And in Jesus Christ, his only Son, our Lord,</p>
              <p>who was conceived by the Holy Spirit,</p>
              <p>born of the Virgin Mary,</p>
              <p>suffered under Pontius Pilate,</p>
              <p>was crucified, died, and was buried;</p>
              <p>he descended to the dead.</p>
              <p>On the third day he rose again;</p>
              <p>he ascended into heaven,</p>
              <p>he is seated at the right hand of the Father,</p>
              <p>and he will come again to judge the living and the dead.</p>
              <p className="mt-5">I believe in the Holy Spirit,</p>
              <p>the holy catholic Church,</p>
              <p>the communion of saints,</p>
              <p>the forgiveness of sins,</p>
              <p>the resurrection of the body,</p>
              <p>and the life everlasting. Amen.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Join our community</h2>
          <p className="text-slate-600 mb-8">
            Step into a learning community that is Christ-centered, truth-seeking, and globally accessible. Biblical Formation begins in 2025.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl(`Apply?lang=${lang}`)}>
              <Button size="lg" className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                {lang === 'es' ? 'Aplicar' : 'Apply'}
              </Button>
            </Link>
            <Link to={createPageUrl(`Support?lang=${lang}`)}>
              <Button size="lg" variant="outline" className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
                {lang === 'es' ? 'Apoyar educación sin matrícula' : 'Support tuition-free college'}
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}