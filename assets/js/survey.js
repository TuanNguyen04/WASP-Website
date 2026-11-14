/* =========================================================
   WASP-A survey — rating flow + engagement
   - Hexagon rating scales coloured by scale type
     (bipolar = diverging, unipolar = sequential, categorical = IUCN colours)
   - Contributor titles acknowledging how much someone contributes
   - Streaks, badges and a group collection
   - Group-level summary statistics (never per species), shown after rating
   Survey content (question, attributes, 9-point labels, consent) is unchanged.
   ========================================================= */
(function () {
  const { QUESTION_TYPES, SCALE_LABELS, PALETTES, GROUPS, TOTAL_SPECIES, GROUP_SIZE, icon, api } = WASP;
  const groupById = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

  /* ---------------- local progress (this device only) ---------------- */
  const KEY = 'wasp.a.progress.v2';
  const blank = () => ({ consent: false, rated: [], days: [] });
  const load = () => { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return blank(); } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* unavailable */ } };
  let state = load();

  /* ---------------- contributor titles ---------------- */
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
  function titleFor(n) {
    let i = 0;
    while (i + 1 < TITLES.length && n >= TITLES[i + 1].min) i++;
    return { i, cur: TITLES[i], next: TITLES[i + 1] };
  }

  /* ---------------- streaks, groups, badges ---------------- */
  const day = (d = new Date()) => d.toLocaleDateString('en-CA');
  function streak() {
    const days = new Set(state.days);
    const d = new Date();
    if (!days.has(day())) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(day(d))) { n++; d.setDate(d.getDate() - 1); }
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

  /* ---------------- colour helpers ---------------- */
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const ink = (h) => { const [r, g, b] = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36 ? '#1d1d1e' : '#ffffff'; };
  function colorAt(pal, v) { // v in 1..9 (float) -> interpolated hex
    const p = PALETTES[pal];
    if (pal === 'iucn') return p[Math.min(8, Math.max(0, Math.round(v) - 1))];
    const x = Math.min(8, Math.max(0, v - 1)); const i = Math.floor(x); const t = x - i;
    if (i >= 8) return p[8];
    const a = hexToRgb(p[i]); const b = hexToRgb(p[i + 1]);
    return '#' + a.map((c, k) => Math.round(c + (b[k] - c) * t).toString(16).padStart(2, '0')).join('');
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('en');
  const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };

  /* ---------------- DOM ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const card = $('#rate-card');
  const form = $('#q-form');
  const rows = $('#q-rows');
  const pips = $('#q-progress');
  const rateBtn = $('#btn-rate');
  const hint = $('#rate-hint');
  const img = $('#species-img');
  const shimmer = $('#species-shimmer');
  let current = null;
  let answers = {};
  let stats = null;

  /* ---------------- hexagon scales ---------------- */
  function buildForm() {
    rows.innerHTML = QUESTION_TYPES.map((q) => {
      const labels = SCALE_LABELS[q.id];
      const pal = PALETTES[q.palette];
      const hexes = labels.map((lab, i) => `
        <label class="hex" style="--fill:${pal[i]};--ink:${ink(pal[i])}" title="${esc(lab)}">
          <input type="radio" name="${q.id}" value="${i + 1}" aria-label="${i + 1} of 9: ${esc(lab)}">
          <span class="hex-shape"><span class="hex-num">${i + 1}</span></span>
        </label>`).join('');
      const legend = q.type === 'categorical'
        ? `<ul class="iucn-legend" aria-label="IUCN Red List guideline">${WASP.IUCN_LEGEND.map(([name, vals]) =>
            `<li><i style="background:${pal[vals[0] - 1]}"></i>${esc(name)} <span>(${vals.join('–')})</span></li>`).join('')}</ul>`
        : `<div class="scale-ends" aria-hidden="true"><span>${esc(labels[0])}</span>${q.type === 'bipolar' ? `<span class="mid">${esc(labels[4])}</span>` : ''}<span>${esc(labels[8])}</span></div>`;
      return `
        <fieldset class="attr-row type-${q.type}" style="--c:${q.color}" data-q="${q.id}">
          <legend>${esc(q.text)}</legend>
          <span class="attr-value empty" aria-live="polite" id="v-${q.id}">Not rated yet</span>
          <div class="hex-scale">${hexes}</div>
          ${legend}
        </fieldset>`;
    }).join('');
    pips.innerHTML = QUESTION_TYPES.map((q) => `<i style="--c:${q.color}" data-p="${q.id}"></i>`).join('');
  }

  function paintRow(qid) {
    const v = answers[qid] || 0;
    const fs = rows.querySelector(`[data-q="${qid}"]`);
    fs.classList.toggle('has-value', !!v);
    fs.querySelectorAll('.hex').forEach((lab, i) => lab.classList.toggle('sel', i + 1 === v));
    const out = $(`#v-${qid}`);
    out.textContent = v ? SCALE_LABELS[qid][v - 1] : 'Not rated yet';
    out.classList.toggle('empty', !v);
    pips.querySelector(`[data-p="${qid}"]`).classList.toggle('done', !!v);
  }

  function updateRateState() {
    const done = Object.keys(answers).length;
    const all = done === QUESTION_TYPES.length;
    rateBtn.disabled = !all;
    hint.textContent = all ? 'All six rated. Ready to submit.' : `${done} of ${QUESTION_TYPES.length} rated`;
  }

  form.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    answers[e.target.name] = Number(e.target.value);
    paintRow(e.target.name);
    updateRateState();
  });

  function showSpecies(sp) {
    current = sp;
    answers = {};
    form.reset();
    QUESTION_TYPES.forEach((q) => paintRow(q.id));
    updateRateState();
    card.classList.remove('show-result');
    shimmer.hidden = false;
    img.classList.add('loading');
    img.alt = `Photograph of ${sp.name}`;
    img.onload = () => { shimmer.hidden = true; img.classList.remove('loading'); };
    img.onerror = () => { shimmer.hidden = true; img.classList.remove('loading'); img.alt = `Image of ${sp.name} could not be loaded`; };
    img.src = sp.src;
    $('#species-no').textContent = `Specimen No. ${String(sp.id).padStart(4, '0')}`;
    $('#species-name').textContent = sp.name;
    $('#species-credit').innerHTML = sp.licenseUrl
      ? `<a href="${sp.licenseUrl}" target="_blank" rel="noopener">${esc(sp.photographer)}</a>` : esc(sp.photographer);
  }

  async function loadNext() {
    const exclude = new Set(state.rated.map((r) => r.id));
    try { showSpecies(await api.nextSpecies(exclude)); }
    catch { $('#species-name').textContent = 'Could not load the next species. Please try again.'; }
  }

  /* ---------------- submit ---------------- */
  const consentDlg = $('#consent-dialog');
  rateBtn.addEventListener('click', () => {
    if (rateBtn.disabled) return;
    if (!state.consent) { consentDlg.showModal(); return; }
    submit();
  });
  $('#consent-ok').addEventListener('click', () => { state.consent = true; save(); consentDlg.close(); submit(); });
  $('#consent-cancel').addEventListener('click', () => consentDlg.close());

  function submit() {
    const before = { badges: earned(), title: titleFor(state.rated.length).i, streak: streak(), groups: Object.keys(perGroup()).length };
    // Recorded locally first (outbox), then synced in the background: never blocks the respondent.
    api.submitResponse(current.id, { ...answers });
    state.rated.push({ id: current.id, name: current.name, group: current.group, src: current.src, date: day(), answers: { ...answers } });
    if (!state.days.includes(day())) state.days.push(day());
    save();

    renderResult();
    renderHud(true);
    renderJournal();

    const t = titleFor(state.rated.length);
    const queue = [];
    if (t.i > before.title) queue.push(['award', `New title: ${t.cur.name}`, `Thank you! ${fmt(state.rated.length)} species rated so far.`]);
    const after = earned();
    BADGES.filter((b) => after.has(b.id) && !before.badges.has(b.id)).forEach((b) => queue.push([b.icon, `Badge unlocked: ${b.name}`, b.desc]));
    if (Object.keys(perGroup()).length > before.groups) { const g = groupById[current.group]; queue.push([g.icon, `New group discovered: ${g.name}`, `${Object.keys(perGroup()).length} of 10 animal groups explored.`]); }
    if (streak() > before.streak && streak() > 1) queue.push(['flame', `${streak()}-day streak!`, 'Come back tomorrow to keep it going.']);
    queue.forEach((q, i) => setTimeout(() => toast(...q), 250 + i * 900));
  }

  /* ---------------- group-level summary ---------------- */
  function histHTML(q, s, you, compact) {
    const pal = PALETTES[q.palette];
    const max = Math.max(...s.hist);
    const total = s.hist.reduce((a, b) => a + b, 0);
    const modeI = s.hist.indexOf(max);
    const headline = q.type === 'categorical'
      ? `Most chosen: ${SCALE_LABELS[q.id][modeI]} (${Math.round((max / total) * 100)}%)`
      : `Mean ${s.mean.toFixed(1)} · ${SCALE_LABELS[q.id][Math.round(s.mean) - 1]}`;
    const bars = s.hist.map((c, i) => {
      const pct = Math.round((c / total) * 100);
      return `<span class="bar ${you === i + 1 ? 'you' : ''}" style="--h:${Math.max(4, (c / max) * 100)}%;--fill:${pal[i]}" title="${esc(SCALE_LABELS[q.id][i])}: ${pct}%"></span>`;
    }).join('');
    const marker = q.type === 'categorical' ? '' : `<span class="mean-mark" style="left:${((s.mean - 0.5) / 9) * 100}%" aria-hidden="true"></span>`;
    const desc = `${q.text}: ${headline}.${you ? ` You rated ${you}: ${SCALE_LABELS[q.id][you - 1]}.` : ''}`;
    return `
      <li class="hist ${compact ? 'compact' : ''}" style="--c:${q.color}">
        <div class="hist-head"><strong>${esc(q.text)}</strong><span>${esc(headline)}</span></div>
        <div class="bars" role="img" aria-label="${esc(desc)}">${bars}${marker}</div>
        <div class="hist-axis" aria-hidden="true"><span>1</span>${you ? `<span class="you-tag" style="left:${((you - 0.5) / 9) * 100}%">You</span>` : ''}<span>9</span></div>
      </li>`;
  }

  let statsPromise = null;
  function ensureStats() {
    if (!statsPromise) statsPromise = api.groupStats().then((s) => (stats = s)).catch((e) => { statsPromise = null; throw e; });
    return statsPromise;
  }

  async function renderResult() {
    const g = groupById[current.group];
    $('#result-group').innerHTML = `${icon(g.icon)}${esc(g.name)}`;
    $('#result-name').textContent = current.name;
    const mine = perGroup()[g.id] || 0;
    $('#result-count').textContent = `You have now rated ${mine} of ≈${g.id === 'corals' ? 180 : GROUP_SIZE} ${g.name.toLowerCase()}.`;
    $('#group-hists').innerHTML = QUESTION_TYPES.map(() => '<li class="hist skeleton"></li>').join('');
    card.classList.add('show-result');
    $('#result-title').focus();
    try {
      const s = await ensureStats();
      const gs = s.groups.find((x) => x.id === g.id);
      $('#group-hists').innerHTML = QUESTION_TYPES.map((q) => histHTML(q, gs.questions[q.id], answers[q.id], true)).join('');
      $('#group-source').textContent = `Based on ${fmt(gs.responses)} responses for ${g.name.toLowerCase()} · updated ${ago(s.updatedAt)}${s.illustrative ? ' · illustrative data (prototype)' : ''}`;
    } catch {
      $('#group-hists').innerHTML = '<li class="stats-error">Group statistics are temporarily unavailable. Your rating has been saved.</li>';
    }
  }

  $('#btn-next').addEventListener('click', async () => { await loadNext(); $('#q-title').focus(); });

  /* ---------------- HUD ---------------- */
  function renderHud(animate) {
    const n = state.rated.length;
    const t = titleFor(n);
    $('#title-name').textContent = t.cur.name;
    $('#title-sub').textContent = t.next
      ? (n ? `${fmt(t.next.min - n)} more species to become ${t.next.name}` : 'Rate your first species to become a Contributor')
      : 'Every species in WASP-A rated. Thank you!';
    const pct = t.next ? Math.round(((n - t.cur.min) / (t.next.min - t.cur.min)) * 100) : 100;
    $('#titlebar').style.width = `${pct}%`;
    $('#titlebar').parentElement.setAttribute('aria-valuenow', pct);
    const set = (id, v) => { const el = $(id); el.textContent = v; if (animate) { const p = el.closest('.hud-stat'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } };
    set('#stat-rated', fmt(n));
    const s = streak();
    set('#stat-streak', s);
    $('#stat-streak-wrap').classList.toggle('hot', s >= 2);
    set('#stat-groups', `${Object.keys(perGroup()).length}/10`);
    $('#archive-progress').textContent = `${fmt(n)} of ${fmt(TOTAL_SPECIES)} animals discovered`;
  }

  /* ---------------- journal ---------------- */
  function renderJournal() {
    const counts = perGroup();
    $('#group-collection').innerHTML = GROUPS.map((g) => {
      const c = counts[g.id] || 0;
      const size = g.id === 'corals' ? 180 : GROUP_SIZE;
      return `<li class="${c ? 'found' : ''}">
        <span class="g-icon">${icon(g.icon)}</span>
        <strong>${esc(g.name)}</strong>
        <span class="g-count mono">${c} / ≈${size}</span>
        <span class="meter" role="progressbar" aria-label="${esc(g.name)} rated" aria-valuemin="0" aria-valuemax="${size}" aria-valuenow="${c}"><i style="width:${Math.min(100, (c / size) * 100)}%"></i></span>
      </li>`;
    }).join('');

    const got = earned();
    $('#badges').innerHTML = BADGES.map((b) => {
      const v = Math.min(b.val(), b.goal);
      const has = got.has(b.id);
      return `<li class="badge ${has ? 'earned' : ''}">
        <div class="medal">${icon(b.icon)}</div>
        <strong>${esc(b.name)}</strong><span>${esc(b.desc)}</span>
        ${has ? '<div class="state">Earned</div>'
              : `<div class="meter" role="progressbar" aria-label="${esc(b.name)} progress" aria-valuemin="0" aria-valuemax="${b.goal}" aria-valuenow="${v}"><i style="width:${(v / b.goal) * 100}%"></i></div><div class="state">${v} / ${b.goal}</div>`}
      </li>`;
    }).join('');

    $('#titles').innerHTML = TITLES.slice(1).map((t) => {
      const has = state.rated.length >= t.min;
      return `<li class="${has ? 'earned' : ''}"><span class="mono">${fmt(t.min)}+</span>${esc(t.name)}${has ? icon('check') : ''}</li>`;
    }).join('');

    const list = $('#collection');
    const items = [...state.rated].reverse();
    $('#collection-empty').hidden = items.length > 0;
    list.hidden = items.length === 0;
    list.innerHTML = items.slice(0, 60).map((r) => `
      <li>
        <img src="${r.src}" alt="${esc(r.name)}" loading="lazy" width="150" height="150">
        <div class="cname">${esc(r.name)}</div>
        <div class="cmeta"><span class="group">${esc(groupById[r.group]?.name || 'Animal')}</span><span>${esc(r.date)}</span></div>
      </li>`).join('');
    $('#journal-count').textContent = `${items.length} species collected`;
  }

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Reset your local progress, titles and journal on this device? Ratings already submitted are not affected.')) return;
    const consent = state.consent;
    state = blank(); state.consent = consent; save();
    renderHud(); renderJournal();
  });

  /* ---------------- explore: the archive so far ---------------- */
  let activeGroup = 'mammals';
  async function renderExplore() {
    const wrap = $('#explore');
    try {
      const s = await ensureStats();
      $('#tot-responses').textContent = fmt(s.totals.responses);
      $('#tot-respondents').textContent = fmt(s.totals.respondents);
      $('#tot-countries').textContent = fmt(s.totals.countries);
      $('#stats-updated').textContent = `Updated ${ago(s.updatedAt)}${s.illustrative ? ' · illustrative data (prototype)' : ''}`;

      // Heatmap: mean perception per group (rows) and attribute (columns)
      $('#heatmap').innerHTML = `
        <caption class="sr-only">Average rating per animal group and attribute, from 1 to 9</caption>
        <thead><tr><th scope="col">Group</th>${QUESTION_TYPES.map((q) => `<th scope="col" style="--c:${q.color}">${esc(q.text)}</th>`).join('')}</tr></thead>
        <tbody>${s.groups.map((gs) => {
          const g = groupById[gs.id];
          return `<tr class="${gs.id === activeGroup ? 'active' : ''}">
            <th scope="row"><button type="button" data-group="${gs.id}">${icon(g.icon)}${esc(g.name)}</button></th>
            ${QUESTION_TYPES.map((q) => {
              const m = gs.questions[q.id].mean; const bg = colorAt(q.palette, m);
              return `<td style="background:${bg};color:${ink(bg)}" title="${esc(g.name)} · ${esc(q.text)}: ${m.toFixed(1)}">${m.toFixed(1)}</td>`;
            }).join('')}</tr>`;
        }).join('')}</tbody>`;
      renderGroupDetail(s);
      wrap.classList.remove('loading');
    } catch {
      wrap.classList.remove('loading');
      $('#heatmap').innerHTML = '<caption>Statistics are temporarily unavailable. Please try again later.</caption>';
    }
  }
  function renderGroupDetail(s) {
    const gs = s.groups.find((x) => x.id === activeGroup);
    const g = groupById[activeGroup];
    $('#detail-title').innerHTML = `${icon(g.icon)}${esc(g.name)}`;
    $('#detail-meta').textContent = `≈${gs.species} species · ${fmt(gs.responses)} responses`;
    $('#detail-hists').innerHTML = QUESTION_TYPES.map((q) => histHTML(q, gs.questions[q.id], 0, false)).join('');
    document.querySelectorAll('#heatmap tbody tr').forEach((tr) => tr.classList.toggle('active', tr.querySelector('[data-group]').dataset.group === activeGroup));
    document.querySelectorAll('#heatmap [data-group]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.group === activeGroup)));
  }
  $('#heatmap').addEventListener('click', (e) => {
    const b = e.target.closest('[data-group]');
    if (!b || !stats) return;
    activeGroup = b.dataset.group;
    renderGroupDetail(stats);
  });

  /* ---------------- sync indicator ---------------- */
  api.onSync((s) => {
    const el = $('#sync');
    el.dataset.state = s.offline ? 'offline' : s.queued ? 'pending' : 'ok';
    el.querySelector('span').textContent = s.offline
      ? `Offline · ${s.queued} rating${s.queued === 1 ? '' : 's'} saved, will sync`
      : s.queued ? `Syncing ${s.queued} rating${s.queued === 1 ? '' : 's'}…` : 'All ratings saved';
  });

  /* ---------------- feedback ---------------- */
  const toasts = $('#toasts');
  function toast(ic, title, text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="medal">${icon(ic)}</div><div><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
    toasts.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 400); }, 4200);
  }

  const aboutDlg = $('#about-dialog');
  document.querySelectorAll('[data-open-about]').forEach((b) => b.addEventListener('click', () => aboutDlg.showModal()));
  aboutDlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => aboutDlg.close()));
  [aboutDlg, consentDlg].forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  $('#q-title').textContent = WASP.QUESTION_TITLE;
  $('#about-list').innerHTML = WASP.ABOUT_SURVEY.map((t) => `<li>${esc(t)}</li>`).join('');
  $('#consent-list').innerHTML = WASP.CONSENT.map((t) => `<li>${esc(t)}</li>`).join('');

  /* ---------------- init ---------------- */
  buildForm();
  renderHud();
  renderJournal();
  loadNext();
  renderExplore();
  if (!state.rated.length) setTimeout(() => aboutDlg.showModal(), 400);
})();
