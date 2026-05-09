(function () {
  const LANG_KEY = "ppade:lang";
  const SUPPORTED = ["th", "en"];
  const DEFAULT = "th";

  const translations = {};
  let currentLang = (() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (SUPPORTED.includes(saved)) return saved;
    } catch (_e) {
      // ignore storage errors
    }
    return DEFAULT;
  })();

  // Resolve relative path so it works from any page depth.
  // Convention: i18n folder lives at /devonix-ppade/i18n/<lang>.json,
  // accessible as /i18n/<lang>.json from the root server route.
  const resolveI18nUrl = (lang) => `/i18n/${lang}.json`;

  const loadLang = async (lang) => {
    if (translations[lang]) return translations[lang];
    try {
      const res = await fetch(resolveI18nUrl(lang), { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      translations[lang] = data;
      return data;
    } catch (err) {
      console.error("[i18n] failed to load", lang, err);
      translations[lang] = {};
      return translations[lang];
    }
  };

  const interpolate = (template, params) => {
    if (!params || typeof params !== "object") return template;
    return String(template).replace(/\{(\w+)\}/g, (_match, key) => {
      const value = params[key];
      return value === undefined || value === null ? "" : String(value);
    });
  };

  const t = (key, params) => {
    const dict = translations[currentLang] || {};
    let value = dict[key];
    if (value === undefined) {
      const fallback = translations[DEFAULT] || {};
      value = fallback[key];
    }
    if (value === undefined) return key;
    return interpolate(value, params);
  };

  const getGuideTopics = () => {
    const dict = translations[currentLang] || {};
    if (Array.isArray(dict["guide.topics"])) return dict["guide.topics"];
    const fallback = translations[DEFAULT] || {};
    if (Array.isArray(fallback["guide.topics"])) return fallback["guide.topics"];
    return [];
  };

  const applyDataI18n = (root = document) => {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      el.setAttribute("placeholder", t(key));
    });
    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      el.setAttribute("title", t(key));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (!key) return;
      el.setAttribute("aria-label", t(key));
    });
  };

  const FLAG_SVGS = {
    th: `<svg class="lang-toggle-flag" viewBox="0 0 24 16" aria-hidden="true">
           <rect width="24" height="3" fill="#A51931"/>
           <rect width="24" height="2" y="3" fill="#F4F5F8"/>
           <rect width="24" height="6" y="5" fill="#2D2A4A"/>
           <rect width="24" height="2" y="11" fill="#F4F5F8"/>
           <rect width="24" height="3" y="13" fill="#A51931"/>
         </svg>`,
    en: `<svg class="lang-toggle-flag" viewBox="0 0 60 36" aria-hidden="true">
           <rect width="60" height="36" fill="#012169"/>
           <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" stroke-width="6"/>
           <path d="M60,0 L0,36" stroke="#C8102E" stroke-width="2.4"/>
           <rect x="25" width="10" height="36" fill="#ffffff"/>
           <rect y="13" width="60" height="10" fill="#ffffff"/>
           <rect x="27" width="6" height="36" fill="#C8102E"/>
           <rect y="15" width="60" height="6" fill="#C8102E"/>
         </svg>`
  };
  const LANG_NAMES = { th: "ภาษาไทย", en: "English" };
  const LANG_HINT = { th: "เปลี่ยนภาษา", en: "Change language" };
  const LANG_NAMES_OPPOSITE = { th: "Switch to English", en: "เปลี่ยนเป็นภาษาไทย" };

  const GLOBE_ICON = `<svg class="lang-toggle-globe" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/>
    <path d="M3 12h18" stroke="currentColor" stroke-width="1.6"/>
    <path d="M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" stroke="currentColor" stroke-width="1.6" fill="none"/>
  </svg>`;
  const SWAP_ICON = `<svg class="lang-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 7H17M17 7L13 3M17 7L13 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 17H7M7 17L11 13M7 17L11 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const HINT_FLAG_KEY = "ppade:lang-hint-seen";
  const userHasSeenHint = (() => {
    try { return localStorage.getItem(HINT_FLAG_KEY) === "1"; }
    catch { return true; }
  })();

  const renderLangToggles = () => {
    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      const flag = FLAG_SVGS[currentLang] || FLAG_SVGS.th;
      const name = LANG_NAMES[currentLang] || LANG_NAMES.th;
      const hint = LANG_HINT[currentLang] || "";
      const tip = LANG_NAMES_OPPOSITE[currentLang] || "";
      btn.innerHTML = `
        ${GLOBE_ICON}
        <span class="lang-toggle-content">
          <span class="lang-toggle-hint">${hint}</span>
          <span class="lang-toggle-row">
            ${flag}
            <span class="lang-toggle-name">${name}</span>
          </span>
        </span>
        ${SWAP_ICON}`;
      btn.setAttribute("title", tip);
      btn.setAttribute("aria-label", tip);
      btn.setAttribute("data-lang-toggle", currentLang);
      if (!userHasSeenHint) btn.classList.add("needs-hint");
    });
  };

  const dismissHint = () => {
    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.classList.remove("needs-hint");
    });
    try { localStorage.setItem(HINT_FLAG_KEY, "1"); } catch { /* ignore */ }
  };

  const updateLangSwitchUi = () => {
    // Backward compat — keep dual-button switcher working if present
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      const lang = btn.getAttribute("data-lang-switch");
      btn.classList.toggle("active", lang === currentLang);
      btn.setAttribute("aria-pressed", lang === currentLang ? "true" : "false");
    });
    document.querySelectorAll(".lang-switcher").forEach((box) => {
      box.setAttribute("data-active", currentLang);
    });
    renderLangToggles();
    document.documentElement.setAttribute("lang", currentLang);
  };

  const reRenderDynamic = () => {
    if (typeof window.renderBillGuide === "function") {
      try { window.renderBillGuide(); } catch (_e) { /* ignore */ }
    }
    if (typeof window.renderAuditFeed === "function") {
      try { window.renderAuditFeed(); } catch (_e) { /* ignore */ }
    }
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: currentLang } }));
  };

  const setLang = async (lang) => {
    const next = SUPPORTED.includes(lang) ? lang : DEFAULT;
    if (next === currentLang && translations[next]) {
      updateLangSwitchUi();
      return;
    }
    await loadLang(next);
    currentLang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (_e) { /* ignore */ }
    applyDataI18n();
    updateLangSwitchUi();
    reRenderDynamic();
  };

  // Bootstrap on DOMContentLoaded
  const init = async () => {
    await loadLang(currentLang);
    if (currentLang !== DEFAULT) {
      // preload default in background for fallbacks
      loadLang(DEFAULT).catch(() => {});
    }
    applyDataI18n();
    updateLangSwitchUi();
    document.addEventListener("click", (event) => {
      const switchBtn = event.target.closest("[data-lang-switch]");
      if (switchBtn) {
        const lang = switchBtn.getAttribute("data-lang-switch");
        if (lang) setLang(lang);
        return;
      }
      const toggleBtn = event.target.closest("[data-lang-toggle]");
      if (toggleBtn) {
        dismissHint();
        const next = currentLang === "th" ? "en" : "th";
        toggleBtn.classList.add("is-toggling");
        setLang(next).finally(() => {
          window.setTimeout(() => toggleBtn.classList.remove("is-toggling"), 360);
        });
      }
    });
    document.dispatchEvent(new CustomEvent("i18n:ready", { detail: { lang: currentLang } }));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Public API
  window.t = t;
  window.setLang = setLang;
  window.getLang = () => currentLang;
  window.getI18nGuideTopics = getGuideTopics;
  window.applyI18n = applyDataI18n;
})();
