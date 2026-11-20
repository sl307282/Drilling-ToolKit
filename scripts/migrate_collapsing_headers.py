#!/usr/bin/env python3
"""
Migrate all 24 sub-screens in index.html to the universal Collapsing Header contract.
"""

import re

def migrate():
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # 1. Add collapsing_header.js before app.js if not present
    if "collapsing_header.js" not in html:
        html = html.replace(
            '<script src="app.js',
            '<script src="collapsing_header.js" defer></script>\n  <script src="app.js'
        )

    # 2. Split by screens
    splits = re.split(r"(?=<div\s+id=\"screen-)", html)
    assert len(splits) == 25, f"Expected 25 splits, got {len(splits)}"

    new_splits = [splits[0]]

    for i in range(1, 25):
        s = splits[i]
        m_open = re.match(r"(<div\s+id=\"(screen-[^\"]+)\"\s+class=\"screen\">)", s)
        sid = m_open.group(2)
        screen_open = m_open.group(1)
        rest = s[m_open.end():]

        # Extract header and body
        if sid == "screen-cement-planner-subsea":
            hdr_end_idx = rest.find('<div id="cementing-container"')
            hdr_raw = rest[:hdr_end_idx]
            body_and_tail = rest[hdr_end_idx:]

            title_attrs = 'id="cementing-screen-title" data-i18n="Subsea Wellhead"'
            title_val = "Subsea Wellhead"
            sub_attrs = 'id="cementing-screen-subtitle" data-i18n="Floater Rig · Subsea & riserless casing cement calculation"'
            sub_val = "Floater Rig · Subsea &amp; riserless casing cement calculation"
            right_action_html = '        <span id="cementing-header-badge" class="cement-badge-model" style="display:none;"></span>'

            # Find where screen ends
            end_div_idx = body_and_tail.rfind('</div>')
            body_content = body_and_tail[:end_div_idx].strip()
            tail = body_and_tail[end_div_idx+6:]

            new_body = f'''<div id="cementing-fixed-header-wrapper" class="cementing-fixed-header-wrapper" style="display:none;">
            <div id="cementing-job-header-slot"></div>
          </div>
          {body_content}'''
            body_content = new_body

        else:
            # Match screen-header closing
            hdr_match = re.search(r'<div class="screen-header">.*?</div>\s*(?:<span class="screen-subtitle"[^>]*>.*?</span>\s*)?</div>', rest, re.DOTALL)
            assert hdr_match, f"Could not find screen-header in {sid}"

            hdr_raw = hdr_match.group(0)
            body_and_tail = rest[hdr_match.end():]

            # Title
            t_m = re.search(r'<h2 class="screen-title"([^>]*)>(.*?)</h2>', hdr_raw, re.DOTALL)
            title_attrs = t_m.group(1).strip() if t_m else ""
            title_val = t_m.group(2).strip() if t_m else ""
            title_attrs = re.sub(r'style="[^"]*"', '', title_attrs).strip()

            # Subtitle
            sub_m = re.search(r'<span class="screen-subtitle"([^>]*)>(.*?)</span>', hdr_raw, re.DOTALL)
            sub_attrs = sub_m.group(1).strip() if sub_m else ""
            sub_val = sub_m.group(2).strip() if sub_m else ""

            # Right action button
            right_action_html = ""
            if sid in ["screen-surface-calculations", "screen-subsea-calculations", "screen-kill-data-sheet"]:
                right_action_html = '''        <button class="hdr-action-btn history-btn" onclick="openHistoryScreen();" aria-label="History">
          <span class="ico" data-hdr-icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
        </button>'''
            elif sid == "screen-bit-dull-grading":
                right_action_html = '''        <button class="hdr-action-btn history-btn" onclick="navigateTo('iadc-history')" aria-label="History">
          <span class="ico" data-hdr-icon>
            <svg class="toolkit-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
          </span>
        </button>'''
            elif sid == "screen-quick-ref":
                right_action_html = '''        <button class="hdr-action-btn" id="quick-ref-fav-btn" onclick="toggleQuickRefFavorite()" style="display:none;" aria-label="Favorite">
          <span class="ico" data-hdr-icon>
            <svg class="toolkit-icon" viewBox="0 0 24 24" width="20" height="20" fill="#EAB308" aria-hidden="true" focusable="false"><path d="m22 9.24-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>
          </span>
        </button>'''

            # Find closing screen </div>
            if i == 24:
                # screen-iadc-history:
                # <div id="iadc-history-list-container"...>...</div>\n    </div>\n\n      </div> <!-- /app-container -->
                idx = body_and_tail.find("iadc-history-list-container")
                sub = body_and_tail[idx:]
                c1 = sub.find("</div>")
                c2 = sub.find("</div>", c1 + 6)
                body_content = body_and_tail[:idx + c2].strip()
                tail = body_and_tail[idx + c2 + 6:]
            else:
                end_div_idx = body_and_tail.rfind('</div>')
                body_content = body_and_tail[:end_div_idx].strip()
                tail = body_and_tail[end_div_idx+6:]

        # Attributes for compact bar vs large h1
        bar_title_attrs = title_attrs
        large_title_attrs = title_attrs
        if 'id="' in title_attrs:
            m_id = re.search(r'id="([^"]+)"', title_attrs)
            if m_id:
                orig_id = m_id.group(1)
                bar_title_attrs = title_attrs.replace(f'id="{orig_id}"', f'id="{orig_id}-compact"')

        subtitle_elem = f'<p class="screen-subtitle" {sub_attrs}>{sub_val}</p>' if sub_val else ''
        right_action_str = f"\n{right_action_html}" if right_action_html else ""

        migrated_screen = f'''{screen_open}
      <header class="bar">
        <div class="bar-bg"></div>
        <button class="back back-btn" onclick="navigateBack();" aria-label="Back">
          <span class="ico" data-hdr-icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </span>
        </button>
        <div class="bar-title" aria-hidden="true" {bar_title_attrs}>{title_val}</div>{right_action_str}
      </header>
      <main class="scroller">
        <section class="large">
          <h1 class="screen-title" {large_title_attrs}>{title_val}</h1>
          {subtitle_elem}
        </section>
        <div class="screen-body">
          {body_content}
        </div>
      </main>
    </div>{tail}'''

        new_splits.append(migrated_screen)

    full_migrated_html = "".join(new_splits)
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_migrated_html)

    print("Successfully migrated all 24 sub-screens in index.html!")

if __name__ == "__main__":
    migrate()
