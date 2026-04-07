import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail } from "lucide-react";

export default function CourseInstanceStudentList({ instanceId }) {
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', 'instance', instanceId],
    queryFn: () => base44.entities.Enrollment.filter({ course_instance_id: instanceId }),
    enabled: !!instanceId
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Filter out admin and instructor enrollments
  const studentEnrollments = enrollments.filter(enrollment => {
    const user = users.find(u => u.email === enrollment.user_email);
    if (!user) return true; // Include if user not found
    // Check role field (admin)
    if (user.role === 'admin') return false;
    // Check data.user_type field (custom user types)
    if (user.data?.user_type === 'admin' || user.data?.user_type === 'instructor') return false;
    // Include students and users without user_type set
    return true;
  });

  const enrolledStudents = studentEnrollments.map(enrollment => {
    const user = users.find(u => u.email === enrollment.user_email);
    return {
      ...enrollment,
      user_name: user?.full_name || enrollment.user_email.split('@')[0]
    };
  }).sort((a, b) => a.user_name.localeCompare(b.user_name));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Enrolled Students ({enrolledStudents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrolledStudents.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No students enrolled yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {enrolledStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{student.user_name}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {student.user_email}
                  </p>
                </div>
                <Badge variant={student.status === 'completed' ? 'default' : 'outline'}>
                  {student.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}