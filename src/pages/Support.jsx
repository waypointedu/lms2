import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, BookOpen, Users, Mail } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';
import { base44 } from '@/api/base44Client';
import PublicHeader from '@/components/common/PublicHeader';

export default function Support() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  const text = {
    en: {
      title: "Support Waypoint Institute",
      subtitle: "Students pay nothing. Your contribution keeps our Christian college certificate tuition-free today and fuels future associate pathways.",
      disclaimer: "We are not currently a 501(c)(3). Contributions are not tax-deductible.",
      course_creation: "$500 course creation honorarium",
      course_creation_desc: "Funds readings, assignments, and initial capstone design for a reusable course.",
      course_facilitation: "$500 course facilitation honorarium",
      course_facilitation_desc: "Compensates the instructor who reviews capstones and offers weekly feedback.",
      platform: "Platform and library growth",
      platform_desc: "Supports translations, technology upkeep, and digital resources students use at no cost.",
      how_to: "How to Contribute",
      how_to_desc: "We receive contributions directly while we evaluate long-term nonprofit status. Reach out to discuss a one-time or recurring contribution.",
      email_btn: "Email to Contribute"
    },
    es: {
      title: "Apoyar a Waypoint Institute",
      subtitle: "Los estudiantes no pagan nada. Tu contribución mantiene nuestro certificado universitario cristiano sin matrícula hoy y alimenta futuros programas asociados.",
      disclaimer: "Actualmente no somos una organización 501(c)(3). Las contribuciones no son deducibles de impuestos.",
      course_creation: "Construir un Curso",
      course_creation_amount: "$500",
      course_creation_desc: "Honorario para el instructor que crea un curso reutilizable con lecturas, tareas y evaluaciones.",
      course_creation_details: ["Financia currículo y medios perennes", "Incluye diseño inicial de capstone"],
      course_facilitation: "Facilitar un Curso",
      course_facilitation_amount: "$500",
      course_facilitation_desc: "Honorario para el instructor que facilita un curso, revisa capstones y ofrece retroalimentación pastoral.",
      course_facilitation_details: ["Cubre tiempo de evaluación de capstone", "Mantiene horas de oficina y retroalimentación"],
      platform: "Mantener el Acceso Abierto",
      platform_desc: "Apoya resúmenes de traducción, tecnología y crecimiento de la biblioteca digital para que estudiantes de todo el mundo estudien sin matrícula.",
      platform_details: ["Expande recursos multilingües", "Mantiene plataformas de bajo costo y seguridad"],
      how_to: "Cómo Contribuir",
      how_to_desc: "Recibimos contribuciones directamente mientras evaluamos el estado de organización sin fines de lucro a largo plazo. Contáctanos para discutir una contribución única o recurrente.",
      email_btn: "Enviar Correo para Contribuir"
    }
  };

  const t = text[lang];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader lang={lang} />

      <div className="max-w-5xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold text-slate-900 mb-6">{t.title}</h1>
          <p className="text-xl text-slate-600 mb-4">{t.subtitle}</p>
          <p className="text-sm text-slate-500">{t.disclaimer}</p>
        </div>

        <div className="space-y-6 mb-16">
          <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{t.course_creation}</h3>
              <p className="text-slate-600">{t.course_creation_desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{t.course_facilitation}</h3>
              <p className="text-slate-600">{t.course_facilitation_desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-[#1e3a5f] mt-2 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{t.platform}</h3>
              <p className="text-slate-600">{t.platform_desc}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center p-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-2xl">
          <h3 className="text-2xl font-semibold text-white mb-4">{t.how_to}</h3>
          <p className="text-slate-200 mb-6 max-w-2xl mx-auto">{t.how_to_desc}</p>
          <a href="mailto:admin@waypoint.institute">
            <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-slate-100 gap-2">
              <Mail className="w-4 h-4" />
              {t.email_btn}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}