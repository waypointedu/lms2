import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import LanguageToggle from '@/components/common/LanguageToggle';
import CourseCard from '@/components/courses/CourseCard';
import { jsPDF } from 'jspdf';

export default function Pathway() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathwayId = urlParams.get('id');
  const [lang, setLang] = useState(urlParams.get('lang') || 'en');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: pathway } = useQuery({
    queryKey: ['pathway', pathwayId],
    queryFn: () => base44.entities.Pathway.filter({ id: pathwayId }),
    select: (data) => data[0],
    enabled: !!pathwayId
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['pathwayCourses', pathway?.course_ids],
    queryFn: async () => {
      const allCourses = await base44.entities.Course.list();
      return pathway.course_ids.map(id => allCourses.find(c => c.id === id)).filter(Boolean);
    },
    enabled: !!pathway?.course_ids
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: pathwayEnrollment } = useQuery({
    queryKey: ['pathwayEnrollment', pathwayId, user?.email],
    queryFn: () => base44.entities.PathwayEnrollment.filter({ pathway_id: pathwayId, user_email: user?.email }),
    select: (data) => data[0],
    enabled: !!user?.email && !!pathwayId
  });

  const downloadCertificate = () => {
    const pdf = new jsPDF({ orientation: 'landscape' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(30, 58, 95);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(36);
    pdf.text('Certificate of Completion', pageWidth / 2, 60, { align: 'center' });
    
    pdf.setFontSize(20);
    pdf.text(user.full_name || user.email, pageWidth / 2, 100, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.text(`has successfully completed the ${pathway[`title_${lang}`] || pathway.title_en}`, pageWidth / 2, 130, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Issued: ${new Date().toLocaleDateString()}`, pageWidth / 2, 160, { align: 'center' });
    
    pdf.save(`${pathway.title_en}-certificate.pdf`);
  };

  const text = {
    en: { back: 'Back to Pathways', enrolled: 'Enrolled', courses: 'Courses', completed: 'Completed', downloadCert: 'Download Certificate' },
    es: { back: 'Volver a Rutas', enrolled: 'Inscrito', courses: 'Cursos', completed: 'Completado', downloadCert: 'Descargar Certificado' }
  };
  const t = text[lang];

  if (!pathway) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
    </div>;
  }

  const completedCourses = enrollments.filter(e => e.status === 'completed' && pathway.course_ids.includes(e.course_id));
  const isCompleted = completedCourses.length === pathway.course_ids.length && pathwayEnrollment;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">Waypoint Institute</span>
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link to={createPageUrl(`Pathways?lang=${lang}`)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <Award className="w-12 h-12 text-amber-600" />
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>{pathway.type}</Badge>
              {pathwayEnrollment && <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" />{t.enrolled}</Badge>}
              {isCompleted && <Badge className="bg-amber-100 text-amber-800"><Award className="w-3 h-3 mr-1" />{t.completed}</Badge>}
            </div>
            <h1 className="text-4xl font-light text-slate-900 mb-3">{pathway[`title_${lang}`] || pathway.title_en}</h1>
            <p className="text-xl text-slate-600">{pathway[`description_${lang}`] || pathway.description_en}</p>
          </div>
          {isCompleted && (
            <Button onClick={downloadCertificate} className="bg-amber-600 hover:bg-amber-700">
              <Download className="w-4 h-4 mr-2" />
              {t.downloadCert}
            </Button>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t.courses} ({completedCourses.length}/{pathway.course_ids.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                lang={lang}
                enrolled={enrollments.some(e => e.course_id === course.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}