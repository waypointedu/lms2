import React from 'react';
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LanguageFallbackNotice({ requestedLang }) {
  const messages = {
    es: "La versión en español no está disponible todavía. Mostrando contenido en inglés.",
    en: "English version not available. Showing Spanish content."
  };

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        {messages[requestedLang] || messages.es}
      </AlertDescription>
    </Alert>
  );
}