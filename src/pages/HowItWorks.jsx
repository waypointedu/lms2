import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Video, ArrowRight } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';
import { base44 } from '@/api/base44Client';
import PublicHeader from '@/components/common/PublicHeader';

export default function HowItWorks() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  const text = {
    en: {
      title: "How Waypoint Institute Works",
      subtitle: "A self-paced rhythm with shared checkpoints that keeps disciples supported while making room for local realities.",
      step1_title: "Start Strong",
      step1_desc: "Join the Waypoint Introduction Seminar. Learn the tools, expectations, and shared checkpoints that frame the Biblical Formation year.",
      step1_details: ["Orientation to policies, technology, and study rhythms", "Faculty introductions and community expectations", "Guidance for pacing work around local responsibilities"],
      step2_title: "Study at Your Pace",
      step2_desc: "Each 8- or 16-week course includes weekly checkpoints, readings, and practices. You decide when to complete the work during the week while staying aligned with shared milestones.",
      step2_details: ["Weekly reminders and shared checkpoints", "Faculty feedback on submissions and reflections", "Optional peer meetups for prayer and encouragement"],
      step3_title: "Record the Capstone",
      step3_desc: "Wrap up each course with a 30-minute conversation on the central topic. Record with one or two classmates. Faculty review every voice and assign follow up if needed.",
      step3_details: ["Conversations can be in English or your native language", "Faculty provide individual feedback and next steps", "Remedial assignments or one-on-one dialogue when mastery needs strengthening"],
      tech_title: "Technology Checklist",
      tech_items: ["Consistent internet access for readings, discussions, and uploads", "A Google account (free) to access Docs, Sheets, Slides, and Meet", "Ability to use Google Docs, Sheets, and Slides", "A device capable of joining at least one 30-minute Google Meet call per course", "Microphone (and ideally camera) to record capstone conversations"],
      cta: "Ready to Apply?",
      apply: "Start Your Application"
    },
    es: {
      title: "Cómo Funciona Waypoint Institute",
      subtitle: "Un ritmo a tu ritmo con puntos de control compartidos que mantiene a los discípulos apoyados mientras se adapta a realidades locales.",
      step1_title: "Comienza Fuerte",
      step1_desc: "Únete al Seminario de Introducción de Waypoint. Aprende las herramientas, expectativas y puntos de control que enmarcan el año de Formación Bíblica.",
      step1_details: ["Orientación sobre políticas, tecnología y ritmos de estudio", "Presentaciones del profesorado y expectativas comunitarias", "Guía para organizar el trabajo según responsabilidades locales"],
      step2_title: "Estudia a Tu Ritmo",
      step2_desc: "Cada curso de 8 o 16 semanas incluye puntos de control semanales, lecturas y prácticas. Decides cuándo completar el trabajo durante la semana mientras te alineas con los hitos compartidos.",
      step2_details: ["Recordatorios semanales y puntos de control compartidos", "Retroalimentación del profesorado sobre entregas y reflexiones", "Reuniones opcionales con compañeros para oración y ánimo"],
      step3_title: "Graba el Capstone",
      step3_desc: "Concluye cada curso con una conversación de 30 minutos sobre el tema central. Graba con uno o dos compañeros. El profesorado revisa cada voz y asigna seguimiento si es necesario.",
      step3_details: ["Las conversaciones pueden ser en inglés o tu idioma nativo", "El profesorado proporciona retroalimentación individual y próximos pasos", "Tareas correctivas o diálogo uno a uno cuando se necesita reforzar el dominio"],
      tech_title: "Lista de Verificación Tecnológica",
      tech_items: ["Acceso constante a internet para lecturas, discusiones y cargas", "Una cuenta de Google (gratuita) para acceder a Docs, Sheets, Slides y Meet", "Capacidad para usar Google Docs, Sheets y Slides", "Un dispositivo capaz de unirse a al menos una llamada de Google Meet de 30 minutos por curso", "Micrófono (e idealmente cámara) para grabar conversaciones de capstone"],
      cta: "¿Listo para Aplicar?",
      apply: "Comienza Tu Solicitud"
    }
  };

  const t = text[lang];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader lang={lang} />

      <div className="max-w-4xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold text-slate-900 mb-6">{t.title}</h1>
          <p className="text-xl text-slate-600">{t.subtitle}</p>
        </div>

        <div className="space-y-16">
          {/* Step 1 */}
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f]/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#1e3a5f]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">{t.step1_title}</h2>
              <p className="text-slate-600 mb-4">{t.step1_desc}</p>
              <ul className="space-y-2">
                {t.step1_details.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600">
                    <ArrowRight className="w-4 h-4 mt-1 text-[#c4933f] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f]/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-[#1e3a5f]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">{t.step2_title}</h2>
              <p className="text-slate-600 mb-4">{t.step2_desc}</p>
              <ul className="space-y-2">
                {t.step2_details.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600">
                    <ArrowRight className="w-4 h-4 mt-1 text-[#c4933f] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f]/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-[#1e3a5f]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">{t.step3_title}</h2>
              <p className="text-slate-600 mb-4">{t.step3_desc}</p>
              <ul className="space-y-2">
                {t.step3_details.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600">
                    <ArrowRight className="w-4 h-4 mt-1 text-[#c4933f] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="mt-16 p-8 bg-slate-50 rounded-2xl">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">{t.tech_title}</h3>
          <ul className="space-y-2">
            {t.tech_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-600">
                <ArrowRight className="w-4 h-4 mt-1 text-[#1e3a5f] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-2xl">
          <h3 className="text-2xl font-semibold text-white mb-4">{t.cta}</h3>
          <Link to={createPageUrl(`Apply?lang=${lang}`)}>
            <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-slate-100">
              {t.apply}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}