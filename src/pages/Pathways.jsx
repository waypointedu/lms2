import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, BookOpen, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/common/ProgressBar';
import PublicHeader from '@/components/common/PublicHeader';

export default function Pathways() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: pathways = [] } = useQuery({
    queryKey: ['pathways'],
    queryFn: () => base44.entities.Pathway.filter({ status: 'published' })
  });

  const { data: myPathways = [] } = useQuery({
    queryKey: ['pathwayEnrollments', user?.email],
    queryFn: () => base44.entities.PathwayEnrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: allEnrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const enrollMutation = useMutation({
    mutationFn: (pathwayId) => base44.entities.PathwayEnrollment.create({
      pathway_id: pathwayId,
      user_email: user.email,
      status: 'active',
      enrolled_date: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pathwayEnrollments'] })
  });

  const getPathwayProgress = (pathway) => {
    const completedCourses = pathway.course_ids?.filter(cid => 
      allEnrollments.some(e => e.course_id === cid && e.status === 'completed')
    ).length || 0;
    const total = pathway.course_ids?.length || 1;
    return Math.round((completedCourses / total) * 100);
  };

  const text = {
    en: { title: 'Academic Pathways', subtitle: 'Pursue degrees, certificates, and specializations', enroll: 'Enroll', enrolled: 'Enrolled', courses: 'courses', months: 'months', credits: 'credits', viewDetails: 'View Details', myPathways: 'My Pathways', available: 'Available Pathways' },
    es: { title: 'Rutas Académicas', subtitle: 'Obtén títulos, certificados y especializaciones', enroll: 'Inscribirse', enrolled: 'Inscrito', courses: 'cursos', months: 'meses', credits: 'créditos', viewDetails: 'Ver Detalles', myPathways: 'Mis Rutas', available: 'Rutas Disponibles' }
  };
  const t = text[lang];

  const enrolledIds = myPathways.map(p => p.pathway_id);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      <PublicHeader lang={lang} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-32">
        <div className="mb-20 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-8 leading-tight">
            Certificate in <span className="italic text-[#c4933f]">Biblical Formation</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
            The Biblical Formation certificate is our launch-year, college-level credential. Students begin with the Waypoint Introduction Seminar, progress through seven core courses, and complete an oral capstone for each class before any future specialization. The intent of this certificate is to be an intermediary credential preceding their Associate's Degree.
          </p>
        </div>

        {/* Program Overview */}
        <section className="mb-20 p-10 md:p-12 bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-lg border border-slate-200">
          <h2 className="text-3xl font-semibold text-slate-900 mb-6">Program overview</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            Begin with a two-week introduction seminar covering tools, policies, and study rhythms. Courses run 8 or 16 weeks with shared checkpoints; readings and assignments are self-paced between those checkpoints.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            After completing the Biblical Formation core, you remain connected to peers while awaiting the launch of associate-level pathways and the accompanying research seminar.
          </p>
        </section>

        {/* Year One */}
        <Card className="mb-20 overflow-hidden border-slate-200 shadow-xl">
          <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] text-white p-10 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <span className="text-sm font-medium text-white/90 mb-3 block uppercase tracking-wider">Year One</span>
              <h2 className="text-4xl font-semibold mb-4">Certificate in Biblical Formation</h2>
              <p className="text-white/95 text-xl leading-relaxed">
                Seven 16-week courses (4 cr each), plus a two-week introduction seminar (1 cr) and an integrated apologetics seminar (1 cr). Total 30 credits with guided checkpoints and room for weekly self-paced work.
              </p>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Hermeneutics</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Old Testament: Torah, Prophets, Writings</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">New Testament: Gospels & Acts</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">New Testament: Epistles & Revelation</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">New Testament Use of the Old Testament</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Biblical Principles of Culture</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Biblical Spiritual Practices</span>
                <span className="text-slate-500 text-sm">16 weeks • 4 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Waypoint Introduction Seminar</span>
                <span className="text-slate-500 text-sm">2 weeks • 1 cr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Apologetics Seminar Series</span>
                <span className="text-slate-500 text-sm">integrated • 1 cr</span>
              </div>
              <div className="flex justify-between py-4 font-semibold text-slate-900">
                <span>Total:</span>
                <span>30 credits</span>
              </div>
            </div>
            <Link to={createPageUrl(`Catalog?lang=${lang}`)}>
              <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                Open Course Catalog <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Year Two */}
        <Card className="mb-20 overflow-hidden border-slate-200 shadow-xl">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-10 md:p-12 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <span className="text-sm font-medium text-white/90 mb-3 block uppercase tracking-wider">Year Two</span>
              <h2 className="text-4xl font-semibold mb-4">Associate Pathways <span className="text-[#c4933f]">(coming soon)</span></h2>
              <p className="text-white/95 text-xl leading-relaxed">
                After year one, associate-level tracks will let you deepen focus areas while staying connected to your peers. Titles, syllabi, and research seminar details are forthcoming.
              </p>
            </div>
          </div>
        </Card>

        {/* Capstones & Assessment */}
        <section className="mb-20 p-10 md:p-12 bg-white rounded-3xl shadow-lg border border-slate-200">
          <h2 className="text-4xl font-light text-slate-900 mb-6">Capstones & Assessment</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Each course culminates in a topical capstone conversation. Students record a 30-minute audio or video discussion with one or two peers. Faculty review individual contributions as an oral examination. If mastery is unclear, we assign remedial work or schedule a one-on-one follow up before granting course credit.
          </p>
        </section>

        {/* Technology Requirements */}
        <section className="mb-16">
          <h2 className="text-3xl font-light text-slate-900 mb-6">Technology Requirements</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
              <span className="text-slate-600">Reliable internet for reading, submitting assignments, and occasional streaming</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
              <span className="text-slate-600">Access to Google Docs, Sheets, and Slides</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
              <span className="text-slate-600">Ability to join at least one 30-minute Google Meet call per course</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
              <span className="text-slate-600">Microphone (and ideally camera) to record capstone conversations in English or your native language</span>
            </li>
          </ul>
          <p className="text-slate-500 text-sm mt-4 italic">
            Courses are delivered in English. As funding allows, we add translated materials or supplementary resources.
          </p>
        </section>

        {/* Study Rhythm */}
        <section className="mb-16">
          <h2 className="text-3xl font-light text-slate-900 mb-8">Study Rhythm & Capstones</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Guided pace</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Every course stays on a shared calendar with clear milestones, while most work happens in the windows that fit your week.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Weekly checkpoints and reminders keep everyone aligned</li>
                <li>• Flexible windows for readings, reflections, and assignments</li>
                <li>• Faculty mentors accompany your progress</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Self-Paced Study</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Between checkpoints, you guide your own schedule. Lectures, readings, and practice exercises can be completed whenever you have margin.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Plan for gentle, sustainable study rhythms each week</li>
                <li>• Google Docs and Sheets host written work and reflections</li>
                <li>• Capstone preparation includes peer dialogue and prayer</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Capstone Conversations</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Each course culminates in a recorded dialogue that serves as an oral examination. Faculty review every participant to confirm mastery.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• 30-minute small-group conversations per course</li>
                <li>• Conducted in English or your local language—translation provided</li>
                <li>• Remediation or one-on-one follow up offered when needed</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl(`Catalog?lang=${lang}`)}>
              <Button size="lg" variant="outline" className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white">
                Browse courses
              </Button>
            </Link>
            <Link to={createPageUrl(`Apply?lang=${lang}`)}>
              <Button size="lg" className="bg-[#1e3a5f] hover:bg-[#2d5a8a]">
                Apply
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}