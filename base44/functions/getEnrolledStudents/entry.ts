import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { courseId, courseInstanceId, lookupEmails } = body;

  // Allow looking up display names for any list of emails (e.g. instructors)
  if (lookupEmails) {
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    allUsers.forEach(u => { userMap[u.email] = u; });
    const result = lookupEmails.map(email => ({
      email,
      display_name: userMap[email]?.full_name || email.split('@')[0]
    }));
    return Response.json({ users: result });
  }

  if (!courseId) return Response.json({ error: 'courseId required' }, { status: 400 });

  // Fetch enrollments
  let enrollments = [];
  if (courseInstanceId) {
    enrollments = await base44.asServiceRole.entities.Enrollment.filter({ course_instance_id: courseInstanceId });
  } else {
    enrollments = await base44.asServiceRole.entities.Enrollment.filter({ course_id: courseId });
  }

  // Filter out instructor emails
  let instructorEmails = [];
  if (courseInstanceId) {
    const instances = await base44.asServiceRole.entities.CourseInstance.filter({ id: courseInstanceId });
    instructorEmails = instances[0]?.instructor_emails || [];
  }

  const studentEnrollments = enrollments.filter(e => !instructorEmails.includes(e.user_email));

  // Deduplicate by user_email
  const seen = new Set();
  const uniqueEnrollments = studentEnrollments.filter(e => {
    if (seen.has(e.user_email)) return false;
    seen.add(e.user_email);
    return true;
  });

  // Fetch all users with service role (bypasses security restriction)
  const allUsers = await base44.asServiceRole.entities.User.list();
  const userMap = {};
  allUsers.forEach(u => { userMap[u.email] = u; });

  // Build result with display names
  const students = uniqueEnrollments.map(enrollment => {
    const u = userMap[enrollment.user_email];
    return {
      ...enrollment,
      display_name: u?.full_name || enrollment.user_email.split('@')[0]
    };
  });

  return Response.json({ students });
});