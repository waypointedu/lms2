import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LanguageToggle from '@/components/common/LanguageToggle';
import PublicHeader from '@/components/common/PublicHeader';

export default function FAQ() {
  const [lang, setLang] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('waypoint_lang', lang);
  }, [lang]);

  const text = {
    en: {
      title: "Frequently Asked Questions",
      faqs: [
        {
          q: "Is Waypoint really tuition-free?",
          a: "Yes. Contributors cover all costs so students never pay tuition, testing fees, or technology charges."
        },
        {
          q: "What languages are courses offered in?",
          a: "Instruction is in English. Students may record capstone conversations in their native language, and we provide translated summaries when bilingual staff or volunteers are available."
        },
        {
          q: "Can I study while working or raising a family?",
          a: "Absolutely. Courses are self-paced during the week with shared weekly checkpoints, so you study around your real-life responsibilities."
        },
        {
          q: "What are capstone conversations?",
          a: "Each course ends with a 30-minute recorded discussion with 1-2 peers. Faculty evaluate each participant and provide feedback or assign follow-up work if needed."
        },
        {
          q: "Do I need to be on camera?",
          a: "A microphone is required for capstone recordings. A camera is ideal but not mandatory."
        },
        {
          q: "Can I transfer credits to another college?",
          a: "Waypoint is a religious educational ministry exempt from state authorization. Credits are for ministerial education and not intended for transfer to secular degree programs."
        },
        {
          q: "What happens after I complete the Biblical Formation certificate?",
          a: "Associate-level specializations are in development. You'll stay connected to your peers and reconvene for advanced pathways and a research seminar."
        },
        {
          q: "How do I apply?",
          a: "Visit our Apply page to start your application. You'll need to share your faith journey, affirm the Apostles' Creed and Waypoint ethos, and confirm you can join Google Meet capstones."
        }
      ]
    },
    es: {
      title: "Preguntas Frecuentes",
      faqs: [
        {
          q: "¿Waypoint es realmente sin matrícula?",
          a: "Sí. Los colaboradores cubren todos los costos para que los estudiantes nunca paguen matrícula, tarifas de exámenes o cargos tecnológicos."
        },
        {
          q: "¿En qué idiomas se ofrecen los cursos?",
          a: "La instrucción es en inglés. Los estudiantes pueden grabar conversaciones de capstone en su idioma nativo, y proporcionamos resúmenes traducidos cuando hay personal bilingüe o voluntarios disponibles."
        },
        {
          q: "¿Puedo estudiar mientras trabajo o cuido a mi familia?",
          a: "Absolutamente. Los cursos son a tu ritmo durante la semana con puntos de control semanales compartidos, por lo que estudias según tus responsabilidades de la vida real."
        },
        {
          q: "¿Qué son las conversaciones de capstone?",
          a: "Cada curso termina con una discusión grabada de 30 minutos con 1-2 compañeros. El profesorado evalúa a cada participante y proporciona retroalimentación o asigna trabajo de seguimiento si es necesario."
        },
        {
          q: "¿Necesito estar en cámara?",
          a: "Se requiere un micrófono para las grabaciones de capstone. Una cámara es ideal pero no obligatoria."
        },
        {
          q: "¿Puedo transferir créditos a otra universidad?",
          a: "Waypoint es un ministerio educativo religioso exento de autorización estatal. Los créditos son para educación ministerial y no están destinados a transferirse a programas de grado secular."
        },
        {
          q: "¿Qué sucede después de completar el certificado de Formación Bíblica?",
          a: "Las especializaciones de nivel asociado están en desarrollo. Te mantendrás conectado con tus compañeros y te reunirás para vías avanzadas y un seminario de investigación."
        },
        {
          q: "¿Cómo aplico?",
          a: "Visita nuestra página de Aplicar para comenzar tu solicitud. Deberás compartir tu camino de fe, afirmar el Credo de los Apóstoles y el ethos de Waypoint, y confirmar que puedes unirte a capstones de Google Meet."
        }
      ]
    }
  };

  const t = text[lang];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader lang={lang} />

      <div className="max-w-5xl mx-auto px-6 py-32">
        <h1 className="text-5xl font-semibold text-slate-900 mb-12 text-center">{t.title}</h1>

        <Accordion type="single" collapsible className="space-y-4">
          {t.faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-xl px-6 bg-white">
              <AccordionTrigger className="text-left text-lg font-semibold text-slate-900 hover:text-[#1e3a5f]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}