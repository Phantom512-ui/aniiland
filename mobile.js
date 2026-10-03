/*
 * Aniiland — phone experience layer
 * ---------------------------------
 * Works together with mobile.css. Everything here is additive: the main app
 * (app.bundle.js) is untouched. On phones (see PHONE_QUERY) we
 *   1. add a bottom tab bar (the app already handles any [data-tab] click and
 *      toggles .active on every `nav button`, so no proxying is needed),
 *   2. turn the planner sidebar into a bottom sheet with a live summary bar,
 *   3. tuck away the floating Order Solver / Sections menu on first sight,
 *   4. keep a few CSS variables in sync with the real header height,
 *   5. surface the Ko-fi link + version in the footer (they leave the header).
 */
(() => {
  const PHONE_QUERY = '(max-width:760px), (max-width:960px) and (pointer:coarse)';
  const mq = window.matchMedia(PHONE_QUERY);
  const root = document.documentElement;
  const sidebar = document.querySelector('.planner-sidebar');
  const toggle = document.querySelector('[data-mobile-settings-toggle]');
  const summary = document.querySelector('[data-mobile-settings-summary]');
  if (!sidebar || !toggle || !summary) return;

  const t = (s) => window.AniilandI18n?.t?.(s) || s;
  const $ = (s, r = document) => r.querySelector(s);

  /* ------------------------------------------------------------------ *
   * 1. Bottom tab bar
   * ------------------------------------------------------------------ */
  const ICONS = {
    plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    layout: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7"/></svg>',
    sources: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>'
  };

  const buildTabBar = () => {
    if ($('#m-tabbar')) return;
    const realTabs = [...document.querySelectorAll('header nav [data-tab]')];
    if (!realTabs.length) return;
    const bar = document.createElement('nav');
    bar.id = 'm-tabbar';
    bar.className = 'm-tabbar';
    bar.setAttribute('aria-label', 'Main navigation');
    realTabs.forEach((src) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.tab = src.dataset.tab;
      b.className = src.classList.contains('active') ? 'active' : '';
      b.innerHTML = `${ICONS[src.dataset.tab] || ''}<span></span>`;
      b.querySelector('span').textContent = src.textContent.trim();
      bar.appendChild(b);
    });
    document.body.appendChild(bar);

    // Keep labels in sync when the interface language changes.
    const syncLabels = () => {
      realTabs.forEach((src) => {
        const mine = bar.querySelector(`[data-tab="${src.dataset.tab}"] span`);
        const text = src.textContent.trim();
        if (mine && text && mine.textContent !== text) mine.textContent = text;
      });
    };
    new MutationObserver(syncLabels).observe($('header nav'), { childList: true, subtree: true, characterData: true });
    window.addEventListener('aniiland:languagechange', () => setTimeout(syncLabels, 30));

    // Scroll to top when switching tabs so every page starts at its beginning.
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    });
  };

  /* ------------------------------------------------------------------ *
   * 2. Planner settings sheet + live summary
   * ------------------------------------------------------------------ */
  const settingsDisclosures = [...sidebar.querySelectorAll('[data-mobile-expand]')];
  const mobileDisclosureState = new Map();

  const getGoal = () =>
    document.querySelector('#strategy-grid .goal-btn.active')?.textContent?.trim() ||
    document.querySelector('#strategy')?.selectedOptions?.[0]?.textContent?.trim() ||
    'Planner';

  const getWorkerSummary = () => {
    if (document.querySelector('#custom-aniimo-open.active')) return t('Custom Aniimo Team');
    const mode = document.querySelector('#worker button.active')?.dataset.worker;
    const worker = mode === 'minimum' ? 'Minimum' : mode === '4' ? 'Lv.4 Prismana' : 'Trait Lvl.3';
    const enabled = ['bonus', 'climate', 'light-climate', 'emode'].filter((id) => {
      const input = document.getElementById(id);
      return input && !input.disabled && input.checked;
    }).length;
    return `${t(worker)} · ${enabled} ${window.AniilandV2Text?.t?.('options_on') || 'options on'}`;
  };

  const updateSettingsChoices = () => {
    const goalChoice = $('[data-settings-choice="goal"]');
    const workerChoice = $('[data-settings-choice="workers"]');
    if (goalChoice) goalChoice.textContent = getGoal();
    if (workerChoice) workerChoice.textContent = getWorkerSummary();
  };

  const updateSummary = () => {
    const rv =
      $('#level-value')?.value ||
      $('#level-value')?.textContent?.trim() ||
      $('#level')?.value ||
      '—';
    summary.textContent = `RV ${rv} · ${getGoal()}`;
    updateSettingsChoices();
  };
  window.addEventListener('aniiland:languagechange', updateSummary);
  window.addEventListener('aniiland:gamelanguagechange', updateSummary);

  const setOpen = (open) => {
    if (!mq.matches) open = false;
    const was = sidebar.classList.contains('mobile-settings-open');
    sidebar.classList.toggle('mobile-settings-open', !!open);
    root.classList.toggle('m-sheet-open', !!open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    const action = toggle.querySelector('.mobile-settings-action>span');
    if (action) action.textContent = open ? t('Close') : t('Adjust');
    if (open && !was) sidebar.scrollTop = 0;
  };

  const syncMode = () => {
    root.classList.toggle('aniiland-phone', mq.matches);
    settingsDisclosures.forEach((d) => {
      if (mq.matches) {
        if (!mobileDisclosureState.has(d)) mobileDisclosureState.set(d, d.open);
        d.open = true;
      } else if (mobileDisclosureState.has(d)) {
        d.open = mobileDisclosureState.get(d);
        mobileDisclosureState.delete(d);
      }
    });
    if (!mq.matches) setOpen(false);
    updateSummary();
    measureHeader();
  };

  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('mobile-settings-open')));

  // Tap outside the sheet (the dimmed backdrop), a tab, or Calculate → close.
  document.addEventListener('click', (e) => {
    if (!mq.matches || root.classList.contains('guide-open')) return;
    if (!sidebar.classList.contains('mobile-settings-open')) return;
    const outside = !sidebar.contains(e.target);
    if (outside || e.target.closest('[data-tab]') || e.target.closest('#optimize')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (!mq.matches || e.key !== 'Escape' || !sidebar.classList.contains('mobile-settings-open')) return;
    setOpen(false);
    toggle.focus();
  });

  const level = $('#level-value');
  const goals = $('#strategy-grid');
  const workers = $('#worker');
  if (level) new MutationObserver(updateSummary).observe(level, { childList: true, subtree: true, characterData: true });
  if (goals) new MutationObserver(updateSummary).observe(goals, { attributes: true, subtree: true, attributeFilter: ['class'] });
  if (workers) new MutationObserver(updateSettingsChoices).observe(workers, { attributes: true, subtree: true, attributeFilter: ['class'] });
  $('#strategy')?.addEventListener('change', updateSummary);
  sidebar.addEventListener('change', (e) => {
    if (e.target.matches('#bonus,#climate,#light-climate,#emode')) updateSettingsChoices();
    if (e.target.matches('#level,#level-value')) updateSummary();
  });
  sidebar.addEventListener('input', (e) => {
    if (e.target.matches('#level,#level-value')) updateSummary();
  });
  updateSettingsChoices();

  /* ------------------------------------------------------------------ *
   * 3. Keep floating helpers out of the way on first sight
   * ------------------------------------------------------------------ */
  // The Order Solver opens itself on a first launch and can restore as "open"
  // from a previous session. On a phone it is a full sheet, so close it once.
  let orderTidied = false;
  const tidyOrderDock = () => {
    if (orderTidied || !mq.matches) return;
    const panel = $('#order-dock .order-panel');
    if (!panel) return;
    orderTidied = true;
    if (!panel.hidden) $('#order-dock [data-order-toggle].order-fab')?.click();
  };

  /* ------------------------------------------------------------------ *
   * 4. Sections drawer (Production Plan quick nav) — active tracking
   * ------------------------------------------------------------------ */
  let quickNavRaf = 0;
  const updateQuickNavActive = () => {
    if (!mq.matches) return;
    const nav = $('#plan-quick-nav');
    if (!nav || nav.hidden) return;
    cleanQuickNavLabels();
    const buttons = [...nav.querySelectorAll('[data-plan-nav-target]')];
    if (!buttons.length) return;
    const probe = Math.max(120, Math.min(window.innerHeight * 0.34, 240));
    let active = buttons[0];
    for (const btn of buttons) {
      const target = document.getElementById(btn.dataset.planNavTarget);
      if (!target) continue;
      if (target.getBoundingClientRect().top <= probe) active = btn;
      else break;
    }
    buttons.forEach((btn) => btn.classList.toggle('active', btn === active));
  };
  // The app copies each section title incl. its "?" help button into the menu.
  const cleanQuickNavLabels = () => {
    document.querySelectorAll('#plan-quick-nav .plan-quick-nav-links button span').forEach((span) => {
      const txt = span.textContent;
      const cleaned = txt.replace(/\s*\?\s*$/, '');
      if (cleaned !== txt) span.textContent = cleaned;
    });
  };
  const queueQuickNavActive = () => {
    if (quickNavRaf) return;
    quickNavRaf = requestAnimationFrame(() => {
      quickNavRaf = 0;
      updateQuickNavActive();
    });
  };
  window.addEventListener('scroll', queueQuickNavActive, { passive: true });
  window.addEventListener('resize', queueQuickNavActive, { passive: true });

  // After jumping to a section, tuck the drawer away (the app starts the scroll).
  document.addEventListener('click', (e) => {
    if (!mq.matches) return;
    if (!e.target.closest('[data-plan-nav-target]')) return;
    requestAnimationFrame(() => {
      $('#plan-quick-nav')?.classList.add('collapsed');
      try { localStorage.setItem('aniiland-quick-nav-collapsed', 'true'); } catch {}
      setTimeout(updateQuickNavActive, 260);
    });
  });
  // Tapping anywhere else closes the drawer.
  document.addEventListener('click', (e) => {
    if (!mq.matches) return;
    const nav = $('#plan-quick-nav');
    if (!nav || nav.classList.contains('collapsed') || nav.contains(e.target)) return;
    nav.classList.add('collapsed');
    try { localStorage.setItem('aniiland-quick-nav-collapsed', 'true'); } catch {}
  });

  /* ------------------------------------------------------------------ *
   * 5. Event Center: bring the selected tab to the top of the sheet
   * ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    if (!mq.matches) return;
    const tab = e.target.closest('[data-event-tab]');
    if (!tab) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const scroller = $('#event-center-content');
        const tabs = $('#event-center-content .event-tabs');
        if (scroller && tabs) scroller.scrollTo({ top: Math.max(0, tabs.offsetTop - 2), behavior: 'smooth' });
      })
    );
  });

  /* ------------------------------------------------------------------ *
   * 6. Header helpers (height var, accessible labels, footer extras)
   * ------------------------------------------------------------------ */
  const header = $('header');
  function measureHeader() {
    if (!header) return;
    const h = Math.round(header.getBoundingClientRect().height);
    if (h) root.style.setProperty('--m-header-h', `${h}px`);
  }
  if (header && 'ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);

  const decorateHeader = () => {
    const ev = $('#event-center-btn');
    if (ev) {
      const name = ev.querySelector('.game-localized-name')?.textContent?.trim() || 'Harvest Moon';
      const sub = ev.querySelector('small')?.textContent?.trim() || '';
      ev.setAttribute('aria-label', sub ? `${name} — ${sub}` : name);
      ev.title = sub ? `${name} — ${sub}` : name;
    }
    const guide = $('#guide-open');
    if (guide) guide.setAttribute('aria-label', guide.textContent.replace('?', '').trim() || 'How to use');
  };

  const addFooterExtras = () => {
    const footer = $('footer.site-footer');
    if (!footer || $('.m-footer-extra', footer)) return;
    const kofi = $('header .kofi-button');
    const version = $('header .version');
    const wrap = document.createElement('div');
    wrap.className = 'm-footer-extra';
    if (kofi) {
      const link = kofi.cloneNode(true);
      link.classList.add('m-footer-kofi');
      wrap.appendChild(link);
    }
    if (version) {
      const v = version.cloneNode(true);
      v.classList.add('m-footer-version');
      wrap.appendChild(v);
    }
    // Translation note lives in the header's language controls on desktop.
    const note = $('#translation-note-trigger');
    if (note) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'm-translation-note';
      btn.textContent = `ⓘ ${note.getAttribute('aria-label') || 'Translation information'}`;
      btn.addEventListener('click', () => note.click());
      const sync = () => { btn.hidden = note.hidden; };
      sync();
      new MutationObserver(sync).observe(note, { attributes: true, attributeFilter: ['hidden'] });
      wrap.appendChild(btn);
    }
    footer.prepend(wrap);
  };

  /* ------------------------------------------------------------------ *
   * 7. Label table cells so the card layout can show column names
   * ------------------------------------------------------------------ */
  let labelRaf = 0;
  const labelTableCells = () => {
    labelRaf = 0;
    if (!mq.matches) return;
    document.querySelectorAll('.mobile-production-table table').forEach((table) => {
      const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
      if (!heads.length) return;
      table.querySelectorAll('tbody tr').forEach((tr) => {
        [...tr.children].forEach((td, i) => {
          if (i === 0 || !heads[i]) return;
          if (td.dataset.label !== heads[i]) td.dataset.label = heads[i];
        });
      });
    });
  };
  const queueLabelCells = () => {
    if (!labelRaf) labelRaf = requestAnimationFrame(labelTableCells);
  };

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  buildTabBar();
  decorateHeader();
  addFooterExtras();

  // The app injects some elements after it has loaded its data.
  const bodyObserver = new MutationObserver(() => {
    tidyOrderDock();
    queueQuickNavActive();
    decorateHeader();
  });
  bodyObserver.observe(document.body, { childList: true });
  const content = $('#content');
  if (content) new MutationObserver(() => { queueQuickNavActive(); queueLabelCells(); }).observe(content, { childList: true, subtree: true });
  const eventBtn = $('#event-center-btn');
  if (eventBtn) new MutationObserver(decorateHeader).observe(eventBtn, { childList: true, subtree: true, characterData: true });

  mq.addEventListener?.('change', syncMode);
  window.addEventListener('orientationchange', () => setTimeout(syncMode, 80));
  syncMode();
  queueLabelCells();
  tidyOrderDock();
  setTimeout(tidyOrderDock, 600);
})();
