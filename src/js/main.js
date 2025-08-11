// Initialize Supabase
const SUPABASE_URL = 'https://onbnxhvmgtvrqqdhwzgu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYm54aHZtZ3R2cnFxZGh3emd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDY0ODYsImV4cCI6MjA3MDIyMjQ4Nn0.5KA7-MBABegAgZDOFkrzDOtNdcZ4dWHJ8H3LVthL-Hk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Countdown Timer for Jamboree Date
function startCountdown() {
  const eventDate = new Date('2026-05-01T00:00:00');
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;

  function updateCountdown() {
    const now = new Date();
    const diff = eventDate - now;

    if (diff <= 0) {
      countdownEl.innerHTML = `<i class="fas fa-flag-checkered"></i> The Jamboree has started!`;
      clearInterval(timer);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownEl.innerHTML =
      `<i class="fas fa-hourglass-half"></i> Days:${days} | Hours:${hours} | Minutes:${minutes} | Seconds:${seconds}`;
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadActivities();
  startCountdown();
});

async function loadActivities() {
  const { data, error } = await supabaseClient
    .from('activities')
    .select('*');

  const activitiesList = document.getElementById('activities-list');
  const checkboxesContainer = document.querySelector('.activities-checkboxes');

  // Clear previous content
  if (activitiesList) activitiesList.innerHTML = '<h2><i class="fas fa-campground"></i> Featured Activities</h2>';
  if (checkboxesContainer) checkboxesContainer.innerHTML = '';

  if (error) {
    if (activitiesList) activitiesList.innerHTML += '<p>Error loading activities.</p>';
    return;
  }

  if (!data || data.length === 0) {
    if (activitiesList) activitiesList.innerHTML += '<p>No activities found.</p>';
    return;
  }

  // Sort activities alphabetically by name
  data.sort((a, b) => a.name.localeCompare(b.name));

  data.forEach(activity => {
    // Render activity cards
    const percent = Math.round(
      ((activity.seats_total - activity.seats_left) / activity.seats_total) * 100
    );
    const card = document.createElement('div');
    card.className = 'activity-card';
    card.innerHTML = `
      <h3>${activity.name}</h3>
      <p>${activity.description}</p>
      <div class="seats-info">
        <span><i class="fas fa-users"></i> Seats left: <span class="seats-left">${activity.seats_left}</span>/${activity.seats_total}</span>
        <div class="progress-bar"><div class="progress" style="width: ${percent}%"></div></div>
      </div>
    `;
    if (activitiesList) activitiesList.appendChild(card);

    // Render dynamic checkboxes
    if (checkboxesContainer) {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" name="activities" value="${activity.name}"> ${activity.name}
      `;
      checkboxesContainer.appendChild(label);
    }
  });
}

document.addEventListener('DOMContentLoaded', loadActivities);




// Limit activity selection to 3
document.addEventListener('change', function (e) {
  if (e.target.name === 'activities') {
    const checked = document.querySelectorAll('.activities-checkboxes input[type="checkbox"]:checked');
    if (checked.length > 3) {
      e.target.checked = false;
      alert('You can select up to 3 activities only.');
    }
  }
});

// Form validation and submission

document.querySelector('.registration-form form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const fullname = form.fullname.value.trim();
  const groupname = form.groupname.value.trim();
  const fileid = form.fileid.value.trim();
  const participant = form.participant.value;
  const age = parseInt(form.age.value, 10);
  const gender = form.gender.value;
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const activities = Array.from(form.querySelectorAll('input[name="activities"]:checked')).map(cb => cb.value);

  // Validation
  if (!fullname || !groupname || !fileid || !participant || !age || !gender || !email || !phone) {
    alert('Please fill in all required fields.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    return;
  }
  if (age < 7) {
    alert('Minimum age is 7.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    return;
  }
  if (activities.length === 0 || activities.length > 3) {
    alert('Please select up to 3 activities.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    return;
  }

  // Insert registration into Supabase
  const { error } = await supabaseClient.from('registrations').insert([{
    fullname,
    groupname,
    fileid,
    participant,
    age,
    gender,
    email,
    phone,
    activities
  }]);

  if (error) {
    alert('Registration failed. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    return;
  }

  // Update seats_left for each selected activity
  for (const activityName of activities) {
    // Get the activity row by name
    const { data: activityRows, error: fetchError } = await supabaseClient
      .from('activities')
      .select('id,seats_left')
      .eq('name', activityName)
      .limit(1);

    if (fetchError || !activityRows || activityRows.length === 0) continue;

    const activity = activityRows[0];
    if (activity.seats_left > 0) {
      await supabaseClient
        .from('activities')
        .update({ seats_left: activity.seats_left - 1 })
        .eq('id', activity.id);
    }
  }

  alert('Registration successful!');
  form.reset();
  loadActivities();
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Registration';
});

document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }
  
});