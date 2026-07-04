// State variables
let currentUser = null;
let fullHistory = [];

// DOM Elements
const sectionAuth = document.getElementById('section-auth');
const sectionProfile = document.getElementById('section-profile');
const navBtnAuth = document.getElementById('nav-btn-auth');
const navBtnProfile = document.getElementById('nav-btn-profile');
const navBtnLogout = document.getElementById('nav-btn-logout');

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const tabBtnLogin = document.getElementById('tab-btn-login');
const tabBtnRegister = document.getElementById('tab-btn-register');

const loginErrorAlert = document.getElementById('login-error-alert');
const registerErrorAlert = document.getElementById('register-error-alert');
const registerSuccessAlert = document.getElementById('register-success-alert');

const loginHistoryTbody = document.getElementById('login-history-tbody');
const historyEmptyState = document.getElementById('history-empty-state');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
});

// Check if user has an active session
async function checkAuthSession() {
  try {
    const response = await fetch('/api/auth/login-history');
    if (response.ok) {
      const data = await response.json();
      fullHistory = data.history || [];
      if (fullHistory.length > 0 && fullHistory[0].user) {
        currentUser = fullHistory[0].user;
      } else {
        currentUser = {
          name: localStorage.getItem('user_name') || 'Registered User',
          email: localStorage.getItem('user_email') || 'user@example.com',
          phone: localStorage.getItem('user_phone') || 'Not provided',
          language: localStorage.getItem('user_language') || 'en',
          isPremium: localStorage.getItem('user_premium') === 'true',
          currentPlan: localStorage.getItem('user_plan') || 'Free'
        };
      }
      showProfilePage();
    } else {
      showAuthPage();
    }
  } catch (error) {
    console.error('Session check failed:', error);
    showAuthPage();
  }
}

// Show/Hide page sections
function switchTab(tabName) {
  if (tabName === 'auth') {
    sectionAuth.classList.add('active');
    sectionProfile.classList.add('hidden');
    sectionProfile.classList.remove('active');
  } else if (tabName === 'profile') {
    if (!currentUser) return;
    sectionProfile.classList.add('active');
    sectionProfile.classList.remove('hidden');
    sectionAuth.classList.remove('active');
    sectionAuth.classList.add('hidden');
    navBtnAuth.classList.remove('active');
    navBtnProfile.classList.add('active');
    loadLoginHistory();
  }
}

function showAuthPage() {
  currentUser = null;
  sectionAuth.classList.add('active');
  sectionAuth.classList.remove('hidden');
  sectionProfile.classList.add('hidden');
  sectionProfile.classList.remove('active');
  navBtnAuth.classList.add('active');
  navBtnProfile.classList.add('hidden');
  navBtnLogout.classList.add('hidden');
}

function showProfilePage() {
  if (!currentUser) return;
  document.getElementById('user-display-name').textContent = currentUser.name;
  document.getElementById('user-display-email').textContent = currentUser.email;
  document.getElementById('user-display-phone').textContent = currentUser.phone || 'Not provided';
  document.getElementById('user-display-lang').textContent = getLanguageName(currentUser.language);
  const premiumEl = document.getElementById('user-display-premium');
  if (currentUser.isPremium) {
    premiumEl.textContent = 'Premium Member';
    premiumEl.className = 'meta-value badge-premium';
  } else {
    premiumEl.textContent = 'Free Member';
    premiumEl.className = 'meta-value';
  }
  const planEl = document.getElementById('user-display-plan');
  planEl.textContent = currentUser.currentPlan || 'Free';
  localStorage.setItem('user_name', currentUser.name);
  localStorage.setItem('user_email', currentUser.email);
  localStorage.setItem('user_phone', currentUser.phone || '');
  localStorage.setItem('user_language', currentUser.language || 'en');
  localStorage.setItem('user_premium', currentUser.isPremium);
  localStorage.setItem('user_plan', currentUser.currentPlan || 'Free');
  sectionAuth.classList.add('hidden');
  sectionAuth.classList.remove('active');
  sectionProfile.classList.add('active');
  sectionProfile.classList.remove('hidden');
  navBtnAuth.classList.remove('active');
  navBtnAuth.classList.add('hidden');
  navBtnProfile.classList.remove('hidden');
  navBtnProfile.classList.add('active');
  navBtnLogout.classList.remove('hidden');
  loadLoginHistory();
}

function getLanguageName(code) {
  const mapping = {
    en: 'English 🇺🇸',
    es: 'Español 🇪🇸',
    hi: 'हिन्दी 🇮🇳',
    pt: 'Português 🇵🇹',
    zh: '中文 🇨🇳',
    fr: 'Français 🇫🇷'
  };
  return mapping[code] || code;
}

function setAuthMode(mode) {
  loginErrorAlert.classList.add('hidden');
  registerErrorAlert.classList.add('hidden');
  registerSuccessAlert.classList.add('hidden');
  if (mode === 'login') {
    tabBtnLogin.classList.add('active');
    tabBtnRegister.classList.remove('active');
    formLogin.classList.add('active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    formRegister.classList.remove('active');
  } else {
    tabBtnRegister.classList.add('active');
    tabBtnLogin.classList.remove('active');
    formRegister.classList.add('active');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    formLogin.classList.remove('active');
  }
}
function loadLoginHistory() {}
