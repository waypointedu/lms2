import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, LogOut, User as UserIcon } from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';

export default function AccountSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState(urlParams.get('lang') || localStorage.getItem('waypoint_lang') || 'en');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    mailing_address: '',
    city: '',
    country: '',
    bio: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFormData({
        display_name: u.display_name || '',
        phone: u.phone || '',
        mailing_address: u.mailing_address || '',
        city: u.city || '',
        country: u.country || '',
        bio: u.bio || ''
      });
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      alert(lang === 'es' ? 'Perfil actualizado' : 'Profile updated');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const getDashboardUrl = () => {
    if (!user) return createPageUrl('Home');
    if (user.role === 'admin' || user.user_type === 'admin') {
      return createPageUrl(`Admin?lang=${lang}`);
    } else if (user.user_type === 'instructor') {
      return createPageUrl(`InstructorDashboard?lang=${lang}`);
    }
    return createPageUrl(`Dashboard?lang=${lang}`);
  };

  const text = {
    en: {
      title: "Account Settings",
      back: "Back to Dashboard",
      accountInfo: "Account Information",
      email: "Email",
      fullName: "Full Name",
      displayName: "Display Name",
      phone: "Phone Number",
      address: "Mailing Address",
      city: "City",
      country: "Country",
      bio: "Bio",
      save: "Save Changes",
      logout: "Log Out",
      emailNote: "Email and full name cannot be changed here"
    },
    es: {
      title: "Configuración de Cuenta",
      back: "Volver al Panel",
      accountInfo: "Información de Cuenta",
      email: "Correo Electrónico",
      fullName: "Nombre Completo",
      displayName: "Nombre de Usuario",
      phone: "Teléfono",
      address: "Dirección Postal",
      city: "Ciudad",
      country: "País",
      bio: "Biografía",
      save: "Guardar Cambios",
      logout: "Cerrar Sesión",
      emailNote: "El correo y nombre completo no se pueden cambiar aquí"
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69826d34529ac930f0c94f5a/f6dc8e0ae_waypoint-logo-transparent.png" 
              alt="Waypoint Institute" 
              className="h-10" 
            />
          </Link>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to={getDashboardUrl()}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <h1 className="text-3xl font-light text-slate-900 mb-8">{t.title}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.accountInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.email}</Label>
                <Input value={user.email} disabled className="bg-slate-100" />
              </div>

              <div>
                <Label>{t.fullName}</Label>
                <Input value={user.full_name} disabled className="bg-slate-100" />
              </div>

              <p className="text-sm text-slate-500">{t.emailNote}</p>

              <div>
                <Label>{t.displayName}</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder={user.full_name}
                />
              </div>

              <div>
                <Label>{t.phone}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label>{t.address}</Label>
                <Input
                  value={formData.mailing_address}
                  onChange={(e) => setFormData({ ...formData, mailing_address: e.target.value })}
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.city}</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.country}</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{t.bio}</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder={lang === 'es' ? 'Cuéntanos sobre ti...' : 'Tell us about yourself...'}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t.logout}
            </Button>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? '...' : t.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}