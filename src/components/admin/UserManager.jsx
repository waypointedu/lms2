import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Shield, User } from "lucide-react";

export default function UserManager({ lang = 'en' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date')
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Invite with built-in role (admin or user)
      const builtInRole = inviteRole === 'admin' ? 'admin' : 'user';
      const result = await base44.users.inviteUser(inviteEmail, builtInRole);
      
      // Wait a moment then update with extended user_type
      setTimeout(async () => {
        const users = await base44.entities.User.filter({ email: inviteEmail });
        if (users[0]) {
          await base44.entities.User.update(users[0].id, { user_type: inviteRole });
        }
      }, 2000);
      
      return result;
    },
    onSuccess: () => {
      alert(lang === 'es' ? 'Invitación enviada exitosamente' : 'Invitation sent successfully!');
      setInviteEmail('');
      setInviteRole('student');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      }, 2500);
    },
    onError: (error) => {
      alert(lang === 'es' ? `Error al enviar invitación: ${error.message}` : `Failed to send invitation: ${error.message}`);
      console.error('Invite error:', error);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, userType }) => {
      // Set both user_type and built-in role (admin or user)
      const builtInRole = userType === 'admin' ? 'admin' : 'user';
      return await base44.entities.User.update(id, { 
        user_type: userType,
        role: builtInRole 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error) => {
      alert(lang === 'es' ? `Error: ${error.message}` : `Error: ${error.message}`);
    }
  });

  const filteredUsers = users.filter(u => {
    const search = searchQuery.toLowerCase();
    return u.email?.toLowerCase().includes(search) || u.full_name?.toLowerCase().includes(search);
  });

  const text = {
    en: {
      title: "User Management",
      search: "Search users...",
      email: "Email",
      role: "Role",
      joined: "Joined",
      actions: "Actions",
      inviteUser: "Invite User",
      emailPlaceholder: "user@example.com",
      selectRole: "Select role",
      invite: "Send Invite",
      changeRole: "Change Role",
      admin: "Admin",
      instructor: "Instructor",
      student: "Student",
      noUsers: "No users found."
    },
    es: {
      title: "Gestión de Usuarios",
      search: "Buscar usuarios...",
      email: "Correo",
      role: "Rol",
      joined: "Fecha de registro",
      actions: "Acciones",
      inviteUser: "Invitar Usuario",
      emailPlaceholder: "usuario@ejemplo.com",
      selectRole: "Seleccionar rol",
      invite: "Enviar Invitación",
      changeRole: "Cambiar Rol",
      admin: "Admin",
      instructor: "Instructor",
      student: "Estudiante",
      noUsers: "No se encontraron usuarios."
    }
  };

  const t = text[lang];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t.title}</h2>

      {/* Invite User */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#1e3a5f]" />
          {t.inviteUser}
        </h3>
        <div className="flex gap-3">
          <Input
            placeholder={t.emailPlaceholder}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.selectRole} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">{t.student}</SelectItem>
              <SelectItem value="instructor">{t.instructor}</SelectItem>
              <SelectItem value="admin">{t.admin}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteEmail || inviteMutation.isPending}
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
          >
            {t.invite}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>{t.email}</TableHead>
              <TableHead>{lang === 'es' ? 'Nombre' : 'Name'}</TableHead>
              <TableHead>{t.role}</TableHead>
              <TableHead>{t.joined}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e3a5f] mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  {t.noUsers}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || '—'}</TableCell>
                  <TableCell>
                    <Badge className={
                      (user.user_type || user.role) === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      user.user_type === 'instructor' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {(user.user_type || user.role) === 'admin' ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : (
                        <User className="w-3 h-3 mr-1" />
                      )}
                      {(user.user_type || user.role) === 'admin' ? t.admin : user.user_type === 'instructor' ? t.instructor : t.student}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(user.created_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.user_type || user.role}
                      onValueChange={(userType) => updateRoleMutation.mutate({ id: user.id, userType })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{t.student}</SelectItem>
                        <SelectItem value="instructor">{t.instructor}</SelectItem>
                        <SelectItem value="admin">{t.admin}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}