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
