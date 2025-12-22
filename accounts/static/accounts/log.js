// =============================
// TAB SWITCHING  (Login page)
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabTriggers.length && tabContents.length) {
    tabTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const tabName = trigger.getAttribute('data-tab');

        tabTriggers.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        trigger.classList.add('active');
        const target = document.getElementById(`${tabName}-tab`);
        if (target) target.classList.add('active');
      });
    });

    // Activate tab from URL hash if present (e.g. #signup)
    const initialHash = location.hash.replace('#', '');
    if (initialHash) {
      const trigger = document.querySelector(
        `.tab-trigger[data-tab="${initialHash}"]`
      );
      if (trigger) trigger.click();
    }
  }



// ROLE SELECTOR (LOGIN PAGE)
// =============================
// ROLE SELECTOR (LOGIN PAGE)
// =============================
const roleCards = document.querySelectorAll('.role-card');
const roleInput = document.getElementById('login-role');

if (roleCards.length && roleInput) {
  // helper to visually select the right card
  function setActiveCard(role) {
    const normalized = role.trim().toLowerCase();
    roleCards.forEach(c => {
      const active = c.dataset.role === normalized;
      c.classList.toggle('selected', active);
      c.setAttribute('aria-pressed', String(active));
    });
  }

  // Pre-select saved role if exists
  const savedRole = localStorage.getItem('diagnocare_role');
  if (savedRole) {
    roleInput.value = savedRole;
    setActiveCard(savedRole);
  } else {
    // default: patient
    roleInput.value = roleInput.value || 'patient';
    setActiveCard(roleInput.value);
  }

  // When user clicks on a card → update textbox + save
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedRole = card.dataset.role;

      roleInput.value = selectedRole;
      setActiveCard(selectedRole);
      localStorage.setItem('diagnocare_role', selectedRole);
    });
  });

  // When user types in the textbox → update cards
  roleInput.addEventListener('input', () => {
    const typed = roleInput.value.trim().toLowerCase();
    setActiveCard(typed);
    if (['patient', 'center', 'admin'].includes(typed)) {
      localStorage.setItem('diagnocare_role', typed);
    }
  });
}




  // =============================
  // SIGNUP VALIDATION (Login page)
  // =============================
  const signupForm = document.getElementById('signup-form');

  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      const fullname = document
        .getElementById('signup-fullname')
        .value.trim();
      const username = document
        .getElementById('signup-username')
        .value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const gender = document.getElementById('signup-gender').value;
      const dob = document.getElementById('signup-dob').value;
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;

      let hasError = false;
      const phoneRegex = /^01[3-9]\d{8}$/;

      if (
        !fullname ||
        !username ||
        !email ||
        !phone ||
        !gender ||
        !dob ||
        !password ||
        !confirm
      ) {
        alert('Please fill in all fields.');
        hasError = true;
      } else if (!phoneRegex.test(phone)) {
        alert('Please enter a valid Bangladeshi phone (e.g., 01XXXXXXXXX).');
        hasError = true;
      } else if (password !== confirm) {
        alert('Passwords do not match.');
        hasError = true;
      }

      if (hasError) {
        // block submission only if invalid
        e.preventDefault();
      }
      // if no error: let Django handle the POST normally
    });
  }
});

// =============================
// CENTER DASHBOARD: STATUS + REPORTS + FILTERS
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const bookingEls = document.querySelectorAll('[data-booking-id]');
  if (!bookingEls.length) return; // not on center dashboard

  const STATUS_KEY  = 'bookingStatus';
  const REPORTS_KEY = 'reports';

  let statusMap = {};
  try {
    statusMap = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
  } catch {
    statusMap = {};
  }

  let reports = [];
  try {
    reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  } catch {
    reports = [];
  }

  const fileInput      = document.getElementById('reportUpload');
  const headerUpload   = document.getElementById('header-upload-trigger');
  let currentBookingId = null;

  // header button just opens file picker (no specific booking)
  if (headerUpload && fileInput) {
    headerUpload.addEventListener('click', () => fileInput.click());
  }

  function saveStatus() {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
  }
  function saveReports() {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }

  function updatePill(pill, status) {
    if (!pill) return;
    pill.dataset.status = status;
    if (status === 'processing') pill.textContent = 'Processing';
    else if (status === 'completed') pill.textContent = 'Completed';
    else pill.textContent = 'Collection';
  }

  function updateCounters() {
    let pending = 0;
    let completed = 0;

    bookingEls.forEach(el => {
      const id = el.dataset.bookingId;
      const status = statusMap[id] || 'collection';
      if (status === 'completed') completed++;
      else pending++;
    });

    const p = document.getElementById('pendingCount');
    const c = document.getElementById('completedCount');
    if (p) p.textContent = pending;
    if (c) c.textContent = completed;
  }

  // initialize each booking row
  bookingEls.forEach(el => {
    const id           = el.dataset.bookingId;
    const statusSelect = el.querySelector('.status-select');
    const statusPill   = el.querySelector('.status-pill');
    const uploadBtn    = el.querySelector('.upload-report-btn');

    const initialStatus = statusMap[id] || 'collection';
    if (statusSelect) statusSelect.value = initialStatus;
    updatePill(statusPill, initialStatus);

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        const val = statusSelect.value;
        statusMap[id] = val;
        updatePill(statusPill, val);
        saveStatus();
        updateCounters();
      });
    }

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        currentBookingId = id;
        fileInput.click();
      });
    }
  });

  // handle actual file selection
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      let row = null;

      if (currentBookingId) {
        row = document.querySelector(`[data-booking-id="${currentBookingId}"]`);
      }

      const entry = {
        bookingId:   currentBookingId || null,
        patientName: row?.dataset.patientName || '',
        test:        row?.dataset.testName   || '',
        date:        row?.dataset.bookingDate || '',
        pdfUrl:      url,
        uploadedAt:  new Date().toISOString()
      };

      reports.push(entry);
      saveReports();
      alert('✅ Report uploaded' + (currentBookingId ? ` for booking #${currentBookingId}` : ''));

      currentBookingId = null;
      e.target.value = '';
    });
  }

  // FILTERS
  const filterButtons = document.querySelectorAll('[data-filter]');
  const todayStr = new Date().toISOString().slice(0, 10);

  function applyFilter(mode) {
    bookingEls.forEach(el => {
      const id     = el.dataset.bookingId;
      const date   = el.dataset.bookingDate;
      const status = statusMap[id] || 'collection';

      let show = true;
      if (mode === 'today') {
        show = date === todayStr;
      } else if (mode === 'pending') {
        show = status !== 'completed';
      } else if (mode === 'completed') {
        show = status === 'completed';
      } // 'all' → true

      el.style.display = show ? 'flex' : 'none';
    });
  }

  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
        applyFilter(btn.dataset.filter);
      });
    });
  }

  // initial counts + default filter
  updateCounters();
  applyFilter('all');
});
  // end center-dashboard IIFE

// =============================
// ROLE SELECTOR
// =============================
// =============================
// ROLE SELECTOR (LOGIN PAGE)


