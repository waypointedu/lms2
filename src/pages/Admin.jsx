import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CourseManager from '@/components/admin/CourseManager';
import UserManager from '@/components/admin/UserManager';
import Analytics from '@/components/admin/Analytics';
import PathwayManager from '@/components/admin/PathwayManager';
import DetailedAnalytics from '@/components/admin/DetailedAnalytics';
import ApplicationsManager from '@/components/admin/ApplicationsManager';
import AcademicCalendar from '@/components/admin/AcademicCalendar';
import SemesterManager from '@/components/admin/SemesterManager';
import InstructorApprovalManager from '@/components/admin/InstructorApprovalManager';
import StudentManager from '@/components/admin/StudentManager';
import GamificationManager from '@/components/admin/GamificationManager';
import AdvancedCourseManager from '@/components/admin/AdvancedCourseManager';
import AnnouncementManager from '@/components/communication/AnnouncementManager';

export default function Admin() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') || 'overview');

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      const isAuthorized = u.role === 'admin' || u.user_type === 'instructor';
      if (!isAuthorized) {
        window.location.href = createPageUrl('Dashboard');
      }
      setUser(u);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const text = {
    en: {
      title: user?.role === 'admin' ? "Admin Dashboard" : "Instructor Dashboard",
      tabs: {
        overview: "Overview",
        courses: "Courses",
        pathways: "Pathways",
        users: "Users",
        analytics: "Analytics",
        gamification: "Gamification",
        courseCatalog: "Course Catalog",
        announcements: "Announcements",
        messages: "Messages",
        advancedAnalytics: "Advanced Analytics"
      },
      instructorView: "Instructor View"
    },
    es: {
      title: user?.role === 'admin' ? "Panel de Administración" : "Panel del Instructor",
      tabs: {
        overview: "Resumen",
        courses: "Cursos",
        pathways: "Rutas",
        users: "Usuarios",
        analytics: "Analíticas",
        gamification: "Gamificación",
        courseCatalog: "Catálogo de Cursos",
        announcements: "Anuncios",
        messages: "Mensajes",
        advancedAnalytics: "Analíticas Avanzadas"
      },
      instructorView: "Vista Instructor"
    }
  };

  const t = text[lang];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between overflow-x-auto">
          <Link to={createPageUrl(`Home?lang=${lang}`)} className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" alt="Waypoint Institute" className="h-10" />
          </Link>

          <div className="flex items-center gap-4">
            {user?.role === 'instructor' && (
              <Link to={createPageUrl(`InstructorDashboard?lang=${lang}`)}>
                <Button variant="outline" size="sm">
                  {t.instructorView}
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = createPageUrl(`Dashboard?lang=${lang}&view=student`)}
            >
              {lang === 'es' ? 'Vista Estudiante' : 'Student View'}
            </Button>
            <Link to={createPageUrl(`AccountSettings?lang=${lang}`)}>
              <Button variant="ghost" size="sm">
                {lang === 'es' ? 'Mi Cuenta' : 'Account'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <h1 className="text-2xl md:text-3xl font-light text-slate-900 mb-8">{t.title}</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="mb-8 flex-wrap">
             {user.role === 'admin' && <TabsTrigger value="overview" className="text-xs md:text-sm">{t.tabs.overview}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="applications" className="text-xs md:text-sm">{lang === 'es' ? 'Solicitudes' : 'Applications'}</TabsTrigger>}
             <TabsTrigger value="courses" className="text-xs md:text-sm">{t.tabs.courses}</TabsTrigger>
             {user.role === 'admin' && <TabsTrigger value="students" className="text-xs md:text-sm">{lang === 'es' ? 'Estudiantes' : 'Students'}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="instructors" className="text-xs md:text-sm">{lang === 'es' ? 'Instructores' : 'Instructors'}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="calendar" className="text-xs md:text-sm">{lang === 'es' ? 'Calendario' : 'Calendar'}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="pathways" className="text-xs md:text-sm">{t.tabs.pathways}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="users" className="text-xs md:text-sm">{t.tabs.users}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="gamification" className="text-xs md:text-sm">{t.tabs.gamification}</TabsTrigger>}
             {user.role === 'admin' && <TabsTrigger value="announcements" className="text-xs md:text-sm">{t.tabs.announcements}</TabsTrigger>}
           </TabsList>

          {user.role === 'admin' && (
            <TabsContent value="overview">
              <DetailedAnalytics lang={lang} />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="applications">
              <ApplicationsManager lang={lang} />
            </TabsContent>
          )}

          <TabsContent value="courses">
            <CourseManager lang={lang} user={user} />
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="students">
              <StudentManager />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="instructors">
              <InstructorApprovalManager />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="calendar">
              <div className="space-y-8">
                <SemesterManager />
                <AcademicCalendar lang={lang} />
              </div>
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="pathways">
              <PathwayManager lang={lang} user={user} />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="users">
              <UserManager lang={lang} />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="gamification">
              <GamificationManager />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="announcements">
              <AnnouncementManager />
            </TabsContent>
          )}
          </Tabs>
          </div>
          </div>
          );
          }