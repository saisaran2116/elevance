// i18n initialization and logic
const languagesSupported = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

// Detect user's language preference
function getInitialLanguage() {
  // 1. Check local storage
  const saved = localStorage.getItem('user_language');
  if (saved && languagesSupported.includes(saved)) {
    return saved;
  }
  // 2. Check browser language
  const browserLang = (navigator.language || navigator.userLanguage || '').substring(0, 2);
  if (languagesSupported.includes(browserLang)) {
    return browserLang;
  }
  return 'en';
}

async function initI18n() {
  const resources = {};
  
  // Load all locales
  for (const lang of languagesSupported) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (response.ok) {
        resources[lang] = {
          translation: await response.json()
        };
      }
    } catch (error) {
      console.error(`Failed to load locale: ${lang}`, error);
    }
  }

  await i18next.init({
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    resources
  });

  // Perform initial translation of the page
  translatePage();

  // Bind selector dropdowns if present
  setupLanguageSelectors();
}

function translatePage() {
  // Elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const icon = el.querySelector('i');
    
    // Evaluate translation key
    // i18next allows nested keys via t("nested.key")
    const textValue = i18next.t(key);
    
    if (icon) {
      // Keep icon and replace/update the rest of the text
      el.innerHTML = '';
      el.appendChild(icon);
      el.appendChild(document.createTextNode(' ' + textValue));
    } else {
      el.textContent = textValue;
    }
  });

  // Elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', i18next.t(key));
  });

  // Elements with data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', i18next.t(key));
  });
}

function setupLanguageSelectors() {
  const selectors = document.querySelectorAll('.language-select-dropdown');
  selectors.forEach(select => {
    select.value = i18next.language;
    select.addEventListener('change', async (e) => {
      const selectedLang = e.target.value;
      await changeLanguage(selectedLang);
    });
  });
}

async function changeLanguage(lang) {
  if (!languagesSupported.includes(lang)) return;
  
  await i18next.changeLanguage(lang);
  localStorage.setItem('user_language', lang);
  
  // Update all selectors
  document.querySelectorAll('.language-select-dropdown').forEach(select => {
    select.value = lang;
  });

  translatePage();

  // If user is logged in, update preference in the DB
  if (window.currentUser) {
    window.currentUser.language = lang;
    if (typeof updateBackendLanguage === 'function') {
      await updateBackendLanguage(lang);
    }
    // Update the profile label in the UI
    const displayLangEl = document.getElementById('user-display-lang');
    if (displayLangEl && typeof getLanguageName === 'function') {
      displayLangEl.textContent = getLanguageName(lang);
    }
  }

  // Dispatch custom event for app.js/forgot-password to respond if needed
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

// Start initialization once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
