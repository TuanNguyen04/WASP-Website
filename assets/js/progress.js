/* =========================================================
   Shared helpers: personal progress (this device only),
   contributor titles, badges, scale colours, toasts.
   ========================================================= */
(function () {
  const { QUESTION_TYPES, GROUPS, TOTAL_SPECIES, IUCN_COLORS } = WASP;

  /* ---------- small utilities ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('en');
  const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hex = (a) => '#' + a.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((c, i) => c + (y[i] - c) * t)); };
  const ink = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.33 ? '#1f2421' : '#ffffff'; };

  /* ---------- scale colours: encode the nature of each scale ---------- */
  const SLATE = '#5f6670';
  const NEUTRAL = '#e9ecea';
  const cache = {};
  function paletteFor(q) {
    if (cache[q.id]) return cache[q.id];
    let p;
    if (q.type === 'categorical') p = IUCN_COLORS.slice();
    else if (q.type === 'bipolar') p = Array.from({ length: 9 }, (_, i) => (i < 4 ? mix(SLATE, NEUTRAL, i / 4) : mix(NEUTRAL, q.hex, (i - 4) / 4)));
    else p = Array.from({ length: 9 }, (_, i) => mix(mix(q.hex, '#ffffff', 0.86), q.hex, i / 8));
    return (cache[q.id] = p);
  }
  function colorAt(q, v) { // v: 1..9 (may be fractional)
    const p = paletteFor(q);
    if (q.type === 'categorical') return p[Math.min(8, Math.max(0, Math.round(v) - 1))];
    const x = Math.min(8, Math.max(0, v - 1)); const i = Math.min(7, Math.floor(x));
    return mix(p[i], p[i + 1], x - i);
  }

  /* ---------- progress ---------- */
  const KEY = 'wasp.a.progress.v2';
  const blank = () => ({ consent: false, rated: [], days: [] });
  let state;
  try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { state = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* unavailable */ } };

  const TITLES = [
    { min: 0, name: 'Visitor' },
    { min: 1, name: 'Contributor' },
    { min: 10, name: 'Observer' },
    { min: 25, name: 'Field Assistant' },
    { min: 50, name: 'Naturalist' },
    { min: 100, name: 'Field Researcher' },
    { min: 250, name: 'Senior Researcher' },
    { min: 500, name: 'Archivist' },
    { min: 1000, name: 'Curator' },
    { min: TOTAL_SPECIES, name: 'Guardian of the Archive' }
  ];
  function titleFor(n = state.rated.length) {
    let i = 0;
    while (i + 1 < TITLES.length && n >= TITLES[i + 1].min) i++;
    const cur = TITLES[i], next = TITLES[i + 1];
    return { i, cur, next, pct: next ? Math.round(((n - cur.min) / (next.min - cur.min)) * 100) : 100 };
  }
  const day = (d = new Date()) => d.toLocaleDateString('en-CA');
  function streak() {
    const days = new Set(state.days); const d = new Date();
    if (!days.has(day())) d.setDate(d.getDate() - 1);
    let n = 0; while (days.has(day(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const perGroup = () => { const c = {}; state.rated.forEach((r) => { c[r.group] = (c[r.group] || 0) + 1; }); return c; };
  const BADGES = [
    { id: 'first', name: 'First observation', desc: 'Rate your first species', icon: 'star', goal: 1, val: () => state.rated.length },
    { id: 'ten', name: 'Ten in the archive', desc: 'Rate 10 species', icon: 'layers', goal: 10, val: () => state.rated.length },
    { id: 'fifty', name: 'Fifty species', desc: 'Rate 50 species', icon: 'trophy', goal: 50, val: () => state.rated.length },
    { id: 'century', name: 'Century', desc: 'Rate 100 species', icon: 'award', goal: 100, val: () => state.rated.length },
    { id: 'streak3', name: 'Three-day streak', desc: 'Rate on 3 days in a row', icon: 'flame', goal: 3, val: () => streak() },
    { id: 'streak7', name: 'Week-long watcher', desc: 'Rate on 7 days in a row', icon: 'flame', goal: 7, val: () => streak() },
    { id: 'tree', name: 'Tree-of-life tourist', desc: 'Rate a species from all 10 groups', icon: 'globe', goal: 10, val: () => Object.keys(perGroup()).length },
    { id: 'specialist', name: 'Group specialist', desc: 'Rate 25 species from one group', icon: 'target', goal: 25, val: () => Math.max(0, ...Object.values(perGroup())) }
  ];
  const earned = () => new Set(BADGES.filter((b) => b.val() >= b.goal).map((b) => b.id));

  function record(sp, answers) {
    const before = { badges: earned(), title: titleFor().i };
    state.rated.push({ id: sp.id, name: sp.name, group: sp.group, src: sp.src, date: day(), answers: { ...answers } });
    if (!state.days.includes(day())) state.days.push(day());
    save();
    const t = titleFor();
    const after = earned();
    return {
      newTitle: t.i > before.title ? t.cur : null,
      newBadges: BADGES.filter((b) => after.has(b.id) && !before.badges.has(b.id))
    };
  }
  function reset() { const c = state.consent; state = blank(); state.consent = c; save(); }

  /* ---------- toasts ---------- */
  function toast(icon, title, text) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="medal">${WASP.icon(icon)}</div><div><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); }, 3800);
  }

  WASP.util = { esc, fmt, ago, mix, ink, paletteFor, colorAt };
  WASP.progress = {
    get state() { return state; },
    TITLES, BADGES, titleFor, streak, perGroup, earned, record, reset, save, toast,
    groupById: Object.fromEntries(GROUPS.map((g) => [g.id, g])),
    QUESTION_TYPES
  };
})();
