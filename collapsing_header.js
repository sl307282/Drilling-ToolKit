/**
 * CollapsingHeader: Universal Collapsing Toolbar Engine (v2)
 *
 * Enforces the Android collapsing-toolbar contract:
 * 1. Scroll up: header continuously shrinks to compact 56dp bar; large title & subtitle scroll away in-flow.
 * 2. Scroll down: header stays minimum until page reaches absolute top (scrollTop === 0).
 * 3. Expand only at top: continuous expansion as scrollTop approaches 0, zero snaps or jumps.
 * 4. Same-row layout: back icon & large title vertically centered on same row at scrollTop = 0.
 * 5. Icon scaling: header icons scale continuously from 1.0 (44dp) down to 0.8 (~35.2dp) while outer hit target remains 44x44dp.
 * 6. Zero flicker: only opacity & transform writes in passive RAF loop.
 */

(function(global) {
  'use strict';

  const ICON_MIN = 0.8;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  class CollapsingHeaderInstance {
    constructor(screenEl) {
      this.screenEl = screenEl;
      this.bar = screenEl.querySelector('.bar');
      this.barBg = screenEl.querySelector('.bar-bg');
      this.barTitle = screenEl.querySelector('.bar-title');
      this.scroller = screenEl.querySelector('.scroller');
      this.large = screenEl.querySelector('.large');

      if (!this.bar || !this.scroller) return;

      this.icons = [...this.bar.querySelectorAll('[data-hdr-icon]')];
      this.end = 26;
      this.fadeOutEnd = 12;
      this.ticking = false;

      this.measure = this.measure.bind(this);
      this.apply = this.apply.bind(this);
      this.onScroll = this.onScroll.bind(this);

      this.init();
    }

    init() {
      this.scroller.addEventListener('scroll', this.onScroll, { passive: true });

      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => {
          this.refreshIcons();
          this.measure();
        });
        if (this.large) this.ro.observe(this.large);
        this.ro.observe(this.scroller);
      }

      // Synchronize dynamic title mutations from legacy scripts to compact title
      if (typeof MutationObserver !== 'undefined' && this.large) {
        const h1 = this.large.querySelector('h1');
        if (h1 && this.barTitle) {
          this.titleMo = new MutationObserver(() => {
            if (this.barTitle && h1.textContent !== this.barTitle.textContent) {
              this.barTitle.textContent = h1.textContent;
            }
          });
          this.titleMo.observe(h1, { characterData: true, childList: true, subtree: true });
        }
      }

      this.measure();
    }

    refreshIcons() {
      if (this.bar) {
        this.icons = [...this.bar.querySelectorAll('[data-hdr-icon]')];
      }
    }

    measure() {
      if (!this.bar) return;
      const largeH = this.large ? this.large.offsetHeight : 0;
      const barH = this.bar.offsetHeight || 56;
      // `end` = scrollTop at which the first content item reaches the bottom of the compact bar
      this.end = Math.max(24, largeH - barH);
      this.fadeOutEnd = this.end * 0.45;
      this.apply();
    }

    apply() {
      this.ticking = false;
      if (!this.scroller) return;

      const y = Math.max(0, this.scroller.scrollTop);
      const isReduced = typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const effFadeOutEnd = isReduced ? 4 : this.fadeOutEnd;
      const effEnd = isReduced ? 8 : this.end;

      if (this.large) {
        this.large.style.opacity = String(1 - clamp01(y / effFadeOutEnd));
      }

      if (this.barTitle) {
        this.barTitle.style.opacity = String(
          clamp01((y - effFadeOutEnd) / (effEnd - effFadeOutEnd))
        );
      }

      if (this.barBg) {
        this.barBg.style.opacity = String(clamp01((y - (effEnd - 20)) / 20));
      }

      const sc = 1 - (1 - ICON_MIN) * clamp01(y / effEnd);
      for (let i = 0; i < this.icons.length; i++) {
        this.icons[i].style.transform = 'scale(' + sc + ')';
      }
    }

    onScroll() {
      if (!this.ticking) {
        this.ticking = true;
        requestAnimationFrame(this.apply);
      }
    }

    reset() {
      if (this.scroller) {
        this.scroller.scrollTop = 0;
      }
      this.measure();
      this.apply();
    }

    setTitle(title, subtitle) {
      if (this.barTitle && title !== undefined) {
        this.barTitle.textContent = title;
      }
      if (this.large) {
        const h1 = this.large.querySelector('h1');
        if (h1 && title !== undefined) h1.textContent = title;
        const p = this.large.querySelector('p');
        if (p && subtitle !== undefined) {
          p.textContent = subtitle;
          p.style.display = subtitle ? '' : 'none';
        }
      }
      this.measure();
    }

    destroy() {
      if (this.scroller) {
        this.scroller.removeEventListener('scroll', this.onScroll);
      }
      if (this.ro) {
        this.ro.disconnect();
      }
    }
  }

  const registry = new Map();

  const CollapsingHeader = {
    init() {
      const screens = document.querySelectorAll('.screen');
      screens.forEach((screenEl) => {
        if (screenEl.querySelector('.bar') && screenEl.querySelector('.scroller')) {
          if (!registry.has(screenEl)) {
            const instance = new CollapsingHeaderInstance(screenEl);
            registry.set(screenEl, instance);
            screenEl._collapsingHeader = instance;
          }
        }
      });
    },

    get(screenElOrId) {
      const el = typeof screenElOrId === 'string'
        ? document.getElementById(screenElOrId) || document.getElementById('screen-' + screenElOrId)
        : screenElOrId;
      return el ? registry.get(el) || el._collapsingHeader : null;
    },

    reset(screenElOrId) {
      const instance = this.get(screenElOrId);
      if (instance) {
        instance.reset();
      } else {
        const el = typeof screenElOrId === 'string'
          ? document.getElementById(screenElOrId) || document.getElementById('screen-' + screenElOrId)
          : screenElOrId;
        if (el) {
          const scroller = el.querySelector('.scroller');
          if (scroller) scroller.scrollTop = 0;
        }
      }
    },

    resetAll() {
      registry.forEach((instance) => instance.reset());
    },

    setTitle(screenElOrId, title, subtitle) {
      const instance = this.get(screenElOrId);
      if (instance) {
        instance.setTitle(title, subtitle);
      } else {
        const el = typeof screenElOrId === 'string'
          ? document.getElementById(screenElOrId) || document.getElementById('screen-' + screenElOrId)
          : screenElOrId;
        if (el) {
          el.querySelectorAll('.screen-title').forEach((t) => { t.textContent = title; });
          if (subtitle !== undefined) {
            el.querySelectorAll('.screen-subtitle').forEach((s) => {
              s.textContent = subtitle;
              s.style.display = subtitle ? '' : 'none';
            });
          }
        }
      }
    },

    refresh(screenElOrId) {
      const instance = this.get(screenElOrId);
      if (instance) {
        instance.refreshIcons();
        instance.measure();
      }
    }
  };

  global.CollapsingHeader = CollapsingHeader;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => CollapsingHeader.init());
    } else {
      CollapsingHeader.init();
    }
  }
})(typeof window !== 'undefined' ? window : this);
