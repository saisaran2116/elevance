// State variables
let currentUser = null;
let fullHistory = [];
let otpEmail = null;
let otpTimerInterval = null;
let otpSecondsRemaining = 60;

// DOM Elements
const sectionAuth = document.getElementById('section-auth');
const sectionProfile = document.getElementById('section-profile');
const navBtnAuth = document.getElementById('nav-btn-auth');
const navBtnProfile = document.getElementById('nav-btn-profile');
const navBtnLogout = document.getElementById('nav-btn-logout');

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formOtp = document.getElementById('form-otp');
const tabBtnLogin = document.getElementById('tab-btn-login');
const tabBtnRegister = document.getElementById('tab-btn-register');

const loginErrorAlert = document.getElementById('login-error-alert');
const registerErrorAlert = document.getElementById('register-error-alert');
const registerSuccessAlert = document.getElementById('register-success-alert');
const otpErrorAlert = document.getElementById('otp-error-alert');
const otpSuccessAlert = document.getElementById('otp-success-alert');

const otpEmailDisplay = document.getElementById('otp-email-display');
const otpTimerText = document.getElementById('otp-timer-text');
const otpTimerSeconds = document.getElementById('otp-timer-seconds');
const btnOtpResend = document.getElementById('btn-otp-resend');

const loginHistoryTbody = document.getElementById('login-history-tbody');
const historyEmptyState = document.getElementById('history-empty-state');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
});

// Check if user has an active session
async function checkAuthSession() {
  try {
    // Try to load login history - if it succeeds, user is already logged in
    const response = await fetch('/api/auth/login-history');
    if (response.ok) {
      const data = await response.json();
      fullHistory = data.history || [];
      
      // Since login-history returned OK, user is authenticated. Let's try to infer user details.
      // Wait, we can fetch profile details if we want, or reconstruct from history logs or first log.
      // The backend doesn't have a direct profile endpoint, but the latest success log will have the user's latest login.
      // We can also find user details from the first record or just mock/infer them.
      // Wait, let's see if we should request the user info. Let's inspect the history response first.
      if (fullHistory.length > 0 && fullHistory[0].user) {
        currentUser = fullHistory[0].user;
      } else {
        // Fallback: decode or read user info if available, or fetch a dummy to establish user details
        currentUser = {
          name: localStorage.getItem('user_name') || 'Registered User',
          email: localStorage.getItem('user_email') || 'user@example.com',
          phone: localStorage.getItem('user_phone') || 'Not provided',
          language: localStorage.getItem('user_language') || 'en',
          isPremium: localStorage.getItem('user_premium') === 'true',
          currentPlan: localStorage.getItem('user_plan') || 'Free'
        };
      }
      
      // Update global language to match user preference
      if (currentUser && currentUser.language && typeof changeLanguage === 'function') {
        changeLanguage(currentUser.language);
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
    
    // Update navigation states
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
  
  // Fill in profile information
  document.getElementById('user-display-name').textContent = currentUser.name;
  document.getElementById('user-display-email').textContent = currentUser.email;
  document.getElementById('user-display-phone').textContent = currentUser.phone || i18next.t('profile.not_provided');
  document.getElementById('user-display-lang').textContent = getLanguageName(currentUser.language);
  
  const premiumEl = document.getElementById('user-display-premium');
  if (currentUser.isPremium) {
    premiumEl.textContent = i18next.t('profile.premium_member');
    premiumEl.className = 'meta-value badge-premium';
  } else {
    premiumEl.textContent = i18next.t('profile.free_member');
    premiumEl.className = 'meta-value';
  }
  
  const planEl = document.getElementById('user-display-plan');
  planEl.textContent = currentUser.currentPlan || 'Free';
  
  // Save details in localStorage as fallback
  localStorage.setItem('user_name', currentUser.name);
  localStorage.setItem('user_email', currentUser.email);
  localStorage.setItem('user_phone', currentUser.phone || '');
  localStorage.setItem('user_language', currentUser.language || 'en');
  localStorage.setItem('user_premium', currentUser.isPremium);
  localStorage.setItem('user_plan', currentUser.currentPlan || 'Free');

  // Sync to window.currentUser for i18n manager
  window.currentUser = currentUser;

  // Toggle Visibility
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

// Map short language codes to full names
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

// Switch between login and register sub-tabs inside Auth Card
function setAuthMode(mode) {
  loginErrorAlert.classList.add('hidden');
  registerErrorAlert.classList.add('hidden');
  registerSuccessAlert.classList.add('hidden');
  otpErrorAlert.classList.add('hidden');
  otpSuccessAlert.classList.add('hidden');
  formOtp.classList.add('hidden');
  formOtp.classList.remove('active');
  clearInterval(otpTimerInterval);

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

// Advanced Client-side Device Type Heuristics (Desktop vs Laptop vs Mobile)
async function getDeviceType() {
  const ua = navigator.userAgent;
  
  // 1. Mobile Check
  if (/mobi|android|iphone|ipad|ipod|windows phone/i.test(ua)) {
    return 'mobile';
  }

  // 2. Laptop Check using Battery Status API
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      
      // On desktop, the battery API might report a fully charged (100% / 1.0) charging battery
      // where chargingTime is 0 and dischargingTime is Infinity.
      // If a battery exists and is discharging (charging is false), OR level is not exactly 1.0,
      // OR dischargingTime is a finite number, then the device is highly likely a laptop.
      const isDesktopBattery = battery.charging === true && 
                               battery.level === 1 && 
                               battery.chargingTime === 0 && 
                               battery.dischargingTime === Infinity;
                               
      // Also combine with screen size heuristics
      const isLaptopScreen = window.screen.width <= 1600 && window.screen.height <= 1000;
      const hasTouch = navigator.maxTouchPoints > 0;
      
      if (!isDesktopBattery || isLaptopScreen || hasTouch) {
        return 'laptop';
      }
    } catch (e) {
      // API call failed/blocked, proceed to other heuristics
    }
  }

  // 3. Screen and Resolution Heuristic fallback
  // Laptops usually have screens between 11" and 17" (typically 1280x800 up to 1920x1080)
  // Large desktop monitors are often 1920x1080 or larger, but with high density/scaling
  // We can check common laptop viewport sizes
  const isLikelyLaptop = window.screen.width >= 1024 && 
                         window.screen.width <= 1600 && 
                         window.screen.height <= 1050;
                         
  if (isLikelyLaptop) {
    return 'laptop';
  }

  return 'desktop';
}

// Handle login submission
async function submitLogin(e) {
  e.preventDefault();
  loginErrorAlert.classList.add('hidden');
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  // Spinner state
  const btn = document.getElementById('btn-login-submit');
  const btnOriginalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...`;

  try {
    const deviceType = await getDeviceType();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, deviceType }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      if (data.requireOtp) {
        // Transition to OTP screen
        formLogin.classList.add('hidden');
        formLogin.classList.remove('active');
        formOtp.classList.add('active');
        formOtp.classList.remove('hidden');
        
        otpEmail = email;
        otpEmailDisplay.textContent = email;
        
        // Start countdown timer (defined in next commit)
        if (typeof startOtpCountdown === 'function') {
          startOtpCountdown();
        }
        formLogin.reset();
      } else {
        currentUser = data.user;
        if (currentUser && currentUser.language && typeof changeLanguage === 'function') {
          changeLanguage(currentUser.language);
        }
        showProfilePage();
        formLogin.reset();
      }
    } else {
      loginErrorAlert.textContent = data.message || 'Login failed. Please verify credentials.';
      loginErrorAlert.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Login request error:', err);
    loginErrorAlert.textContent = 'Server connection failed. Please try again.';
    loginErrorAlert.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = btnOriginalText;
  }
}

// Handle OTP submission
async function submitOTP(e) {
  e.preventDefault();
  otpErrorAlert.classList.add('hidden');
  otpSuccessAlert.classList.add('hidden');

  const otp = document.getElementById('otp-code').value;
  if (!otp || otp.length !== 6) {
    otpErrorAlert.textContent = 'Please enter a 6-digit OTP code.';
    otpErrorAlert.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-otp-submit');
  const btnOriginalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...`;

  try {
    const deviceType = await getDeviceType();
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: otpEmail, otp, deviceType }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      clearInterval(otpTimerInterval);
      currentUser = data.user;
      if (currentUser && currentUser.language && typeof changeLanguage === 'function') {
        changeLanguage(currentUser.language);
      }
      showProfilePage();
      formOtp.reset();
      setAuthMode('login');
    } else {
      otpErrorAlert.textContent = data.message || 'OTP verification failed. Please try again.';
      otpErrorAlert.classList.remove('hidden');
    }
  } catch (err) {
    console.error('OTP verification error:', err);
    otpErrorAlert.textContent = 'Server connection failed. Please try again.';
    otpErrorAlert.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = btnOriginalText;
  }
}

// Start OTP resend countdown timer
function startOtpCountdown() {
  clearInterval(otpTimerInterval);
  otpSecondsRemaining = 60;
  
  otpTimerText.classList.remove('hidden');
  btnOtpResend.classList.add('hidden');
  otpTimerSeconds.textContent = otpSecondsRemaining;

  otpTimerInterval = setInterval(() => {
    otpSecondsRemaining--;
    otpTimerSeconds.textContent = otpSecondsRemaining;
    
    if (otpSecondsRemaining <= 0) {
      clearInterval(otpTimerInterval);
      otpTimerText.classList.add('hidden');
      btnOtpResend.classList.remove('hidden');
    }
  }, 1000);
}

// Handle OTP resending
async function resendOTP() {
  otpErrorAlert.classList.add('hidden');
  otpSuccessAlert.classList.add('hidden');
  
  try {
    const response = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: otpEmail }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      otpSuccessAlert.textContent = 'A new security code has been sent to your email.';
      otpSuccessAlert.classList.remove('hidden');
      startOtpCountdown();
    } else {
      otpErrorAlert.textContent = data.message || 'Failed to resend OTP. Please try again.';
      otpErrorAlert.classList.remove('hidden');
    }
  } catch (err) {
    console.error('OTP resend request error:', err);
    otpErrorAlert.textContent = 'Server connection failed. Please try again.';
    otpErrorAlert.classList.remove('hidden');
  }
}

// Handle registration submission
async function submitRegister(e) {
  e.preventDefault();
  registerErrorAlert.classList.add('hidden');
  registerSuccessAlert.classList.add('hidden');

  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const phone = document.getElementById('register-phone').value;
  const language = document.getElementById('register-language').value;
  const password = document.getElementById('register-password').value;

  const btn = document.getElementById('btn-register-submit');
  const btnOriginalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Creating Account...`;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, language, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      registerSuccessAlert.textContent = 'Account created successfully! Switching to login...';
      registerSuccessAlert.classList.remove('hidden');
      formRegister.reset();
      
      // Auto switch to login tab after 2 seconds
      setTimeout(() => {
        setAuthMode('login');
      }, 2000);
    } else {
      registerErrorAlert.textContent = data.message || 'Registration failed. Try again.';
      registerErrorAlert.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Registration request error:', err);
    registerErrorAlert.textContent = 'Server connection failed. Please try again.';
    registerErrorAlert.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = btnOriginalText;
  }
}

// Load and Display Login History
async function loadLoginHistory() {
  loginHistoryTbody.innerHTML = `
    <tr>
      <td colspan="5" class="table-loading-state">
        <i class="fa-solid fa-circle-notch fa-spin table-spinner"></i>
        <span>Retrieving security records...</span>
      </td>
    </tr>
  `;
  historyEmptyState.classList.add('hidden');

  try {
    const response = await fetch('/api/auth/login-history');
    if (!response.ok) {
      throw new Error('Failed to retrieve history');
    }

    const data = await response.json();
    fullHistory = data.history || [];
    renderHistoryTable(fullHistory);
  } catch (error) {
    console.error('Error loading history:', error);
    loginHistoryTbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-loading-state" style="color: var(--error);">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Failed to load security records.</span>
        </td>
      </tr>
    `;
  }
}

// Render records in table
function renderHistoryTable(records) {
  loginHistoryTbody.innerHTML = '';
  
  if (records.length === 0) {
    historyEmptyState.classList.remove('hidden');
    return;
  }

  historyEmptyState.classList.add('hidden');

  records.forEach(log => {
    const row = document.createElement('tr');
    
    // Device icon mapping
    let deviceIcon = 'fa-desktop';
    if (log.device === 'laptop') deviceIcon = 'fa-laptop';
    else if (log.device === 'mobile') deviceIcon = 'fa-mobile-screen-button';
    
    const deviceBadge = `
      <span class="device-badge">
        <i class="fa-solid ${deviceIcon}"></i>
        <span>${capitalizeFirstLetter(log.device)} (${log.os})</span>
      </span>
    `;

    // Format date time
    const timeFormatted = new Date(log.attemptTime).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Status badge
    const isSuccess = log.status === 'Success';
    const statusClass = isSuccess ? 'success' : 'failed';
    const statusIcon = isSuccess ? 'fa-circle-check' : 'fa-circle-xmark';
    const statusBadge = `
      <span class="status-badge ${statusClass}">
        <i class="fa-solid ${statusIcon}"></i>
        <span>${log.status}</span>
      </span>
    `;

    row.innerHTML = `
      <td>${deviceBadge}</td>
      <td>${log.browser}</td>
      <td><code>${log.ipAddress}</code></td>
      <td>${timeFormatted}</td>
      <td>${statusBadge}</td>
    `;
    
    loginHistoryTbody.appendChild(row);
  });
}

// Local Search and Filter
function filterHistory() {
  const searchQuery = document.getElementById('search-history-input').value.toLowerCase();
  const deviceFilter = document.getElementById('filter-device').value.toLowerCase();
  const statusFilter = document.getElementById('filter-status').value; // Success, Failed

  const filtered = fullHistory.filter(log => {
    // Search match
    const searchMatch = log.ipAddress.toLowerCase().includes(searchQuery) ||
                        log.os.toLowerCase().includes(searchQuery) ||
                        log.browser.toLowerCase().includes(searchQuery);

    // Device match
    const deviceMatch = !deviceFilter || log.device === deviceFilter;

    // Status match
    const statusMatch = !statusFilter || log.status === statusFilter;

    return searchMatch && deviceMatch && statusMatch;
  });

  renderHistoryTable(filtered);
}

// Log out user
async function handleLogout() {
  // Clear localStorage variables
  localStorage.clear();
  
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  
  // Re-verify auth session to redirect back
  checkAuthSession();
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Sync preferred language to backend database
async function updateBackendLanguage(lang) {
  try {
    const response = await fetch('/api/auth/language', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language: lang })
    });
    if (!response.ok) {
      console.error('Failed to sync language preference to backend');
    }
  } catch (error) {
    console.error('Error syncing language to backend:', error);
  }
}
window.updateBackendLanguage = updateBackendLanguage;
