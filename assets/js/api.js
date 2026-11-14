/* =========================================================
   WASP data layer (front end only).

   Built for ~2,000 species x many respondents:
   - Species are PREFETCHED in small batches, so the next image is instant
     and the server is asked for 5 species at a time, not 1.
   - Ratings go to an OUTBOX (localStorage) and are sent in BATCHES with
     retry + backoff. Each response carries a client-generated responseId,
     so the server can de-duplicate (idempotent writes). Flaky networks
     and traffic spikes never lose a rating or block the respondent.
   - Statistics are only ever read PRE-AGGREGATED per animal group
     (never computed from raw answers in the browser) and cached.

   MODE = 'mock' runs entirely in the browser with the bundled sample and
   illustrative statistics. The proposed endpoints are documented in
   docs/API-CONTRACT.md for the back-end team; nothing here assumes how
   the back end is built.
   ========================================================= */
(function () {
  const MODE = 'mock';                  // 'mock' | 'live'
  const BASE = WASP.API_BASE + '/v2';   // proposed versioned API
  const PREFETCH = 5;
  const BATCH = 20;
  const STATS_TTL = 10 * 60 * 1000;     // 10 min client cache

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* unavailable */ } }
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  // Anonymous respondent id (the current site uses a cookie for the same purpose)
  let respondentId = store.get('wasp.respondentId', null);
  if (!respondentId) { respondentId = uuid(); store.set('wasp.respondentId', respondentId); }

  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(syncState()));
  let flushing = false;
  let lastError = null;
  const outbox = () => store.get('wasp.outbox', []);
  const syncState = () => ({ queued: outbox().length, flushing, offline: !navigator.onLine, error: lastError });

  async function http(path, opts = {}) {
    const res = await fetch(BASE + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'X-Respondent-Id': respondentId, ...(opts.headers || {}) }
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.status === 204 ? null : res.json();
  }

  /* ---------------- species queue ---------------- */
  let queue = [];
  async function fetchBatch(exclude) {
    if (MODE === 'live') return (await http(`/species/next?count=${PREFETCH}`)).items;
    const pool = WASP.SPECIES.filter((s) => !exclude.has(s.id) && !queue.some((q) => q.id === s.id));
    const list = pool.length ? pool : WASP.SPECIES.filter((s) => !queue.some((q) => q.id === s.id));
    return [...list].sort(() => Math.random() - 0.5).slice(0, PREFETCH);
  }
  async function nextSpecies(exclude = new Set()) {
    if (queue.length < 2) queue.push(...(await fetchBatch(exclude)));
    const sp = queue.shift();
    queue.slice(0, 2).forEach((s) => { const i = new Image(); i.src = s.src; }); // warm the image cache
    return sp;
  }

  /* ---------------- responses: outbox + batched flush ---------------- */
  function submitResponse(observationId, answers) {
    const item = { responseId: uuid(), respondentId, observationId, answers, ratedAt: new Date().toISOString() };
    store.set('wasp.outbox', [...outbox(), item]);
    emit();
    flush();
    return item.responseId;
  }
  let backoff = 1000;
  async function flush() {
    if (flushing || !outbox().length || !navigator.onLine) { emit(); return; }
    flushing = true; emit();
    const batch = outbox().slice(0, BATCH);
    try {
      if (MODE === 'live') await http('/responses', { method: 'POST', body: JSON.stringify({ responses: batch }) });
      else { await new Promise((r) => setTimeout(r, 400)); console.info('[WASP mock] POST /v2/responses', batch); }
      const sent = new Set(batch.map((b) => b.responseId));
      store.set('wasp.outbox', outbox().filter((o) => !sent.has(o.responseId)));
      lastError = null; backoff = 1000;
      flushing = false; emit();
      if (outbox().length) flush();
    } catch (e) {
      lastError = e.message; flushing = false; emit();
      setTimeout(flush, backoff); backoff = Math.min(backoff * 2, 60000);
    }
  }
  window.addEventListener('online', flush);
  window.addEventListener('offline', emit);

  /* ---------------- pre-aggregated group statistics ---------------- */
  // Illustrative means (1–9) per group for the mock only.
  const MOCK_MEANS = {
    //            CUTE DANG INT  BEAU END  IMP
    mammals:     [6.9, 4.2, 6.6, 6.8, 5.6, 6.9],
    birds:       [6.6, 2.6, 5.4, 7.2, 4.8, 6.8],
    fishes:      [4.4, 3.6, 3.4, 5.2, 4.6, 6.3],
    reptiles:    [3.9, 5.4, 3.6, 5.0, 5.2, 6.0],
    amphibians:  [4.6, 3.2, 3.2, 5.1, 5.4, 6.4],
    insects:     [3.6, 3.9, 3.0, 4.6, 4.1, 6.6],
    molluscs:    [3.8, 2.8, 2.9, 4.3, 4.3, 5.8],
    crustaceans: [3.7, 3.5, 2.8, 4.4, 4.2, 6.0],
    corals:      [5.0, 2.4, 2.1, 7.0, 6.2, 7.6],
    invertebrates: [3.2, 3.6, 2.6, 4.0, 4.5, 6.1]
  };
  function mockStats() {
    const groups = WASP.GROUPS.map((g, gi) => {
      const responses = 6200 + ((gi * 7919) % 5400);
      const questions = {};
      WASP.QUESTION_TYPES.forEach((q, qi) => {
        const m = MOCK_MEANS[g.id][qi];
        const w = Array.from({ length: 9 }, (_, i) => Math.exp(-((i + 1 - m) ** 2) / (2 * 1.9 ** 2)));
        const sum = w.reduce((a, b) => a + b, 0);
        const hist = w.map((x) => Math.round((x / sum) * responses));
        const n = hist.reduce((a, b) => a + b, 0);
        const mean = hist.reduce((a, c, i) => a + c * (i + 1), 0) / n;
        questions[q.id] = { n, mean: Math.round(mean * 100) / 100, hist };
      });
      return { id: g.id, species: g.id === 'corals' ? 180 : WASP.GROUP_SIZE, responses, questions };
    });
    const responses = groups.reduce((a, g) => a + g.responses, 0);
    return {
      updatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      illustrative: true,
      totals: { responses, respondents: Math.round(responses / 11.4), countries: 74 },
      groups
    };
  }
  async function groupStats({ force = false } = {}) {
    try {
      const c = JSON.parse(sessionStorage.getItem('wasp.stats') || 'null');
      if (!force && c && Date.now() - c.at < STATS_TTL) return c.data;
    } catch { /* ignore */ }
    const data = MODE === 'live' ? await http('/stats/groups') : await new Promise((r) => setTimeout(() => r(mockStats()), 500));
    try { sessionStorage.setItem('wasp.stats', JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
    return data;
  }

  WASP.api = {
    mode: MODE,
    nextSpecies,
    submitResponse,
    flush,
    groupStats,
    syncState,
    onSync(fn) { listeners.add(fn); fn(syncState()); return () => listeners.delete(fn); }
  };
  flush();
})();
