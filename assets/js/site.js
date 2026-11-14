/* WASP — shared site behaviour: icon sprite, mobile navigation, active link. */
(function () {
  // Inline SVG sprite (Lucide-style outline icons, 24px grid, 1.8 stroke).
  // Injected at runtime so <use href="#i-…"> also works when opened from file://.
  const ICONS = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.2 1.6 1 2.6 2 2.6 0-3 1-5.6 1-8Z"/>',
    sprout: '<path d="M12 21v-9M12 12c0-4 3-7 8-7 0 5-3 7-8 7ZM12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5Z"/>',
    egg: '<path d="M12 3c3.6 0 6.5 6 6.5 10.5A6.5 6.5 0 0 1 5.5 13.5C5.5 9 8.4 3 12 3Z"/>',
    bug: '<rect x="8" y="7" width="8" height="13" rx="4"/><path d="M12 7V4M9 4l1.5 2M15 4l-1.5 2M4 10h4M16 10h4M4 15h4M16 15h4M4 20l4-2M20 20l-4-2"/>',
    binoculars: '<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15.5h4M4 13 6 5h3l1 7M20 13l-2-8h-3l-1 7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z"/><path d="M4 20a2 2 0 0 0 2 2h13v-4"/><path d="M9 7h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    feather: '<path d="M20 4c-6 0-12 4-13 13l-3 3M7 17h7c3-2 5-6 6-13M10 13h6"/>',
    shell: '<path d="M12 21c-5 0-8-4-8-8a8 8 0 0 1 16 0c0 4-3 8-8 8Z"/><path d="M12 21V8M12 21 7 9M12 21l5-12"/>',
    wave: '<path d="M2 12c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 17c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 7c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
    paw: '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4-2Z"/>',
    lizard: '<path d="M4 15a7 6 0 0 1 14 0Z"/><path d="M18 14h1.5a2 2 0 0 0 0-4H18M7 15l-1 3M15 15l1 3M4 15H2M8.5 15l1.5-4.5h2L13.5 15"/>',
    fish: '<path d="M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2Z"/><circle cx="8" cy="11" r=".6"/>',
    frog: '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M5.5 9C4 11 4 16 8 18h8c4-2 4-7 2.5-9"/><path d="M9 13.5c1.8 1 4.2 1 6 0M4 19l3-1M20 19l-3-1"/>',
    crab: '<ellipse cx="12" cy="14" rx="6" ry="4"/><path d="M6 13 3 10l1-4M18 13l3-3-1-4M3 6l2 1M21 6l-2 1M7 17l-3 3M17 17l3 3M10 10V8M14 10V8"/>',
    coral: '<path d="M12 21V11M12 14 8 10V6M12 12l4-4V4M8 8 6 6M16 6l2-1M8 21h8"/>',
    spider: '<circle cx="12" cy="9" r="2"/><ellipse cx="12" cy="15" rx="3" ry="4"/><path d="M9.5 13 4 10l-1-5M14.5 13 20 10l1-5M9 15H3M15 15h6M9.5 17 5 21M14.5 17l4.5 4"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>',
    microscope: '<path d="M6 21h12M9 17h6M12 17v-4M9 3l5 1-2 8-5-1 2-8ZM14 10a5 5 0 0 1 1 9"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>'
  };
  const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.display = 'none';
  sprite.innerHTML = Object.entries(ICONS)
    .map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${d}</symbol>`).join('');
  document.body.prepend(sprite);

  window.WASP = window.WASP || {};
  window.WASP.icon = (name, extra = '') =>
    `<svg class="icon ${extra}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  // Mobile navigation
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { toggle.click(); toggle.focus(); }
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
