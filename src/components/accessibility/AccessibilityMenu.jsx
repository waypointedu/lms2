import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Volume2, Eye, Type, Accessibility } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AccessibilityMenu({ user, userPrefs, lang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(userPrefs?.high_contrast_mode || false);
  const [textToSpeech, setTextToSpeech] = useState(userPrefs?.text_to_speech || false);
  const [fontSize, setFontSize] = useState('normal');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const updatePrefsMutation = useMutation({
    mutationFn: async (data) => {
      if (userPrefs?.id) {
        return base44.entities.UserPreferences.update(userPrefs.id, data);
      } else {
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPrefs', user.email] });
    }
  });

  const handleHighContrast = (enabled) => {
    setHighContrast(enabled);
    updatePrefsMutation.mutate({ high_contrast_mode: enabled });
  };

  const handleTTS = (enabled) => {
    setTextToSpeech(enabled);
    updatePrefsMutation.mutate({ text_to_speech: enabled });
  };

  const speak = (text) => {
    if (textToSpeech && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const text = {
    en: {
      title: 'Accessibility',
      highContrast: 'High Contrast',
      textToSpeech: 'Text to Speech',
      fontSize: 'Font Size',
      small: 'Small',
      normal: 'Normal',
      large: 'Large'
    },
    es: {
      title: 'Accesibilidad',
      highContrast: 'Alto Contraste',
      textToSpeech: 'Texto a Voz',
      fontSize: 'Tamaño de Fuente',
      small: 'Pequeño',
      normal: 'Normal',
      large: 'Grande'
    }
  };
  const t = text[lang];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.title}
        className="relative"
      >
        <Accessibility className="w-5 h-5" />
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-72 z-50 shadow-xl">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              {t.title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{t.highContrast}</span>
              </div>
              <Switch checked={highContrast} onCheckedChange={handleHighContrast} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{t.textToSpeech}</span>
              </div>
              <Switch checked={textToSpeech} onCheckedChange={handleTTS} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{t.fontSize}</span>
              </div>
              <div className="flex gap-2">
                {['small', 'normal', 'large'].map(size => (
                  <Button
                    key={size}
                    variant={fontSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFontSize(size)}
                    className="flex-1"
                  >
                    {t[size]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}