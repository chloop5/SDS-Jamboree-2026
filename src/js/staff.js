const SUPABASE_URL = 'https://onbnxhvmgtvrqqdhwzgu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYm54aHZtZ3R2cnFxZGh3emd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDY0ODYsImV4cCI6MjA3MDIyMjQ4Nn0.5KA7-MBABegAgZDOFkrzDOtNdcZ4dWHJ8H3LVthL-Hk';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mobile navigation for staff-registration.html
document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (navToggle && navLinks) {
    // Toggle mobile menu
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      
      // Change icon between hamburger and X
      const icon = navToggle.querySelector('i');
      if (isOpen) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        const icon = navToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
    
    // Close menu when clicking a link (mobile)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          navLinks.classList.remove('open');
          navToggle.classList.remove('active');
          const icon = navToggle.querySelector('i');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    });
    
    // Handle window resize
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        const icon = navToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  }
});

const staffForm = document.getElementById('staffForm');

// Insert error message container above the submit button if not present
let errorMsg = staffForm.querySelector('.form-error');
if (!errorMsg) {
  errorMsg = document.createElement('div');
  errorMsg.className = 'form-error';
  errorMsg.style.color = 'red';
  errorMsg.style.margin = '0.5rem 0';
  errorMsg.style.fontWeight = 'bold';
  errorMsg.style.display = 'none';
  const submitBtn = staffForm.querySelector('button[type="submit"]');
  staffForm.insertBefore(errorMsg, submitBtn);
}

staffForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  errorMsg.style.display = 'none';
  errorMsg.textContent = '';

  const form = e.target;
  const fullname = form.fullname.value.trim();
  const groupname = form.groupname.value.trim();
  const fileid = form.fileid.value.trim();
  const dob = form.dob.value;
  const gender = form.gender.value;
  const role = form.role.value;
  const email = form.email.value.trim();
  const mobile = form.mobile.value.trim();

  // Validation: min age 19 by year
  const birthYear = new Date(dob).getFullYear();
  const thisYear = new Date().getFullYear();
  if (thisYear - birthYear < 19) {
    errorMsg.textContent = 'Staff must be at least 19 years old.';
    errorMsg.style.display = 'block';
    return;
  }

  if (!fullname || !groupname || !fileid || !dob || !gender || !role || !email || !mobile) {
    errorMsg.textContent = 'Please fill in all required fields.';
    errorMsg.style.display = 'block';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMsg.textContent = 'Please enter a valid email address.';
    errorMsg.style.display = 'block';
    return;
  }

  const { error } = await supabaseClient.from('staff_registrations').insert([{
    fullname,
    groupname,
    fileid,
    dob,
    gender,
    role,
    email,
    mobile
  }]);

  if (error) {
    errorMsg.textContent = 'Registration failed. Please try again.';
    errorMsg.style.display = 'block';
  } else {
    alert('Staff registration successful!');
    form.reset();
    errorMsg.style.display = 'none';
  }
});