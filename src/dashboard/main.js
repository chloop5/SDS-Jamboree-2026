// Initialize Supabase client
const SUPABASE_URL = 'https://onbnxhvmgtvrqqdhwzgu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYm54aHZtZ3R2cnFxZGh3emd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDY0ODYsImV4cCI6MjA3MDIyMjQ4Nn0.5KA7-MBABegAgZDOFkrzDOtNdcZ4dWHJ8H3LVthL-Hk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchSummary() {
  // Fetch participant registrations count
  const { count: participantRegs, error: participantError } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true });

  // Fetch staff registrations count
  const { count: staffRegs, error: staffError } = await supabase
    .from('staff_registrations')
    .select('*', { count: 'exact', head: true });

  if (staffError || participantError) {
    console.error('Error fetching summary:', staffError || participantError);
    return;
  }

  // Calculate total registrations as sum of staff and participant
  const totalRegs = (participantRegs || 0) + (staffRegs || 0);

  document.getElementById('total-registrations').textContent = totalRegs;
  document.getElementById('staff-registrations').textContent = staffRegs;
  document.getElementById('participant-registrations').textContent = participantRegs;
}

async function fetchRecentRegistrations() {
  // Fetch recent registrations from both tables, limit 10, ordered by created_at descending
  const { data: staffData, error: staffError } = await supabase
    .from('staff_registrations')
    .select('fullname, groupname, dob, role, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: participantData, error: participantError } = await supabase
    .from('registrations')
    .select('fullname, groupname, participant, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (staffError || participantError) {
    console.error('Error fetching recent registrations:', staffError || participantError);
    return;
  }

  // Combine and sort by created_at descending
  const combined = [];

  if (staffData) {
    staffData.forEach(item => {
      combined.push({
        name: item.fullname,
        type: 'Staff',
        group: item.groupname,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        roleOrParticipant: item.role || '',
        email: item.email
      });
    });
  }

  if (participantData) {
    participantData.forEach(item => {
      combined.push({
        name: item.fullname,
        type: 'Participant',
        group: item.groupname,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        roleOrParticipant: item.participant || '',
        email: item.email
      });
    });
  }

  combined.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limit to 10
  const recent = combined.slice(0, 10);

  const tbody = document.querySelector('#registrations-table tbody');
  tbody.innerHTML = '';

  recent.forEach(reg => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${reg.name}</td>
      <td>${reg.type}</td>
      <td>${reg.group}</td>
      <td>${reg.date}</td>
      <td>${reg.roleOrParticipant}</td>
      <td>${reg.email}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSummary();
  fetchRecentRegistrations();
});
