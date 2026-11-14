/* =========================================================
   WASP-A survey: one species at a time, six traits, Rate,
   and the next species appears immediately.
   Survey text, species photos and credits are unchanged from
   wasp-project.net/survey. Engagement stays out of the way:
   a slim progress chip and occasional toasts for new titles/badges.
   ========================================================= */
(function () {
  const { QUESTION_TYPES, SCALE_LABELS, api, progress, util } = WASP;
  const { esc, ink, paletteFor } = util;
  const $ = (s, el = document) => el.querySelector(s);

  const card = $('#rate-card');
  const form = $('#q-form');
  const rows = $('#q-rows');
  const rateBtn = $('#btn-rate');
  const moreBtn = $('#btn-more');
  const hint = $('#rate-hint');
  const img = $('#species-img');
  const bg = $('#species-bg');
  const shimmer = $('#species-shimmer');
  const mobile = window.matchMedia('(max-width: 759px)');
  let current = null;
  let answers = {};

  /* ---------------- hexagon scales ---------------- */
  rows.innerHTML = QUESTION_TYPES.map((q, qi) => {
    const labels = SCALE_LABELS[q.id];
    const pal = paletteFor(q);
    const hexes = labels.map((lab, i) => `
      <label class="hex" style="--fill:${pal[i]};--num:${ink(pal[i])}" title="${esc(lab)}">
        <input type="radio" name="${q.id}" value="${i + 1}" aria-label="${i + 1} of 9: ${esc(lab)}">
        <span class="hex-shape"><span class="hex-num">${i + 1}</span></span>
      </label>`).join('');
    const guide = q.type === 'categorical'
      ? `<ul class="iucn" aria-label="IUCN Red List guideline">${WASP.IUCN_LEGEND.map(([n, v]) => `<li><i style="background:${pal[v[0] - 1]}"></i>${esc(n)}</li>`).join('')}</ul>`
      : '';
    return `
      <fieldset class="q-row" data-q="${q.id}" data-set="${qi < 3 ? 1 : 2}" style="--c:${q.ink}">
        <legend>${esc(q.text)}</legend>
        <div class="q-scale">
          <div class="hexes">${hexes}</div>
          <div class="desc" id="d-${q.id}" aria-live="polite"><span class="end">${esc(labels[0])}</span><span class="end">${esc(labels[8])}</span></div>
          ${guide}
        </div>
      </fieldset>`;
  }).join('');

  function paint(qid) {
    const v = answers[qid] || 0;
    const fs = rows.querySelector(`[data-q="${qid}"]`);
    fs.classList.toggle('has-value', !!v);
    fs.querySelectorAll('.hex').forEach((l, i) => l.classList.toggle('sel', i + 1 === v));
    const labels = SCALE_LABELS[qid];
    $(`#d-${qid}`).innerHTML = v
      ? `<span class="chosen">${esc(labels[v - 1])}</span>`
      : `<span class="end">${esc(labels[0])}</span><span class="end">${esc(labels[8])}</span>`;
  }

  const setDone = (n) => QUESTION_TYPES.filter((q, i) => (i < 3 ? 1 : 2) === n).every((q) => answers[q.id]);
  function update() {
    const done = Object.keys(answers).length;
    rateBtn.disabled = done < QUESTION_TYPES.length;
    hint.textContent = `${done} / ${QUESTION_TYPES.length}`;
    moreBtn.disabled = !setDone(1);
  }
  function goPage(n, focus) {
    form.dataset.page = String(n);
    if (focus) { const first = rows.querySelector(`[data-set="${n}"] input`); first && first.focus({ preventScroll: true }); }
    if (mobile.matches) form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  form.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    answers[e.target.name] = Number(e.target.value);
    paint(e.target.name);
    update();
    // On phones the six traits come in two sets of three (as on the original site).
    if (mobile.matches && form.dataset.page === '1' && setDone(1)) setTimeout(() => goPage(2), 280);
  });
  moreBtn.addEventListener('click', () => goPage(2, true));
  $('#btn-back').addEventListener('click', () => goPage(1, true));

  /* ---------------- species ---------------- */
  function show(sp) {
    current = sp;
    answers = {};
    form.reset();
    QUESTION_TYPES.forEach((q) => paint(q.id));
    update();
    form.dataset.page = '1';
    shimmer.hidden = false;
    img.classList.add('loading');
    img.alt = `Photograph of ${sp.name}`;
    img.onload = () => { shimmer.hidden = true; img.classList.remove('loading'); };
    img.onerror = () => { shimmer.hidden = true; img.classList.remove('loading'); img.alt = `The image of ${sp.name} could not be loaded`; };
    img.src = sp.src;
    bg.src = sp.src;
    $('#species-name').textContent = sp.name;
    $('#species-credit').innerHTML = sp.licenseUrl
      ? `<a href="${sp.licenseUrl}" target="_blank" rel="noopener">${esc(sp.photographer)}</a>` : esc(sp.photographer);
  }
  async function next() {
    const exclude = new Set(progress.state.rated.map((r) => r.id));
    if (current) exclude.add(current.id);
    try { show(await api.nextSpecies(exclude)); }
    catch { $('#species-name').textContent = 'The next species could not be loaded. Check your connection and reload the page.'; }
  }

  /* ---------------- rate -> next species immediately ---------------- */
  const consent = $('#consent-dialog');
  rateBtn.addEventListener('click', () => {
    if (rateBtn.disabled) return;
    if (!progress.state.consent) { consent.showModal(); return; }
    submit();
  });
  $('#consent-ok').addEventListener('click', () => { progress.state.consent = true; progress.save(); consent.close(); submit(); });
  $('#consent-cancel').addEventListener('click', () => consent.close());

  async function submit() {
    api.submitResponse(current.id, { ...answers }); // saved locally, synced in the background
    const { newTitle, newBadges } = progress.record(current, answers);
    card.classList.add('swap');
    renderMe(true);
    await next();
    requestAnimationFrame(() => card.classList.remove('swap'));
    $('#q-title').focus({ preventScroll: true });
    if (mobile.matches) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (newTitle) progress.toast('award', `You are now a ${newTitle.name}`, 'Thank you for contributing to the archive.');
    newBadges.forEach((b, i) => setTimeout(() => progress.toast(b.icon, `Badge: ${b.name}`, b.desc), 600 + i * 900));
  }

  /* ---------------- slim progress chip ---------------- */
  function renderMe(bump) {
    const n = progress.state.rated.length;
    const t = progress.titleFor(n);
    $('#me-title').textContent = t.cur.name;
    $('#me-count').textContent = `${util.fmt(n)} species rated`;
    $('#me-bar').style.width = `${t.pct}%`;
    $('#me-bar').parentElement.setAttribute('aria-valuenow', t.pct);
    const s = progress.streak();
    const st = $('#me-streak');
    st.hidden = s < 2;
    st.querySelector('span').textContent = `${s} days`;
    if (bump) { const m = $('.me'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }
  }

  /* ---------------- dialogs ---------------- */
  const about = $('#about-dialog');
  $('#about-list').innerHTML = WASP.ABOUT_SURVEY.map((t) => `<li>${esc(t)}</li>`).join('');
  $('#consent-list').innerHTML = WASP.CONSENT.map((t) => `<li>${esc(t)}</li>`).join('');
  document.querySelectorAll('[data-open-about]').forEach((b) => b.addEventListener('click', () => about.showModal()));
  about.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => about.close()));
  [about, consent].forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  renderMe();
  next();
  if (!progress.state.rated.length) setTimeout(() => about.showModal(), 300);
})();
