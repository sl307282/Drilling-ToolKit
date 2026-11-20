#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verification Script for Stuck Pipe Assistant 13-Language Locales
Validates:
1. All 13 locales exist: en, es, hi, ar, zh, fr, pt, de, ja, ru, id, ko, uk
2. 100% key parity with master English keys
3. No empty or whitespace-only values
4. Placeholder parity: every {placeholder} in en must exist in translation
5. Glossary adherence for core drilling engineering terms
"""

import json
import os
import re
import sys

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LOCALES_JSON = os.path.join(ROOT_DIR, 'scratch', 'stuckpipe_locales.json')
LOCALES_JS = os.path.join(ROOT_DIR, 'stuckpipe', 'locales.js')

EXPECTED_LANGS = ['en', 'es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk']

GLOSSARY_CHECKS = {
    'es': {'stuckpipe.title': 'Tubería atascada', 'mech.diff.name': 'Aprisionamiento diferencial', 'mech.key.name': 'Ojo de llave'},
    'fr': {'stuckpipe.title': 'Coincement de la garniture', 'mech.diff.name': 'Coincement différentiel', 'mech.key.name': 'Rainure de clavette'},
    'pt': {'stuckpipe.title': 'Prisão de coluna', 'mech.diff.name': 'Prisão diferencial', 'mech.key.name': 'Chaveta'},
    'de': {'stuckpipe.title': 'Festsitzendes Gestänge', 'mech.diff.name': 'Differenzdruck-Festsitzen', 'mech.key.name': 'Key-Seat'},
    'ru': {'stuckpipe.title': 'Прихват бурильной колонны', 'mech.diff.name': 'Дифференциальный прихват', 'mech.key.name': 'Желобная выработка'},
    'uk': {'stuckpipe.title': 'Прихват бурильної колони', 'mech.diff.name': 'Диференційний прихват', 'mech.key.name': 'Жолобна виробка'},
    'id': {'stuckpipe.title': 'Pipa terjepit', 'mech.diff.name': 'Terjepit diferensial', 'mech.key.name': 'Key seat'},
    'hi': {'stuckpipe.title': 'फँसा हुआ पाइप', 'mech.diff.name': 'डिफरेंशियल स्टिकिंग', 'mech.key.name': 'की-सीट'},
    'ar': {'stuckpipe.title': 'انحشار أنبوب الحفر', 'mech.diff.name': 'الانحشار التفاضلي', 'mech.key.name': 'مقعد المفتاح'},
    'zh': {'stuckpipe.title': '卡钻', 'mech.diff.name': '压差卡钻', 'mech.key.name': '键槽'},
    'ja': {'stuckpipe.title': 'パイプ固着', 'mech.diff.name': '差圧固着', 'mech.key.name': 'キーシート'},
    'ko': {'stuckpipe.title': '파이프 고착', 'mech.diff.name': '차압 고착', 'mech.key.name': '키시트'},
}

def verify():
    if not os.path.exists(LOCALES_JSON):
        print(f"ERROR: {LOCALES_JSON} not found. Run builder script first.")
        sys.exit(1)

    with open(LOCALES_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Check all languages exist
    missing_langs = [l for l in EXPECTED_LANGS if l not in data]
    if missing_langs:
        print(f"ERROR: Missing languages: {missing_langs}")
        sys.exit(1)

    en_dict = data['en']
    en_keys = set(en_dict.keys())
    print(f"Master 'en' locale has {len(en_keys)} keys.")

    errors = []

    for lang in EXPECTED_LANGS:
        ldict = data[lang]
        lkeys = set(ldict.keys())

        # Check missing keys
        missing_keys = en_keys - lkeys
        if missing_keys:
            errors.append(f"[{lang}] Missing {len(missing_keys)} keys (sample: {list(missing_keys)[:5]})")

        # Check empty values
        for k, v in ldict.items():
            if not v or not str(v).strip():
                errors.append(f"[{lang}] Key '{k}' has empty or whitespace value")

        # Check placeholders
        for k in en_keys:
            if k in ldict:
                en_val = en_dict[k]
                l_val = ldict[k]
                en_ph = set(re.findall(r'\{(\w+)\}', en_val))
                l_ph = set(re.findall(r'\{(\w+)\}', l_val))
                if en_ph != l_ph:
                    errors.append(f"[{lang}] Key '{k}' placeholder mismatch: en={en_ph}, {lang}={l_ph}")

        # Check glossary terms
        if lang in GLOSSARY_CHECKS:
            for gkey, expected_substring in GLOSSARY_CHECKS[lang].items():
                if gkey in ldict:
                    val = ldict[gkey]
                    if expected_substring.lower() not in val.lower():
                        errors.append(f"[{lang}] Glossary check failed for '{gkey}': expected '{expected_substring}' in '{val}'")

    if errors:
        print(f"Verification FAILED with {len(errors)} error(s):")
        for err in errors[:20]:
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more errors")
        sys.exit(1)

    print(f"SUCCESS: All 13 locales verified! 100% key parity ({len(en_keys)} keys), valid placeholders, and glossary terms passed.")

if __name__ == '__main__':
    verify()
