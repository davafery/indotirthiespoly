(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KonohapolyThemes = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const THEME_KEY = 'konohapoly_theme_v1';

  const THEMES = {
    nusantara: {
      id: 'nusantara',
      name: 'Nusantara Klasik',
      badge: 'DEFAULT',
      desc: 'Laut biru tropis, bingkai kayu jati, dan Monas berbalut emas.',
      ui: {
        bg: '#071526',
        card: '#0f172a',
        surface: '#1e293b',
        accent: '#facc15',
        accentText: '#0f172a'
      },
      scene: {
        skyHex: 0x091e36,
        seaHex: 0x0c4a6e,
        frameHex: 0x3b2314,
        fieldHex: 0x14532d,
        tileBg: '#f8f5ec',
        tileMortgagedBg: '#cbd5e1',
        tileBorder: '#334155',
        tileText: '#0f172a',
        monasFlameHex: 0xfacc15
      }
    },
    jakarta_malam: {
      id: 'jakarta_malam',
      name: 'Jakarta Malam',
      badge: 'NEON',
      desc: 'Atmosfer ibu kota malam hari dengan sorotan emas & cyan.',
      ui: {
        bg: '#050816',
        card: '#0b1024',
        surface: '#161e3a',
        accent: '#38bdf8',
        accentText: '#0f172a'
      },
      scene: {
        skyHex: 0x040714,
        seaHex: 0x081a38,
        frameHex: 0x1e293b,
        fieldHex: 0x0f172a,
        tileBg: '#1e293b',
        tileMortgagedBg: '#334155',
        tileBorder: '#38bdf8',
        tileText: '#f8fafc',
        monasFlameHex: 0x38bdf8
      }
    },
    rimba_ikn: {
      id: 'rimba_ikn',
      name: 'Rimba IKN',
      badge: 'ECOPOLIS',
      desc: 'Sungai hijau zamrud di tengah hutan tropis ibu kota baru.',
      ui: {
        bg: '#041a14',
        card: '#09261e',
        surface: '#12382d',
        accent: '#34d399',
        accentText: '#052e16'
      },
      scene: {
        skyHex: 0x06241b,
        seaHex: 0x065f46,
        frameHex: 0x5c3a21,
        fieldHex: 0x166534,
        tileBg: '#f4f7ee',
        tileMortgagedBg: '#cbd5e1',
        tileBorder: '#14532d',
        tileText: '#052e16',
        monasFlameHex: 0xfde047
      }
    },
    krismon_98: {
      id: 'krismon_98',
      name: 'Krismon 98',
      badge: 'RETRO SEPIA',
      desc: 'Nuansa koran ekonomi jadul dan warna amber hangat.',
      ui: {
        bg: '#1c140d',
        card: '#291d14',
        surface: '#3b2a1e',
        accent: '#f59e0b',
        accentText: '#1c140d'
      },
      scene: {
        skyHex: 0x241911,
        seaHex: 0x452c1a,
        frameHex: 0x27170c,
        fieldHex: 0x3f321d,
        tileBg: '#efe4cf',
        tileMortgagedBg: '#b8aa96',
        tileBorder: '#451a03',
        tileText: '#27170c',
        monasFlameHex: 0xf59e0b
      }
    }
  };

  function getSavedThemeId() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && THEMES[saved]) return saved;
    } catch (_) {}
    return 'nusantara';
  }

  function getTheme(id) {
    return THEMES[id] || THEMES[getSavedThemeId()] || THEMES.nusantara;
  }

  function applyThemeToDOM(theme) {
    if (typeof document === 'undefined' || !theme || !theme.ui) return;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--kp-bg', theme.ui.bg);
    rootStyle.setProperty('--kp-surface', theme.ui.card);
    rootStyle.setProperty('--kp-surface-2', theme.ui.surface);
    rootStyle.setProperty('--kp-accent', theme.ui.accent);
    rootStyle.setProperty('--kp-accent-text', theme.ui.accentText || '#0f172a');
  }

  function setTheme(id) {
    const chosen = THEMES[id] ? THEMES[id] : THEMES.nusantara;
    try {
      localStorage.setItem(THEME_KEY, chosen.id);
    } catch (_) {}
    applyThemeToDOM(chosen);
    return chosen;
  }

  return {
    THEMES,
    getSavedThemeId,
    getTheme,
    setTheme,
    applyThemeToDOM
  };
}));