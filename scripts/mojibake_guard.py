#!/usr/bin/env python3
"""
Mojibake & Encoding Guard
Fails if any translation value contains:
1. Double-encoded mojibake signatures (e.g. à¤, à¥, Ã, etc. in non-Latin scripts, or double-encoded UTF-8 sequences)
2. C1 control characters (U+0080 to U+009F)
3. Non-Latin languages failing to contain characters from their own script
"""

import re
import sys
import os

TRANSLATIONS_FILE = os.path.join(os.path.dirname(__file__), '..', 'translations.js')

with open(TRANSLATIONS_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

langs = ['es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk']

# Script regexes for non-Latin languages
script_patterns = {
    'hi': re.compile(r'[\u0900-\u097F]'),  # Devanagari
    'ar': re.compile(r'[\u0600-\u06FF]'),  # Arabic
    'zh': re.compile(r'[\u4E00-\u9FFF]'),  # CJK Unified Ideographs
    'ja': re.compile(r'[\u3040-\u30FF\u4E00-\u9FFF]'),  # Hiragana, Katakana, Kanji
    'ru': re.compile(r'[\u0400-\u04FF]'),  # Cyrillic
    'ko': re.compile(r'[\uAC00-\uD7AF\u1100-\u11FF]'),  # Hangul
    'uk': re.compile(r'[\u0400-\u04FF]')   # Cyrillic
}

c1_regex = re.compile(r'[\u0080-\u009F]')

# Signatures that indicate UTF-8 decoded as Latin-1 / cp1252
mojibake_signatures = ['à¤', 'à¥', 'â€', 'Ã©', 'Ã¡', 'Ã³', 'Ã±', 'Ã§', 'Ã£', 'Ã¼', 'Ã¶', 'Ã¤']

errors = []

for lang in langs:
    m = re.search(rf'\b{lang}\s*:\s*\{{', content)
    if not m:
        errors.append(f"Language '{lang}' missing in translations.js")
        continue
    start = m.end() - 1
    depth = 0
    end = -1
    for idx in range(start, len(content)):
        char = content[idx]
        if char == '{': depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = idx + 1
                break
    block = content[start:end]
    kv_pattern = re.compile(r'"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"')
    kvs = kv_pattern.findall(block)

    native_chars_count = 0
    for k, v in kvs:
        # Check C1 control characters
        if c1_regex.search(v):
            errors.append(f"[{lang}] C1 control character found in key '{k}': {repr(v)}")

        # Check mojibake signatures
        for sig in mojibake_signatures:
            if sig in v:
                errors.append(f"[{lang}] Mojibake signature '{sig}' found in key '{k}': {repr(v)}")

        # Check for reversibility as double-encoded UTF-8
        try:
            rec = v.encode('latin1').decode('utf-8')
            if rec != v and len(v) > 2:
                errors.append(f"[{lang}] Double-encoded UTF-8 detected in key '{k}': {repr(v)} -> {repr(rec)}")
        except Exception:
            pass

        # Check script presence for non-Latin languages
        if lang in script_patterns and script_patterns[lang].search(v):
            native_chars_count += 1

    if lang in script_patterns and native_chars_count == 0:
        errors.append(f"[{lang}] Non-Latin language contains ZERO characters from its own script!")

if errors:
    print(f"FAILED: {len(errors)} encoding/mojibake errors found:")
    for err in errors[:20]:
        print(f"  ERROR: {err}")
    sys.exit(1)
else:
    print("SUCCESS: 0 mojibake signatures, 0 C1 control characters, all scripts verified cleanly!")
    sys.exit(0)
