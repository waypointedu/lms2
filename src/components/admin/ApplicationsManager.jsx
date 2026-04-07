import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Eye, Calendar } from "lucide-react";

export default function ApplicationsManager({ lang = 'en' }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list('-created_date')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => 
      base44.entities.Application.update(id, {
        status,
        admin_notes: notes,
        decision_date: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setViewDialogOpen(false);
    }
  });

  const acceptAndInviteMutation = useMutation({
    mutationFn: async (application) => {
      await updateStatusMutation.mutateAsync({
        id: application.id,
        status: 'accepted',
        notes: 'Accepted and invited to platform'
      });
      
      await base44.users.inviteUser(application.email, 'user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setViewDialogOpen(false);
    }
  });

  const text = {
    en: {
      title: "Applications",
      name: "Name",
      email: "Email",
      status: "Status",
      submitted: "Submitted",
      actions: "Actions",
      view: "View",
      accept: "Accept & Invite",
      decline: "Decline",
      interview: "Schedule Interview",
      waitlist: "Waitlist",
      full_name: "Full Name",
      preferred_name: "Preferred Name",
      location: "Location",
      birth_year: "Birth Year",
      language: "Primary Language",
      education: "Education",
      ministry: "Ministry Experience",
      faith_journey: "Faith Journey",
      why_waypoint: "Why Waypoint",
      tech: "Technology",
      affirmations: "Affirmations",
      admin_notes: "Admin Notes",
      save_notes: "Save Notes",
      statuses: {
        submitted: "Submitted",
        under_review: "Under Review",
        interview_scheduled: "Interview Scheduled",
        accepted: "Accepted",
        waitlisted: "Waitlisted",
        declined: "Declined"
      }
    },
    es: {
      title: "Solicitudes",
      name: "Nombre",
      email: "Correo",
      status: "Estado",
      submitted: "Enviado",
      actions: "Acciones",
      view: "Ver",
      accept: "Aceptar e Invitar",
      decline: "Rechazar",
      interview: "Programar Entrevista",
      waitlist: "Lista de Espera",
      full_name: "Nombre Completo",
      preferred_name: "Nombre Preferido",
      location: "Ubicación",
      birth_year: "Año de Nacimiento",
      language: "Idioma Principal",
      education: "Educación",
      ministry: "Experiencia Ministerial",
      faith_journey: "Camino de Fe",
      why_waypoint: "Por Qué Waypoint",
      tech: "Tecnología",
      affirmations: "Afirmaciones",
      admin_notes: "Notas del Admin",
      save_notes: "Guardar Notas",
      statuses: {
        submitted: "Enviado",
        under_review: "En Revisión",
        interview_scheduled: "Entrevista Programada",
        accepted: "Aceptado",
        waitlisted: "En Lista de Espera",
        declined: "Rechazado"
      }
    }
  };

  const t = text[lang];

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    interview_scheduled: 'bg-purple-100 text-purple-800',
    accepted: 'bg-green-100 text-green-800',
    waitlisted: 'bg-orange-100 text-orange-800',
    declined: 'bg-red-100 text-red-800'
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading applications...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t.title} ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.email}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.submitted}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(app => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.full_name}</TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[app.status]}>
                      {t.statuses[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(app.created_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t.view}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedApp?.full_name}</DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">{t.full_name}</label>
                  <p className="text-slate-900">{selectedApp.full_name}</p>
                </div>
                {selectedApp.preferred_name && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">{t.preferred_name}</label>
                    <p className="text-slate-900">{selectedApp.preferred_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-500">{t.email}</label>
                  <p className="text-slate-900">{selectedApp.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">{t.location}</label>
                  <p className="text-slate-900">{selectedApp.city}, {selectedApp.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">{t.language}</label>
                  <p className="text-slate-900">{selectedApp.primary_language}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">{t.birth_year}</label>
                  <p className="text-slate-900">{selectedApp.birth_year}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">{t.faith_journey}</label>
                <p className="text-slate-900 whitespace-pre-wrap mt-2">{selectedApp.faith_journey}</p>
              </div>

              {selectedApp.education_background && (
                <div>
                  <label className="text-sm font-medium text-slate-500">{t.education}</label>
                  <p className="text-slate-900 mt-2">{selectedApp.education_background}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-500">{t.admin_notes}</label>
                <Textarea
                  defaultValue={selectedApp.admin_notes || ''}
                  onChange={(e) => {
                    setSelectedApp({ ...selectedApp, admin_notes: e.target.value });
                  }}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => acceptAndInviteMutation.mutate(selectedApp)}
                  disabled={acceptAndInviteMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t.accept}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedApp.id,
                    status: 'interview_scheduled',
                    notes: selectedApp.admin_notes
                  })}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t.interview}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedApp.id,
                    status: 'waitlisted',
                    notes: selectedApp.admin_notes
                  })}
                >
                  {t.waitlist}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedApp.id,
                    status: 'declined',
                    notes: selectedApp.admin_notes
                  })}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t.decline}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}