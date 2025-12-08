// Run everything only after DOM is ready
document.addEventListener('DOMContentLoaded', () => {

  // =============================
  // TAB SWITCHING (login / signup)
  // =============================
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
  }

  // =============================
  // ROLE SELECTOR (Patient / Center / Admin)
  // =============================
  const roleCards = document.querySelectorAll('.role-card');
  const roleHidden = document.getElementById('login-role');

  if (roleCards.length && roleHidden) {
    // Pre-select saved role if exists
    const savedRole = localStorage.getItem('diagnocare_role');
    if (savedRole) {
      roleHidden.value = savedRole;
      roleCards.forEach(c => {
        const active = c.dataset.role === savedRole;
        c.classList.toggle('selected', active);
        c.setAttribute('aria-pressed', String(active));
      });
    }

    roleCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove selection from all
        roleCards.forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
        });

        // Activate clicked one
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');

        // Set hidden input value
        const selectedRole = card.dataset.role;
        roleHidden.value = selectedRole;

        // Remember selection locally
        localStorage.setItem('diagnocare_role', selectedRole);
      });
    });
  }

  // =============================
  // SIGNUP VALIDATION (LET DJANGO SUBMIT IF OK)
  // =============================
  const signupForm = document.getElementById('signup-form');

  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      const fullname = document.getElementById('signup-fullname').value.trim();
      const username = document.getElementById('signup-username').value.trim();
      const email    = document.getElementById('signup-email').value.trim();
      const phone    = document.getElementById('signup-phone').value.trim();
      const gender   = document.getElementById('signup-gender').value;
      const dob      = document.getElementById('signup-dob').value;
      const password = document.getElementById('signup-password').value;
      const confirm  = document.getElementById('signup-confirm').value;

      let hasError = false;
      const phoneRegex = /^01[3-9]\d{8}$/;

      if (!fullname || !username || !email || !phone || !gender || !dob || !password || !confirm) {
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
        e.preventDefault(); // block submission only if invalid
      }
    });
  }

  // =============================
  // URL HASH TAB ACTIVATOR (#signup)
  // =============================
  const initialHash = location.hash.replace('#', '');
  if (initialHash) {
    const trigger = document.querySelector(`.tab-trigger[data-tab="${initialHash}"]`);
    if (trigger) trigger.click();
  }

  // =============================
  // CENTER DASHBOARD: STATUS + REPORTS + FILTERS
  // (runs only on center-dashboard.html where [data-booking-id] exists)
  // =============================
  const bookingEls = document.querySelectorAll('[data-booking-id]');
  if (bookingEls.length) {
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

    const fileInput = document.getElementById('reportUpload');
    let currentBookingId = null;

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

    // init each booking row
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
        });
      }

      if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
          currentBookingId = id;
          fileInput.click();
        });
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file || !currentBookingId) return;

        const url = URL.createObjectURL(file);
        const row = document.querySelector(`[data-booking-id="${currentBookingId}"]`);

        const entry = {
          bookingId:   currentBookingId,
          patientName: row?.dataset.patientName || '',
          test:        row?.dataset.testName   || '',
          date:        row?.dataset.bookingDate || '',
          pdfUrl:      url,
          uploadedAt:  new Date().toISOString()
        };

        reports.push(entry); // multiple per booking allowed
        saveReports();

        alert('✅ Report uploaded for booking #' + currentBookingId);
        e.target.value = '';
      });
    }

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
        } else {
          show = true;
        }

        el.style.display = show ? 'flex' : 'none';
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
        applyFilter(btn.dataset.filter);
      });
    });

    applyFilter('all'); // default
  }

}); // end DOMContentLoaded
