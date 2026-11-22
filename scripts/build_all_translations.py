#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build All Translations Script
Assembles translations.js across all 13 supported languages:
en, es, hi, ar, zh, fr, pt, de, ja, ru, id, ko, uk.
Ensures 100% key parity with master keys, zero mojibake, and clean offline bundling.
"""

import json
import os
import re
import importlib.util

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SCRATCH_DIR = os.path.join(ROOT_DIR, 'scratch')
TRANSLATIONS_FILE = os.path.join(ROOT_DIR, 'translations.js')

with open(os.path.join(SCRATCH_DIR, 'master_keys_unified.json'), 'r', encoding='utf-8') as f:
    master_keys = json.load(f)

# Also load extra cementing keys
cementing_extra_file = os.path.join(SCRATCH_DIR, 'cementing_extra_keys_all_langs.json')
cementing_extra = {}
if os.path.exists(cementing_extra_file):
    with open(cementing_extra_file, 'r', encoding='utf-8') as f:
        cementing_extra = json.load(f)
    for lang_extra in cementing_extra.values():
        for k in lang_extra.keys():
            if k not in master_keys:
                master_keys.append(k)

UNIT_SYSTEM_KEYS = {
    "Theme": {
        "es": "Tema", "hi": "थीम", "ar": "المظهر",
        "zh": "主题", "fr": "Thème", "pt": "Tema",
        "de": "Design", "ja": "テーマ", "ru": "Тема",
        "id": "Tema", "ko": "테마", "uk": "Тема",
    },
    "Light": {
        "es": "Claro", "hi": "लाइट", "ar": "فاتح",
        "zh": "浅色", "fr": "Clair", "pt": "Claro",
        "de": "Hell", "ja": "ライト", "ru": "Светлая",
        "id": "Terang", "ko": "라이트", "uk": "Світла",
    },
    "Dark": {
        "es": "Oscuro", "hi": "डार्क", "ar": "داكن",
        "zh": "深色", "fr": "Sombre", "pt": "Escuro",
        "de": "Dunkel", "ja": "ダーク", "ru": "Темная",
        "id": "Gelap", "ko": "다크", "uk": "Темна",
    },
    "Unit System": {
        "es": "Sistema de unidades", "hi": "इकाई प्रणाली", "ar": "نظام الوحدات",
        "zh": "单位制", "fr": "Système d'unités", "pt": "Sistema de unidades",
        "de": "Einheitensystem", "ja": "単位系", "ru": "Система единиц",
        "id": "Sistem Satuan", "ko": "단위계", "uk": "Система одиниць",
    },
    "UNIT SYSTEM": {
        "es": "SISTEMA DE UNIDADES", "hi": "इकाई प्रणाली", "ar": "نظام الوحدات",
        "zh": "单位制", "fr": "SYSTÈME D'UNITÉS", "pt": "SISTEMA DE UNIDADES",
        "de": "EINHEITENSYSTEM", "ja": "単位系", "ru": "СИСТЕМА ЕДИНИЦ",
        "id": "SISTEM SATUAN", "ko": "단위계", "uk": "СИСТЕМА ОДИНИЦЬ",
    },
    "Oilfield Units (API)": {
        "es": "Unidades petroleras (API)", "hi": "ऑयलफील्ड इकाइयाँ (API)", "ar": "وحدات حقول النفط (API)",
        "zh": "油田单位 (API)", "fr": "Unités pétrolières (API)", "pt": "Unidades petrolíferas (API)",
        "de": "Ölfeldeinheiten (API)", "ja": "油田単位 (API)", "ru": "Промысловые единицы (API)",
        "id": "Satuan Lapangan Minyak (API)", "ko": "유전 단위 (API)", "uk": "Промислові одиниці (API)",
    },
    "Metric Units (SI)": {
        "es": "Unidades métricas (SI)", "hi": "मीट्रिक इकाइयाँ (SI)", "ar": "الوحدات المترية (SI)",
        "zh": "公制单位 (SI)", "fr": "Unités métriques (SI)", "pt": "Unidades métricas (SI)",
        "de": "Metrische Einheiten (SI)", "ja": "メートル法単位 (SI)", "ru": "Метрические единицы (SI)",
        "id": "Satuan Metrik (SI)", "ko": "미터법 단위 (SI)", "uk": "Метричні одиниці (SI)",
    },
    "Mixed Units": {
        "es": "Unidades mixtas", "hi": "मिश्रित इकाइयाँ", "ar": "وحدات مختلطة",
        "zh": "混合单位", "fr": "Unités mixtes", "pt": "Unidades mistas",
        "de": "Gemischte Einheiten", "ja": "混合単位", "ru": "Смешанные единицы",
        "id": "Satuan Campuran", "ko": "혼합 단위", "uk": "Змішані одиниці",
    },
    "Imperial (ft, bbl/ft)": {
        "es": "Imperial (ft, bbl/ft)", "hi": "इंपीरियल (ft, bbl/ft)", "ar": "إمبراطوري (ft, bbl/ft)",
        "zh": "英制 (ft, bbl/ft)", "fr": "Impérial (ft, bbl/ft)", "pt": "Imperial (ft, bbl/ft)",
        "de": "Imperial (ft, bbl/ft)", "ja": "ヤードポンド法 (ft, bbl/ft)", "ru": "Имперские (ft, bbl/ft)",
        "id": "Imperial (ft, bbl/ft)", "ko": "야드파운드법 (ft, bbl/ft)", "uk": "Імперські (ft, bbl/ft)",
    },
    "Metric (m, L/m)": {
        "es": "Métrico (m, L/m)", "hi": "मीट्रिक (m, L/m)", "ar": "متري (m, L/m)",
        "zh": "公制 (m, L/m)", "fr": "Métrique (m, L/m)", "pt": "Métrico (m, L/m)",
        "de": "Metrisch (m, L/m)", "ja": "メートル法 (m, L/m)", "ru": "Метрические (m, L/m)",
        "id": "Metrik (m, L/m)", "ko": "미터법 (m, L/m)", "uk": "Метричні (m, L/m)",
    },
    "Mixed (m, bbl/m)": {
        "es": "Mixto (m, bbl/m)", "hi": "मिश्रित (m, bbl/m)", "ar": "مختلط (m, bbl/m)",
        "zh": "混合 (m, bbl/m)", "fr": "Mixte (m, bbl/m)", "pt": "Misto (m, bbl/m)",
        "de": "Gemischt (m, bbl/m)", "ja": "混合 (m, bbl/m)", "ru": "Смешанные (m, bbl/m)",
        "id": "Campuran (m, bbl/m)", "ko": "혼합 (m, bbl/m)", "uk": "Змішані (m, bbl/m)",
    },
    "Metric (m, bbl/m)": {
        "es": "Métrico (m, bbl/m)", "hi": "मीट्रिक (m, bbl/m)", "ar": "متري (m, bbl/m)",
        "zh": "公制 (m, bbl/m)", "fr": "Métrique (m, bbl/m)", "pt": "Métrico (m, bbl/m)",
        "de": "Metrisch (m, bbl/m)", "ja": "メートル法 (m, bbl/m)", "ru": "Метрические (m, bbl/m)",
        "id": "Metrik (m, bbl/m)", "ko": "미터법 (m, bbl/m)", "uk": "Метричні (m, bbl/m)",
    },
    "Customize unit system, themes and language": {
        "es": "Personalice el sistema de unidades, temas e idioma",
        "hi": "इकाई प्रणाली, थीम और भाषा को अनुकूलित करें",
        "ar": "تخصيص نظام الوحدات والسمات واللغة",
        "zh": "自定义单位制、主题与语言",
        "fr": "Personnaliser le système d'unités, les thèmes et la langue",
        "pt": "Personalizar o sistema de unidades, temas e idioma",
        "de": "Einheitensystem, Designs und Sprache anpassen",
        "ja": "単位系、テーマ、言語のカスタマイズ",
        "ru": "Настройка системы единиц, тем оформления и языка",
        "id": "Sesuaikan sistem satuan, tema, dan bahasa",
        "ko": "단위계, 테마 및 언어 맞춤설정",
        "uk": "Налаштування системи одиниць, колірних тем та мови інтерфейсу",
    },
    "API": {
        "es": "API", "hi": "API", "ar": "API",
        "zh": "API", "fr": "API", "pt": "API",
        "de": "API", "ja": "API", "ru": "API",
        "id": "API", "ko": "API", "uk": "API",
    },
    "SI": {
        "es": "SI", "hi": "SI", "ar": "SI",
        "zh": "SI", "fr": "SI", "pt": "SI",
        "de": "SI", "ja": "SI", "ru": "SI",
        "id": "SI", "ko": "SI", "uk": "SI",
    },
    "Mixed": {
        "es": "Mixto", "hi": "मिश्रित", "ar": "مختلط",
        "zh": "混合", "fr": "Mixte", "pt": "Misto",
        "de": "Gemischt", "ja": "混合", "ru": "Смешанный",
        "id": "Campuran", "ko": "혼합", "uk": "Змішаний",
    },
    "Oilfield": {
        "es": "Petrolero", "hi": "ऑयलफील्ड", "ar": "حقول النفط",
        "zh": "油田", "fr": "Pétrolier", "pt": "Petrolífero",
        "de": "Ölfeld", "ja": "油田", "ru": "Промысловый",
        "id": "Minyak", "ko": "유전", "uk": "Промисловий",
    },
    "Metric": {
        "es": "Métrico", "hi": "मीट्रिक", "ar": "متري",
        "zh": "公制", "fr": "Métrique", "pt": "Métrico",
        "de": "Metrisch", "ja": "メートル法", "ru": "Метрический",
        "id": "Metrik", "ko": "미터법", "uk": "Метричний",
    },
    "Custom": {
        "es": "Personalizado", "hi": "कस्टम", "ar": "مخصص",
        "zh": "自定义", "fr": "Personnalisé", "pt": "Personalizado",
        "de": "Benutzerdefiniert", "ja": "カスタム", "ru": "Пользовательский",
        "id": "Kustom", "ko": "사용자지정", "uk": "Власний",
    },
    "MIXED": {
        "es": "MIXTO", "hi": "मिश्रित", "ar": "مختلط",
        "zh": "混合", "fr": "MIXTE", "pt": "MISTO",
        "de": "GEMISCHT", "ja": "混合", "ru": "СМЕШАННЫЙ",
        "id": "CAMPURAN", "ko": "혼합", "uk": "ЗМІШАНИЙ",
    },
    "Each screen keeps its own default units": {
        "es": "Cada pantalla conserva sus unidades predeterminadas",
        "hi": "प्रत्येक स्क्रीन अपनी डिफ़ॉल्ट इकाइयाँ रखती है",
        "ar": "تحتفظ كل شاشة بوحداتها الافتراضية",
        "zh": "各个页面保留各自默认单位",
        "fr": "Chaque écran conserve ses unités par défaut",
        "pt": "Cada tela mantém suas unidades padrão",
        "de": "Jeder Bildschirm behält seine Standardeinheiten",
        "ja": "各画面はそれぞれのデフォルト単位を保持します",
        "ru": "Каждый экран сохраняет свои единицы по умолчанию",
        "id": "Setiap layar mempertahankan satuan defaultnya sendiri",
        "ko": "각 화면은 자체 기본 단위를 유지합니다",
        "uk": "Кожен екран зберігає власні одиниці за замовчуванням",
    },
    "ft · in · bbl · ppg · psi · bbl/ft · °F": {
        "es": "ft · in · bbl · ppg · psi · bbl/ft · °F", "hi": "ft · in · bbl · ppg · psi · bbl/ft · °F", "ar": "ft · in · bbl · ppg · psi · bbl/ft · °F",
        "zh": "ft · in · bbl · ppg · psi · bbl/ft · °F", "fr": "ft · in · bbl · ppg · psi · bbl/ft · °F", "pt": "ft · in · bbl · ppg · psi · bbl/ft · °F",
        "de": "ft · in · bbl · ppg · psi · bbl/ft · °F", "ja": "ft · in · bbl · ppg · psi · bbl/ft · °F", "ru": "ft · in · bbl · ppg · psi · bbl/ft · °F",
        "id": "ft · in · bbl · ppg · psi · bbl/ft · °F", "ko": "ft · in · bbl · ppg · psi · bbl/ft · °F", "uk": "ft · in · bbl · ppg · psi · bbl/ft · °F",
    },
    "m · mm · m³ · SG · bar · L/m · °C": {
        "es": "m · mm · m³ · SG · bar · L/m · °C", "hi": "m · mm · m³ · SG · bar · L/m · °C", "ar": "m · mm · m³ · SG · bar · L/m · °C",
        "zh": "m · mm · m³ · SG · bar · L/m · °C", "fr": "m · mm · m³ · SG · bar · L/m · °C", "pt": "m · mm · m³ · SG · bar · L/m · °C",
        "de": "m · mm · m³ · SG · bar · L/m · °C", "ja": "m · mm · m³ · SG · bar · L/m · °C", "ru": "m · mm · m³ · SG · bar · L/m · °C",
        "id": "m · mm · m³ · SG · bar · L/m · °C", "ko": "m · mm · m³ · SG · bar · L/m · °C", "uk": "m · mm · m³ · SG · bar · L/m · °C",
    }
}

for k in UNIT_SYSTEM_KEYS:
    if k not in master_keys:
        master_keys.append(k)

langs = ['es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk']
assembled = {}

# 1. English is master identity
assembled['en'] = {k: k for k in master_keys}

# 2. Non-English languages
for lang in langs:
    combined = {}
    if lang == 'uk':
        with open(os.path.join(SCRATCH_DIR, 'uk_dictionary.json'), 'r', encoding='utf-8') as f:
            combined.update(json.load(f))
        with open(os.path.join(SCRATCH_DIR, 'part_extra_uk.json'), 'r', encoding='utf-8') as f:
            combined.update(json.load(f))
    else:
        for p in ['1', '2', '3', '4', '5']:
            part_file = os.path.join(SCRATCH_DIR, f'part{p}_{lang}.json')
            if os.path.exists(part_file):
                with open(part_file, 'r', encoding='utf-8') as f:
                    combined.update(json.load(f))
        extra_file = os.path.join(SCRATCH_DIR, f'part_extra_{lang}.json')
        if os.path.exists(extra_file):
            with open(extra_file, 'r', encoding='utf-8') as f:
                combined.update(json.load(f))
        
        # Load script-specific overrides if present
        script_file = os.path.join(ROOT_DIR, 'scripts', f'trans_{lang}.py')
        if os.path.exists(script_file):
            try:
                spec = importlib.util.spec_from_file_location(f'trans_{lang}', script_file)
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                dnames = [x for x in dir(mod) if x.endswith('_SPECIFIC')]
                if dnames:
                    combined.update(getattr(mod, dnames[0]))
            except Exception as e:
                print(f"Warning loading {script_file}: {e}")

        # Load part_ui_other_langs.json if present
        ui_file = os.path.join(SCRATCH_DIR, 'part_ui_other_langs.json')
        if os.path.exists(ui_file):
            try:
                with open(ui_file, 'r', encoding='utf-8') as f:
                    ui_data = json.load(f)
                if lang in ui_data:
                    combined.update(ui_data[lang])
            except Exception as e:
                print(f"Warning loading {ui_file}: {e}")

    # Add extra cementing translations for all languages
    if lang in cementing_extra:
        combined.update(cementing_extra[lang])

    # Add unit system translations
    for k, vals in UNIT_SYSTEM_KEYS.items():
        if lang in vals:
            combined[k] = vals[lang]

    # Ensure every single master key exists
    missing = [k for k in master_keys if k not in combined]
    if missing:
        raise ValueError(f"Language '{lang}' has {len(missing)} missing master keys: {missing[:5]}")

    assembled[lang] = combined
    print(f"Loaded '{lang}': {len(combined)} keys (0 missing from master).")

# Clean & normalize values
c1_regex = re.compile(r'[\u0080-\u009F]')
mojibake_signatures = ['à¤', 'à¥', 'â€', 'Ã©', 'Ã¡', 'Ã³', 'Ã±', 'Ã§', 'Ã£', 'Ã¼', 'Ã¶', 'Ã¤']

for lang, d in assembled.items():
    for k, v in list(d.items()):
        if not isinstance(v, str):
            continue
        # Strip any accidental C1 chars
        if c1_regex.search(v):
            v_clean = c1_regex.sub('', v)
            d[k] = v_clean
        # Check mojibake signatures
        for sig in mojibake_signatures:
            if sig in d[k]:
                raise ValueError(f"Mojibake signature '{sig}' in [{lang}] '{k}': {repr(d[k])}")

# Build translations.js output
lines = []
lines.append("// Translation library for Drilling Toolkit (13 Languages, Offline Gated Engine)")
lines.append("")
lines.append("const translations = {")

# Order of languages: en, es, hi, ar, zh, fr, pt, de, ja, ru, id, ko, uk
lang_order = ['en', 'es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk']

for lang in lang_order:
    d = assembled[lang]
    lines.append(f"  {lang}: {{")
    for k in sorted(d.keys()):
        v = d[k]
        # JSON serialize string literal safely
        k_str = json.dumps(k, ensure_ascii=False)
        v_str = json.dumps(v, ensure_ascii=False)
        lines.append(f"    {k_str}: {v_str},")
    lines.append("  },")

lines.append("};")
lines.append("")
lines.append("""window.t = function(key, fallback) {
  if (typeof window !== 'undefined' && window.I18n) {
    const res = window.I18n.translate(key);
    if (res) return res;
  }
  return fallback || key;
};
if (typeof globalThis !== 'undefined') {
  globalThis.t = window.t;
}

window.I18n = {
  translations: translations,
  
  translate(key) {
    if (!key) return '';
    const lang = this.getCurrentLang();
    return this.translations[lang]?.[key] || key;
  },

  langNames: {
    en: "English",
    es: "Español",
    hi: "हिन्दी",
    ar: "العربية",
    zh: "简体中文",
    fr: "Français",
    pt: "Português",
    de: "Deutsch",
    ja: "日本語",
    ru: "Русский",
    id: "Bahasa Indonesia",
    ko: "한국어",
    uk: "Українська"
  },

  getCurrentLang() {
    return localStorage.getItem('appLang') || 'en';
  },

  setLanguage(lang) {
    if (!this.translations[lang] && lang !== 'en') lang = 'en';
    localStorage.setItem('appLang', lang);
    document.documentElement.setAttribute('lang', lang);
    
    // RTL Handling: Arabic uses RTL, all other languages use LTR
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }

    // Invalidate search registry cache so search results reflect language switch
    if (typeof _searchRegistryCache !== 'undefined') {
      _searchRegistryCache = null;
    }

    // Update Drawer Language row label if present
    const langLabel = document.getElementById('lang-selected-label');
    if (langLabel && this.langNames[lang]) {
      langLabel.textContent = this.langNames[lang];
    }
    
    // Apply DOM changes
    this.translateDOM(lang);
    
    // Manage MutationObserver
    if (lang === 'en') {
      this.stopObserver();
    } else {
      this.startObserver(lang);
    }
  },

  plural(count, forms) {
    if (!forms) return '';
    const lang = this.getCurrentLang();
    const c = Math.abs(Number(count)) || 0;
    if (lang === 'uk' || lang === 'ru') {
      const mod10 = c % 10;
      const mod100 = c % 100;
      if (mod10 === 1 && mod100 !== 11) return forms.one || forms.other || '';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms.few || forms.other || '';
      return forms.many || forms.other || '';
    }
    if (c === 1) return forms.one || forms.other || '';
    return forms.other || forms.many || '';
  },

  formatNumber(val, decimals = 2) {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const lang = this.getCurrentLang();
    const locale = (lang === 'uk') ? 'uk-UA' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    return Number(val).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  translateDOM(lang) {
    if (document.body) {
      document.body.normalize();
    }
    const dict = this.translations[lang] || {};
    
    // 1. Collect all text nodes to translate
    const nodesToTranslate = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName) || parent.closest('svg') || parent.closest('.toolkit-icon') || parent.classList.contains('material-icons') || parent.tagName === 'svg') continue;
      
      const trimmed = node.nodeValue.trim();
      if (!trimmed) continue;
      nodesToTranslate.push(node);
    }

    // 2. Perform safe gated translation on text nodes
    nodesToTranslate.forEach(node => {
      if (node._origText === undefined) {
        node._origText = node.nodeValue;
      }

      const orig = node._origText;
      const origTrimmed = orig.trim();
      
      if (lang === 'en') {
        if (node.nodeValue !== orig) {
          node.nodeValue = orig;
        }
      } else if (dict[origTrimmed]) {
        const leading = orig.match(/^\\s*/)[0];
        const trailing = orig.match(/\\s*$/)[0];
        const newValue = leading + dict[origTrimmed] + trailing;
        if (node.nodeValue !== newValue) {
          node.nodeValue = newValue;
        }
      }
    });

    // 3. Translate Input Placeholders
    const inputs = document.querySelectorAll('input[placeholder]');
    inputs.forEach(input => {
      if (input._origPlaceholder === undefined) {
        input._origPlaceholder = input.placeholder;
      }
      const orig = input._origPlaceholder;
      const origTrimmed = orig.trim();
      if (lang === 'en') {
        input.placeholder = orig;
      } else if (dict[origTrimmed]) {
        input.placeholder = dict[origTrimmed];
      }
    });
  },

  observer: null,
  isObserving: false,

  startObserver(lang) {
    if (this.observer) this.observer.disconnect();
    
    this.observer = new MutationObserver((mutations) => {
      if (this.isObserving) return;
      this.isObserving = true;
      this.observer.disconnect();
      
      this.translateDOM(lang);
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
      this.isObserving = false;
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  },

  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  },

  init() {
    const savedLang = this.getCurrentLang();
    this.setLanguage(savedLang);
  }
};

// Start system on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.I18n.init();
  } catch (error) {
    console.error('Failed to initialize I18n translation system:', error);
  }
});
""")

with open(TRANSLATIONS_FILE, 'w', encoding='utf-8') as f:
    f.write("\n".join(lines))

print(f"Successfully generated {TRANSLATIONS_FILE} with {len(lang_order)} languages!")
