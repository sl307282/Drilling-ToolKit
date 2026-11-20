#!/usr/bin/env python3
"""
Offline & Icon Regression Guard
Verifies that:
1. No remote CDN or external font/script/style URLs exist in the web source or www/.
2. All 29 required icons are present in icons.js with non-empty SVG path data.
3. No legacy material-icons class usage exists in index.html or app.js.
4. icons.js is loaded before app.js in index.html.
5. icons.js is copied to www/ in package.json build script.
6. translations.js protects svg and .toolkit-icon elements from DOM text translation.
"""

import os
import re
import sys

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

REQUIRED_ICONS = [
    'anchor',
    'architecture',
    'bookmark',
    'build',
    'chevron_right',
    'compress',
    'construction',
    'data_usage',
    'done_all',
    'engineering',
    'expand_less',
    'expand_more',
    'explore',
    'foundation',
    'functions',
    'grid_on',
    'history',
    'info',
    'science',
    'security',
    'settings',
    'settings_input_component',
    'star',
    'star_border',
    'swap_vert',
    'troubleshoot',
    'tune',
    'water_drop',
    'waves'
]

FORBIDDEN_PATTERNS = [
    r'fonts\.googleapis\.com',
    r'fonts\.gstatic\.com',
    r'cdnjs\.cloudflare\.com',
    r'cdn\.jsdelivr\.net',
    r'unpkg\.com',
]

errors = []

# --- CHECK 1: No remote CDN URLs in index.html, style.css, app.js, icons.js ---
source_files = ['index.html', 'style.css', 'app.js', 'icons.js', 'translations.js']
www_dir = os.path.join(ROOT_DIR, 'www')
files_to_check = [os.path.join(ROOT_DIR, f) for f in source_files if os.path.exists(os.path.join(ROOT_DIR, f))]

if os.path.exists(www_dir):
    for f in source_files:
        p = os.path.join(www_dir, f)
        if os.path.exists(p):
            files_to_check.append(p)

for filepath in files_to_check:
    rel_path = os.path.relpath(filepath, ROOT_DIR)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        errors.append(f"Could not read {rel_path}: {e}")
        continue

    for pattern in FORBIDDEN_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            errors.append(f"Forbidden CDN pattern '{pattern}' found in {rel_path} ({len(matches)} match(es))")

    # In HTML, check for any http:// or https:// external script or link href
    if filepath.endswith('.html'):
        remote_links = re.findall(r'<(?:link|script)[^>]+(?:href|src)=["\']https?://[^"\']+["\']', content, re.IGNORECASE)
        for rl in remote_links:
            errors.append(f"Remote external resource link in {rel_path}: {rl}")

# --- CHECK 2: All 29 required icons defined in icons.js ---
icons_js_path = os.path.join(ROOT_DIR, 'icons.js')
if not os.path.exists(icons_js_path):
    errors.append("icons.js does not exist in root directory!")
else:
    with open(icons_js_path, 'r', encoding='utf-8') as f:
        icons_js = f.read()

    icon_matches = dict(re.findall(r"['\"]([a-zA-Z0-9_]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]", icons_js))

    for icon in REQUIRED_ICONS:
        if icon not in icon_matches:
            errors.append(f"Required icon '{icon}' is missing from icons.js")
        elif not icon_matches[icon] or len(icon_matches[icon].strip()) < 5:
            errors.append(f"Icon '{icon}' in icons.js has invalid or empty path data: '{icon_matches[icon]}'")

    # Verify window.renderIcon is defined
    if 'window.renderIcon' not in icons_js:
        errors.append("window.renderIcon is not defined in icons.js")

# --- CHECK 3: No legacy material-icons class usage in index.html or app.js ---
for fname in ['index.html', 'app.js']:
    fpath = os.path.join(ROOT_DIR, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        legacy_matches = re.findall(r'class=["\'][^"\']*\bmaterial-icons\b[^"\']*["\']', content)
        if legacy_matches:
            errors.append(f"Legacy 'material-icons' class found in {fname} ({len(legacy_matches)} occurrence(s)): {legacy_matches[:3]}")

# --- CHECK 4: icons.js loaded before app.js in index.html ---
index_path = os.path.join(ROOT_DIR, 'index.html')
if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        index_content = f.read()
    icons_pos = index_content.find('icons.js')
    app_pos = index_content.find('app.js')
    if icons_pos == -1:
        errors.append("icons.js is not loaded in index.html")
    if app_pos == -1:
        errors.append("app.js is not loaded in index.html")
    if icons_pos != -1 and app_pos != -1 and icons_pos > app_pos:
        errors.append("icons.js must be loaded before app.js in index.html")

# --- CHECK 5: package.json build script copies icons.js ---
package_path = os.path.join(ROOT_DIR, 'package.json')
if os.path.exists(package_path):
    with open(package_path, 'r', encoding='utf-8') as f:
        pkg_content = f.read()
    if 'icons.js' not in pkg_content:
        errors.append("package.json build script does not copy icons.js to www/")

# --- CHECK 6: translations.js protects svg and .toolkit-icon from DOM translation ---
translations_path = os.path.join(ROOT_DIR, 'translations.js')
if os.path.exists(translations_path):
    with open(translations_path, 'r', encoding='utf-8') as f:
        trans_content = f.read()
    if "parent.closest('svg')" not in trans_content or "toolkit-icon" not in trans_content:
        errors.append("translations.js translateDOM does not protect svg/.toolkit-icon elements from translation")

# --- REPORT RESULTS ---
if errors:
    print(f"FAILED: {len(errors)} offline/icon regression errors found:")
    for err in errors:
        print(f"  ERROR: {err}")
    sys.exit(1)
else:
    print("SUCCESS: Offline & Icon Regression Guard passed cleanly!")
    print("  - Verified 0 remote CDN URLs in web source & assets")
    print(f"  - Verified all {len(REQUIRED_ICONS)} required icons with valid path data in icons.js")
    print("  - Verified 0 legacy material-icons class usages in index.html and app.js")
    print("  - Verified script load order (icons.js before app.js)")
    print("  - Verified build copy and translation protection")
    sys.exit(0)
