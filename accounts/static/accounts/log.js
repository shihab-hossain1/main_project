// =============================
// TAB SWITCHING
// =============================
const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabContents = document.querySelectorAll('.tab-content');

if (tabTriggers && tabContents) {
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
// ROLE SELECTOR
// =============================
const roleCards = document.querySelectorAll('.role-card');
const roleHidden = document.getElementById('login-role');

if (roleCards && roleHidden) {
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove selection from all
      roleCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });

      // Activate selected
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');

      // Set hidden input value
      roleHidden.value = card.dataset.role;
    });
  });
}

// =============================
// SIGNUP (NO PREVENT DEFAULT)
// We let Django handle form submission
// =============================
// IMPORTANT: DO NOT BLOCK FORM SUBMISSION!
// So we DO NOT use e.preventDefault()

// (We removed your old mock signup handler completely)


// =============================
// URL HASH TAB ACTIVATOR
// =============================
const initialHash = location.hash.replace('#', '');
if (initialHash) {
  const trigger = document.querySelector(`.tab-trigger[data-tab="${initialHash}"]`);
  if (trigger) trigger.click();
}
