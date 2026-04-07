import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";
import PublicHeader from '@/components/common/PublicHeader';

export default function Contact() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  const text = {
    en: {
      title: "Contact Waypoint Institute",
      subtitle: "Have questions or need assistance? We're here to help.",
      email_title: "Email Us",
      email_desc: "For admissions, technical support, or general inquiries:",
      email_address: "admin@waypoint.institute",
      email_btn: "Send Email",
      support_title: "Student Support",
      support_desc: "Current students can reach out for:",
      support_items: [
        "Technical difficulties with the platform",
        "Questions about course content or assignments",
        "Capstone scheduling and preparation",
        "Accommodation requests"
      ],
      response_time: "Response Time",
      response_desc: "We typically respond within 24 hours during weekdays."
    },
    es: {
      title: "Contactar a Waypoint Institute",
      subtitle: "¿Tienes preguntas o necesitas ayuda? Estamos aquí para ayudar.",
      email_title: "Envíanos un Correo",
      email_desc: "Para admisiones, soporte técnico o consultas generales:",
      email_address: "admin@waypoint.institute",
      email_btn: "Enviar Correo",
      support_title: "Soporte Estudiantil",
      support_desc: "Los estudiantes actuales pueden contactarnos para:",
      support_items: [
        "Dificultades técnicas con la plataforma",
        "Preguntas sobre contenido del curso o tareas",
        "Programación y preparación de capstone",
        "Solicitudes de adaptación"
      ],
      response_time: "Tiempo de Respuesta",
      response_desc: "Generalmente respondemos dentro de 24 horas durante los días laborables."
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

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-[#1e3a5f]/10 flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-[#1e3a5f]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{t.email_title}</h3>
              <p className="text-slate-600 mb-4">{t.email_desc}</p>
              <div className="p-4 bg-slate-50 rounded-lg mb-4">
                <code className="text-[#1e3a5f] font-mono">{t.email_address}</code>
              </div>
              <a href="mailto:admin@waypoint.institute">
                <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                  <Mail className="w-4 h-4" />
                  {t.email_btn}
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-[#c4933f]/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7 text-[#c4933f]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{t.support_title}</h3>
              <p className="text-slate-600 mb-4">{t.support_desc}</p>
              <ul className="space-y-2">
                {t.support_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c4933f] mt-2 flex-shrink-0" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-50 border-2">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{t.response_time}</h3>
            <p className="text-slate-600">{t.response_desc}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}