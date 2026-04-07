import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThumbsUp, MessageCircle, Lightbulb, Heart, Star } from "lucide-react";

export default function PeerEndorsementButton({ endorsedUserEmail, courseId, lang = 'en' }) {
  const [showSuccess, setShowSuccess] = useState(false);

  const endorseMutation = useMutation({
    mutationFn: (type) => base44.entities.PeerEndorsement.create({
      endorsed_user_email: endorsedUserEmail,
      endorsement_type: type,
      course_id: courseId,
      anonymous: true
    }),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  });

  const types = {
    en: [
      { type: 'helpful_discussion', label: 'Helpful in Discussion', icon: MessageCircle },
      { type: 'encouraging_word', label: 'Encouraging', icon: Heart },
      { type: 'insightful_comment', label: 'Insightful', icon: Lightbulb },
      { type: 'prayerful_support', label: 'Prayerful', icon: Star },
      { type: 'excellent_capstone', label: 'Excellent Capstone', icon: ThumbsUp }
    ],
    es: [
      { type: 'helpful_discussion', label: 'Útil en Discusión', icon: MessageCircle },
      { type: 'encouraging_word', label: 'Alentador', icon: Heart },
      { type: 'insightful_comment', label: 'Perspicaz', icon: Lightbulb },
      { type: 'prayerful_support', label: 'Oración', icon: Star },
      { type: 'excellent_capstone', label: 'Excelente Capstone', icon: ThumbsUp }
    ]
  };

  const t = types[lang] || types.en;

  if (showSuccess) {
    return (
      <div className="inline-flex items-center gap-2 text-green-600 text-sm">
        <ThumbsUp className="w-4 h-4" />
        {lang === 'es' ? 'Enviado!' : 'Sent!'}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <ThumbsUp className="w-4 h-4" />
          {lang === 'es' ? 'Reconocer' : 'Recognize'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {t.map(({ type, label, icon: Icon }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => endorseMutation.mutate(type)}
            disabled={endorseMutation.isPending}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}