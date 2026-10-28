/* ============================================================
   NUMBLEETZ — game logic
   Plain JavaScript, no libraries. Settings live in config.js.
   ============================================================ */
(() => {
  'use strict';

  const CFG = Object.assign({
    GAME_NAME: 'NumBleetz', TAGLINE: 'Sipnayan Arcade', LEADERBOARD_URL: '', LEADERBOARD_SIZE: 50
  }, window.GAME_CONFIG || {});
  const API = String(CFG.LEADERBOARD_URL || '').trim();

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------------- game data ---------------- */
  const AVATARS = ['🐒', '🐃', '🦅', '🐓', '🐠', '🥭', '🌺', '🦀', '🐢', '🦜', '🍍', '🐊'];
  const OPS = {
    add: { sym: '+', name: 'DAGDAG', color: 'cyan' },
    sub: { sym: '−', name: 'BAWAS', color: 'pink' },
    mul: { sym: '×', name: 'PARAMI', color: 'yellow' },
    div: { sym: '÷', name: 'HATI', color: 'green' },
    mix: { sym: '🍧', name: 'HALO-HALO', color: 'purple' }
  };
  const ISLANDS = [
    ['Batanes', '🌊', 'Stone houses by the sea'],
    ['Vigan', '🏛️', 'Calle Crisologo'],
    ['Baguio', '🌲', 'City of Pines'],
    ['Maynila', '🌆', 'Intramuros'],
    ['Tagaytay', '🌋', 'Taal Volcano view'],
    ['Boracay', '🏖️', 'White Beach'],
    ['Bohol', '🍫', 'Chocolate Hills'],
    ['Cebu', '⛪', "Magellan's Cross"],
    ['Palawan', '🐠', 'El Nido lagoons'],
    ['Davao', '🦅', 'Home of the Philippine Eagle']
  ];
  const RANKS = [
    [0, 'BAGUHAN', '🌱'], [500, 'MASIPAG', '🐃'], [1000, 'MATALINO', '🦉'],
    [1600, 'HENYO', '🧠'], [2400, 'BAYANI', '🛡️'], [3500, 'ALAMAT', '🌞']
  ];
  // Combo tiers: [streak needed, points multiplier, label]
  const COMBO_TIERS = [[0, 1, ''], [5, 1.5, 'NICE!'], [10, 2, 'GALING!'], [20, 3, 'FEVER 🔥'], [30, 4, 'SUPER FEVER ⚡']];
  const tierOf = (c) => COMBO_TIERS.filter((t) => c >= t[0]).pop();
  const CHEERS = ['Galing!', 'Ang bilis!', 'Astig!', 'Tama!', 'Lodi!', 'Petmalu!', 'Husay!'];
  const OOPS = ['Sayang!', 'Konti na lang!', "Kaya mo 'yan!", 'Laban lang!'];
  // [emoji, name, min price, max price]
  const STORE = [
    ['🍞', 'Pandesal', 2, 6], ['🍬', 'Kendi', 1, 3], ['🥤', 'Softdrinks', 15, 30],
    ['🍿', 'Chichirya', 8, 20], ['🥚', 'Itlog', 7, 12], ['☕', 'Kape', 8, 15],
    ['🐟', 'Sardinas', 18, 32], ['🍜', 'Pancit Canton', 14, 22], ['🍌', 'Banana cue', 12, 25],
    ['🧊', 'Ice candy', 5, 10], ['🍚', 'Bigas (1 kilo)', 42, 60], ['🧼', 'Sabon', 20, 40]
  ];
  const BILLS = [20, 50, 100, 200, 500, 1000];

  const MODES = {
    ranked:    { title: 'RANKED', board: true, time: 60, adaptive: true, op: 'mix', thresholds: [400, 900, 1600] },
    daily:     { title: 'DAILY HAMON', board: true, questions: 20, op: 'mix', seeded: true, thresholds: [400, 900, 1500] },
    classic:   { title: 'CLASSIC', questions: 15, lives: 3, hint: true },
    jeepney:   { title: 'JEEPNEY RUSH', board: true, lives: 3, adaptive: true, op: 'mix', fuse: true, thresholds: [300, 800, 1500] },
    sarisari:  { title: 'SARI-SARI STORE', board: true, time: 75, adaptive: true, store: true, thresholds: [250, 600, 1100] },
    tamaomali: { title: 'TAMA O MALI', board: true, time: 45, adaptive: true, op: 'mix', tf: true, thresholds: [300, 800, 1400] },
    tables:    { title: 'TIMES TABLES', questions: 12, lives: 3, hint: true },
    hagdan:    { title: 'HAGDAN', lives: 3, climb: true, tapOnly: true }
  };

  // Hagdan (Level Up): every PER_STEP correct answers you climb one step and it gets harder
  const PER_STEP = 8;
  const LADDER = {
    add: ['Whole numbers 0–10', 'Whole numbers to 20', '2-digit numbers', '3-digit numbers', 'Signed numbers ±10', 'Signed numbers ±50', 'Decimals', 'Signed decimals'],
    sub: ['Whole numbers 0–10', 'Whole numbers to 20', '2-digit numbers', '3-digit numbers', 'Signed numbers ±10', 'Signed numbers ±50', 'Decimals', 'Signed decimals'],
    mul: ['Tables up to 5', 'Tables up to 10', 'Tables up to 12', '2-digit × 1-digit', 'Signed numbers', 'Decimal × whole', 'Signed 2-digit'],
    div: ['Divide by 2–5', 'Divide by up to 10', 'Divide by up to 12', 'Signed numbers', 'Bigger answers', 'Decimal answers', 'Signed bigger'],
    mix: ['Small whole numbers', 'Whole numbers', 'Bigger numbers', 'Signed numbers', 'Bigger signed numbers', 'Decimals', 'Signed mix']
  };
  // Which step of each operation's ladder a Halo-Halo step uses
  const MIX_STEPS = { add: [0, 1, 2, 4, 5, 6, 7], sub: [0, 1, 2, 4, 5, 6, 7], mul: [0, 1, 3, 4, 6, 5, 6], div: [0, 1, 4, 3, 6, 5, 6] };
  const MINIS = [
    { id: 'jeepney', icon: '🚙', title: 'JEEPNEY RUSH', tags: [['⚡ SPEED', 'yellow'], ['❤️ 3 LIVES', 'pink']],
      desc: 'Answer before the jeepney reaches the stop! Every ride gets faster.' },
    { id: 'sarisari', icon: '🏪', title: 'SARI-SARI STORE', tags: [['₱ PERA', 'green'], ['🧠 WORD PROBLEMS', 'cyan']],
      desc: 'Be the tindera! Add up the prices and give the right sukli in 75 seconds.' },
    { id: 'tamaomali', icon: '✅', title: 'TAMA O MALI', tags: [['⚡ SPEED', 'yellow'], ['👀 FOCUS', 'cyan']],
      desc: 'Is the answer tama or mali? Tap fast, you only have 45 seconds!' },
    { id: 'tables', icon: '📚', title: 'TIMES TABLES', tags: [['× PRACTICE', 'purple'], ['💡 HINTS', 'yellow']],
      desc: 'Pick a table from 2 to 12 and master it. Get 3 stars on every table!' }
  ];
  const BOARD_TABS = [['ranked', '🏆 Ranked'], ['daily', '🌟 Daily'], ['jeepney', '🚙 Jeepney'], ['sarisari', '🏪 Sari-Sari'], ['tamaomali', '✅ Tama o Mali']];

  const CARDS = [
    { id: 'sampaguita', e: '🌼', n: 'Sampaguita', d: 'Get your first correct answer', c: 'yellow', t: (p) => p.stats.correct >= 1 },
    { id: 'tarsier', e: '🐒', n: 'Tarsier', d: 'Reach a 10 combo', c: 'green', t: (p) => p.stats.bestCombo >= 10 },
    { id: 'kalabaw', e: '🐃', n: 'Kalabaw', d: '200 correct answers', c: 'cyan', t: (p) => p.stats.correct >= 200 },
    { id: 'jeepney', e: '🚙', n: 'Jeepney', d: 'Score 500 in Jeepney Rush', c: 'pink', t: (p) => (p.best.jeepney || 0) >= 500 },
    { id: 'halohalo', e: '🍧', n: 'Halo-Halo', d: 'Clear a Halo-Halo island', c: 'purple', t: (p) => Object.keys(p.classic).some((k) => k.startsWith('mix-') && p.classic[k] > 0) },
    { id: 'bahaykubo', e: '🛖', n: 'Bahay Kubo', d: 'Collect 15 stars', c: 'green', t: (p) => totalStars(p) >= 15 },
    { id: 'sarisari', e: '🏪', n: 'Sari-Sari', d: 'Score 600 in Sari-Sari Store', c: 'yellow', t: (p) => (p.best.sarisari || 0) >= 600 },
    { id: 'tama', e: '✅', n: 'Tama!', d: 'Score 800 in Tama o Mali', c: 'green', t: (p) => (p.best.tamaomali || 0) >= 800 },
    { id: 'parol', e: '🌟', n: 'Parol', d: 'Finish a Daily Hamon', c: 'yellow', t: (p) => p.stats.daily >= 1 },
    { id: 'mayon', e: '🌋', n: 'Mayon', d: 'Reach a 25 combo', c: 'red', t: (p) => p.stats.bestCombo >= 25 },
    { id: 'vinta', e: '⛵', n: 'Vinta', d: '3 stars on 6 times tables', c: 'cyan', t: (p) => Object.values(p.tables).filter((s) => s >= 3).length >= 6 },
    { id: 'chocohills', e: '🍫', n: 'Chocolate Hills', d: 'Reach Davao on any route', c: 'pink', t: (p) => Object.keys(p.classic).some((k) => k.endsWith('-10') && p.classic[k] > 0) },
    { id: 'banaue', e: '🌾', n: 'Banaue', d: '1,000 correct answers', c: 'green', t: (p) => p.stats.correct >= 1000 },
    { id: 'agila', e: '🦅', n: 'Philippine Eagle', d: 'Reach HENYO rank', c: 'cyan', t: (p) => (p.best.ranked || 0) >= 1600 },
    { id: 'sarimanok', e: '🐓', n: 'Sarimanok', d: 'Reach ALAMAT rank', c: 'pink', t: (p) => (p.best.ranked || 0) >= 3500 },
    { id: 'hagdan', e: '🪜', n: 'Hagdan', d: 'Reach the signed numbers step in Hagdan', c: 'purple', t: (p) => Object.values(p.ladder).some((x) => x.step >= 4) },
    { id: 'araw', e: '☀️', n: 'Araw', d: 'Collect 100 stars', c: 'yellow', t: (p) => totalStars(p) >= 100 }
  ];

  /* ---------------- saved progress ---------------- */
  const KEY = 'numbleetz.v1';
  const DEFAULT = {
    name: '', avatar: '🐒', id: '', xp: 0, sound: true, music: true, inputMode: 'tap',
    classic: {}, tables: {}, ladder: {}, best: {}, cards: [], local: {}, queue: [],
    dailyDone: '', stats: { games: 0, correct: 0, answered: 0, bestCombo: 0, daily: 0 }
  };
  let P = load();

  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* private mode */ }
    const p = Object.assign({}, DEFAULT, saved);
    p.stats = Object.assign({}, DEFAULT.stats, saved.stats);
    ['classic', 'tables', 'ladder', 'best', 'local'].forEach((k) => { p[k] = Object.assign({}, p[k]); });
    p.cards = Array.isArray(p.cards) ? p.cards : [];
    p.queue = Array.isArray(p.queue) ? p.queue : [];
    if (!p.id) p.id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return p;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* storage full or blocked */ }
  }

  /* ---------------- helpers ---------------- */
  let rng = Math.random;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const rand = (a, b, r = rng) => a + Math.floor(r() * (b - a + 1));
  const pick = (arr, r = rng) => arr[Math.floor(r() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shuffle(arr, r = rng) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  function manilaDate() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function totalStars(p) {
    const sum = (o) => Object.values(o).reduce((a, b) => a + (b || 0), 0);
    return sum(p.classic) + sum(p.tables);
  }
  function levelInfo(xp) {
    const lvl = Math.floor(Math.sqrt(xp / 40)) + 1;
    const lo = 40 * (lvl - 1) ** 2, hi = 40 * lvl ** 2;
    return { lvl, pct: ((xp - lo) / (hi - lo)) * 100 };
  }
  function rankOf(score) {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (score >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; }
    }
    return { min: r[0], name: r[1], icon: r[2], next };
  }
  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  /* ---------------- sound & music (all made in code, no audio files needed) ---------------- */
  let actx = null, master = null, musicBus = null, noiseBuf = null;
  function audio() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain();
      master.connect(actx.destination);
      musicBus = actx.createGain();
      musicBus.gain.value = 0.55;
      musicBus.connect(master);
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.2, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // One synth note at an exact time; slideTo bends the pitch (for whooshes and "boing"s)
  function tone(freq, dur, type, vol, when, dest, slideTo) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(dest || master);
    o.start(when); o.stop(when + dur + 0.02);
  }
  function hat(when, vol = 0.02, dest) {
    const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = noiseBuf;
    f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    src.connect(f).connect(g).connect(dest || master);
    src.start(when); src.stop(when + 0.06);
  }
  function beep(freq, dur = 0.08, type = 'sine', vol = 0.07, delay = 0, slideTo) {
    if (!P.sound) return;
    try { audio(); tone(freq, dur, type, vol, actx.currentTime + delay, master, slideTo); } catch (e) { /* no audio */ }
  }
  const notes = (list, gap, type, vol, len) => list.forEach((n, i) => beep(midi(n), len || gap * 1.6, type, vol, i * gap));
  const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];
  const sfx = {
    tap: () => beep(660, 0.04, 'triangle', 0.035),
    good: (c) => { const n = PENTA[Math.min(c, PENTA.length - 3)]; notes([n, n + 7], 0.06, 'triangle', 0.07); },
    combo: () => notes([72, 76, 79, 84, 88], 0.06, 'square', 0.04, 0.12),
    bad: () => { beep(240, 0.3, 'sawtooth', 0.05, 0, 90); beep(160, 0.25, 'square', 0.025, 0.05, 70); },
    step: () => { beep(300, 0.35, 'sine', 0.06, 0, 1200); notes([72, 76, 79, 84, 79, 84, 88], 0.07, 'triangle', 0.06, 0.16); },
    tick: () => beep(1250, 0.04, 'square', 0.03),
    horn: () => { [0, 0.18].forEach((d) => { beep(440, 0.12, 'square', 0.03, d); beep(554, 0.12, 'square', 0.03, d); }); },
    card: () => notes([84, 88, 91, 96, 100], 0.05, 'sine', 0.06, 0.2),
    start: () => notes([60, 67, 72], 0.09, 'square', 0.04, 0.1),
    end: () => notes([72, 76, 79, 84, 79, 84], 0.11, 'triangle', 0.07, 0.2),
    lose: () => notes([67, 63, 60, 55], 0.16, 'triangle', 0.06, 0.25),
    comboLost: () => beep(700, 0.35, 'triangle', 0.05, 0, 180),
    fever: () => notes([72, 79, 84, 88, 91, 96, 100], 0.045, 'square', 0.04, 0.1)
  };

  // Looping background music: C–G–Am–F progression with bass, arpeggio and hi-hats
  const PROG = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  const SONGS = {
    menu: { bpm: 92, arp: [0, 1, 2, 1, 2, 1, 0, 1], wave: 'triangle', vol: 0.035, up: 12, hats: false },
    play: { bpm: 128, arp: [0, 1, 2, 0, 1, 2, 1, 2], wave: 'square', vol: 0.02, up: 12, hats: true }
  };
  const music = { want: null, playing: null, timer: null, next: 0, step: 0 };
  function musicTick() {
    const song = SONGS[music.playing];
    const eighth = 30 / song.bpm;
    while (music.next < actx.currentTime + 0.15) {
      const i = music.step, e = i % 8, chord = PROG[Math.floor(i / 8) % 4], t = music.next;
      if (e % 2 === 0) tone(midi(chord[0] - 24), eighth * 1.8, 'triangle', 0.1, t, musicBus);
      tone(midi(chord[song.arp[e]] + song.up), eighth * 0.9, song.wave, song.vol, t, musicBus);
      if (song.hats && e % 2 === 1) hat(t, 0.015, musicBus);
      if (song.hats && e === 0 && Math.floor(i / 8) % 2 === 0) tone(110, 0.12, 'sine', 0.12, t, musicBus, 45);
      music.next += eighth;
      music.step++;
    }
  }
  function playMusic(kind) {
    music.want = kind;
    if (!P.music || !actx || document.hidden) { stopMusic(); return; }
    if (music.playing === kind) return;
    stopMusic();
    music.playing = kind;
    music.step = 0;
    music.next = actx.currentTime + 0.05;
    music.timer = setInterval(musicTick, 40);
  }
  function stopMusic() {
    clearInterval(music.timer);
    music.timer = null;
    music.playing = null;
  }
  // Browsers only allow sound after the first tap or key press
  function unlockAudio() {
    try { audio(); } catch (e) { return; }
    if (music.want) playMusic(music.want);
  }
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockAudio, { once: true }));
  document.addEventListener('visibilitychange', () => (document.hidden ? stopMusic() : playMusic(music.want)));

  /* ---------------- question makers ---------------- */
  const AMAX = [10, 15, 20, 30, 50, 80, 100, 200, 500, 999];
  const MULA = [5, 6, 9, 10, 12, 12, 15, 20, 25, 30];
  const MULB = [5, 9, 10, 12, 12, 15, 15, 15, 20, 25];

  function makeQ(op, diff) {
    const d = clamp(Math.round(diff), 1, 10);
    if (op === 'mix') op = pick(d <= 2 ? ['add', 'sub'] : d <= 4 ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div']);
    let a, b, ans;
    if (op === 'add') { a = rand(1, AMAX[d - 1]); b = rand(1, AMAX[d - 1]); ans = a + b; }
    else if (op === 'sub') { a = rand(2, AMAX[d - 1] + Math.floor(AMAX[d - 1] / 2)); b = rand(1, a); ans = a - b; }
    else if (op === 'mul') {
      a = rand(2, MULA[d - 1]); b = rand(d > 1 ? 2 : 1, MULB[d - 1]);
      if (rng() < 0.5) [a, b] = [b, a];
      ans = a * b;
    } else { b = rand(2, Math.max(2, MULA[d - 1])); ans = rand(1, MULB[d - 1]); a = b * ans; }
    return { op, a, b, ans, d, text: `${a} ${OPS[op].sym} ${b}` };
  }

  function tablesQ(table, k) {
    const [a, b] = rng() < 0.5 ? [table, k] : [k, table];
    return { op: 'mul', a, b, ans: a * b, d: 3, text: `${a} × ${b}` };
  }

  // Wrong-but-believable answers for Tama o Mali
  function wrongAnswer(q) {
    const opts = [1, -1, 2, -2, 10, -10];
    if (q.op === 'mul') opts.push(q.a, -q.a, q.b, -q.b);
    for (let i = 0; i < 20; i++) {
      const w = q.ans + pick(opts);
      if (w >= 0 && w !== q.ans) return w;
    }
    return q.ans + 1;
  }

  const round2 = (v) => Math.round(v * 100) / 100;
  // Show negatives with a real minus sign, e.g. −7
  const fmtN = (v) => { v = round2(v); return v < 0 ? '−' + (-v) : String(v); };
  const sgn = () => (rng() < 0.5 ? -1 : 1);

  function ladderQ(op, step) {
    let s = step;
    if (op === 'mix') { op = pick(['add', 'sub', 'mul', 'div']); s = MIX_STEPS[op][Math.min(step, 6)]; }
    s = Math.min(s, LADDER[op].length - 1);
    let a, b, ans;
    if (op === 'add' || op === 'sub') {
      const R = [[0, 10], [0, 20], [10, 99], [100, 999], [-10, 10], [-50, 50], [1, 99], [-99, 99]][s];
      a = rand(R[0], R[1]); b = rand(R[0], R[1]);
      if (op === 'sub' && (s < 4 || s === 6) && b > a) [a, b] = [b, a];   // no negatives outside the signed steps
      if ([4, 5, 7].includes(s) && a >= 0 && b >= 0) a = -a || -1;   // make sure a negative shows up
      if (s >= 6) { a /= 10; b /= 10; }                         // decimals (tenths)
      ans = op === 'add' ? a + b : a - b;
    } else if (op === 'mul') {
      [a, b] = [
        () => [rand(1, 5), rand(1, 5)],
        () => [rand(2, 10), rand(2, 10)],
        () => [rand(2, 12), rand(2, 12)],
        () => [rand(11, 99), rand(2, 9)],
        () => [rand(1, 10) * -1, rand(-10, 10) || 2],
        () => [rand(1, 99) / 10, rand(2, 9)],
        () => [rand(11, 99) * sgn(), rand(2, 9) * -1]
      ][s]();
      if (rng() < 0.5) [a, b] = [b, a];
      ans = a * b;
    } else {
      const [d, q] = [
        () => [rand(2, 5), rand(1, 5)],
        () => [rand(2, 10), rand(1, 10)],
        () => [rand(2, 12), rand(2, 12)],
        () => [rand(2, 9) * sgn(), rand(1, 9) * -1],
        () => [rand(2, 9), rand(11, 30)],
        () => [rand(2, 9), rand(11, 99) / 10],
        () => [rand(2, 12) * sgn(), rand(10, 30) * -1]
      ][s]();
      b = d; ans = q; a = round2(d * q);
    }
    ans = round2(ans);
    const wrap = (v) => (v < 0 ? `(${fmtN(v)})` : fmtN(v));
    const signed = { add: [4, 5, 7], sub: [4, 5, 7], mul: [4, 6], div: [3, 6] }[op].includes(s);
    const dec = { add: [6, 7], sub: [6, 7], mul: [5], div: [5] }[op].includes(s);
    const q = { op, a, b, ans, d: Math.min(10, 2 + s), step: s, text: `${fmtN(a)} ${OPS[op].sym} ${wrap(b)}` };
    q.choices = ladderChoices(ans, signed, dec);
    return q;
  }

  // Wrong choices for Hagdan: sign flips once signed numbers start, small slips otherwise
  function ladderChoices(ans, signed, dec) {
    const st = dec ? 0.1 : 1;
    const out = [ans];
    const cands = shuffle([ans + st, ans - st, ans + 10 * st, ans - 10 * st, ans + 2 * st, ans - 2 * st, ans + 1, ans - 1].map(round2));
    if (signed && ans !== 0) cands.unshift(-ans);
    for (const c of cands) {
      if (out.length >= 3) break;
      if (!signed && c < 0) continue;
      if (!out.some((o) => fmtN(o) === fmtN(c))) out.push(c);
    }
    while (out.length < 3) out.push(round2(ans + out.length * 3));
    return shuffle(out);
  }

  // Three answer choices: the right one plus two believable mistakes
  function choicesFor(q) {
    const offs = [1, 2, 3, 5, 10];
    if (q.op === 'mul') offs.push(q.a, q.b);
    if (q.op === 'store') offs.push(4, 20);
    const set = [q.ans];
    for (let i = 0; set.length < 3 && i < 40; i++) {
      const w = q.ans + (rng() < 0.5 ? -1 : 1) * pick(offs);
      if (w >= 0 && !set.includes(w)) set.push(w);
    }
    while (set.length < 3) set.push(q.ans + set.length * 2);
    return shuffle(set);
  }

  function storeQ(diff) {
    const d = clamp(Math.round(diff), 1, 10);
    const items = shuffle(STORE.slice()).map((s) => ({ e: s[0], n: s[1], p: rand(s[2], s[3]) }));
    const billFor = (amt) => {
      const ok = BILLS.filter((b) => b > amt);
      return ok[rng() < 0.7 || ok.length < 2 ? 0 : 1] || 1000;
    };
    const type = d <= 2 ? pick(['total', 'qty']) : d <= 5 ? pick(['total', 'qty', 'sukli']) : pick(['total3', 'qtysukli', 'sukli', 'qty']);
    const line = (x, n) => (n ? `${n} × ${x.e} ${x.n} @ ₱${x.p}` : `${x.e} ${x.n} ₱${x.p}`);
    let lines, ask, ans;
    const [x, y, z] = items;
    if (type === 'total') { lines = [line(x), line(y)]; ask = 'Magkano lahat?'; ans = x.p + y.p; }
    else if (type === 'total3') { lines = [line(x), line(y), line(z)]; ask = 'Magkano lahat?'; ans = x.p + y.p + z.p; }
    else if (type === 'qty') { const n = rand(2, d <= 2 ? 3 : 6); lines = [line(x, n)]; ask = 'Magkano lahat?'; ans = n * x.p; }
    else if (type === 'sukli') { const bill = billFor(x.p); lines = [line(x), `💵 Bayad: ₱${bill}`]; ask = 'Magkano ang sukli?'; ans = bill - x.p; }
    else { const n = rand(2, 4), tot = n * x.p, bill = billFor(tot); lines = [line(x, n), `💵 Bayad: ₱${bill}`]; ask = 'Magkano ang sukli?'; ans = bill - tot; }
    return { op: 'store', ans, d, long: true, lines, ask };
  }

  // Friendly strategy tips ("Tulong") for Classic and Times Tables
  function hintFor(q) {
    const { op, a, b } = q;
    if (op === 'add') {
      if (b >= 10) { const t = b - (b % 10); return `Split it: ${a} + ${t} = ${a + t}, then add ${b % 10}.`; }
      return `Start at ${Math.max(a, b)} and count up ${Math.min(a, b)}.`;
    }
    if (op === 'sub') {
      if (b >= 10) { const t = b - (b % 10); return `Split it: ${a} − ${t} = ${a - t}, then take away ${b % 10}.`; }
      return `Start at ${a} and count back ${b}.`;
    }
    if (op === 'mul') {
      const big = Math.max(a, b), small = Math.min(a, b);
      if (big > 10) return `Split it: 10 × ${small} = ${10 * small}, plus ${big - 10} × ${small} = ${(big - 10) * small}.`;
      if (small <= 1) return `Anything times 1 stays the same!`;
      return `${big} × ${small - 1} = ${big * (small - 1)}. Add one more ${big}.`;
    }
    if (op === 'div') return `Think: ${b} × ? = ${a}`;
    return '';
  }

  /* ---------------- screens ---------------- */
  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + id));
    window.scrollTo(0, 0);
    playMusic(id === 'play' ? 'play' : 'menu');
    if (id === 'home') renderHome();
    if (id === 'classic') renderClassic();
    if (id === 'mini') renderMini();
    if (id === 'cards') renderCards();
    if (id === 'hagdan') renderHagdan();
  }

  function renderHome() {
    $('#game-title').textContent = CFG.GAME_NAME;
    $('#game-tagline').textContent = CFG.TAGLINE;
    $('#home-name').textContent = P.name || 'Player';
    $('#home-avatar').textContent = P.avatar;
    const L = levelInfo(P.xp);
    $('#home-level').textContent = L.lvl;
    $('#home-xp').style.width = L.pct + '%';
    $('#btn-sound').textContent = P.sound ? '🔊' : '🔇';
    $('#btn-music').style.opacity = P.music ? 1 : 0.4;
    const best = P.best.ranked || 0, R = rankOf(best);
    $('#home-rank-badge').textContent = R.icon;
    $('#home-rank-name').textContent = R.name;
    $('#home-rank-best').textContent = best;
    $('#home-rank-next').textContent = R.next ? `Next: ${R.next[1]} at ${R.next[0]}` : 'Pinakamataas na rank! 👑';
    $('#home-stars').textContent = totalStars(P);
    $('#home-cards').textContent = `${P.cards.length}/${CARDS.length}`;
    $('#daily-sub').textContent = P.dailyDone === manilaDate()
      ? '✅ Done today · practice run (not ranked)'
      : 'Same 20 questions for everyone · first try counts';
  }

  let classicOp = 'add';
  function renderClassic() {
    const ops = $('#classic-ops');
    ops.innerHTML = '';
    Object.entries(OPS).forEach(([k, o]) => {
      const b = el('button', `op ${o.color}${k === classicOp ? ' active' : ''}`, o.sym);
      b.appendChild(el('small', null, o.name));
      b.onclick = () => { classicOp = k; sfx.tap(); renderClassic(); };
      ops.appendChild(b);
    });
    const list = $('#classic-levels');
    list.innerHTML = '';
    ISLANDS.forEach(([name, em, sub], i) => {
      const lvl = i + 1;
      const stars = P.classic[`${classicOp}-${lvl}`] || 0;
      const unlocked = lvl === 1 || (P.classic[`${classicOp}-${lvl - 1}`] || 0) > 0;
      const b = el('button', 'island' + (unlocked ? '' : ' locked'));
      b.appendChild(el('span', 'num', lvl));
      b.appendChild(el('span', 'em', unlocked ? em : '🔒'));
      const nm = el('span', 'nm', name);
      nm.appendChild(el('small', null, sub));
      b.appendChild(nm);
      b.appendChild(el('span', 'st', '★'.repeat(stars) + '☆'.repeat(3 - stars)));
      b.onclick = () => {
        if (!unlocked) { toast(`Clear ${ISLANDS[i - 1][0]} first ⛵`); return; }
        startGame('classic', { op: classicOp, level: lvl });
      };
      list.appendChild(b);
    });
  }

  let miniIdx = 0, tablePick = 2;
  function renderMini() {
    const m = MINIS[miniIdx];
    $('#mini-icon').textContent = m.icon;
    $('#mini-title').textContent = m.title;
    $('#mini-desc').textContent = m.desc;
    const tags = $('#mini-tags');
    tags.innerHTML = '';
    m.tags.forEach(([t, c]) => { const s = el('span', 'tag ' + c, t); s.style.setProperty('--c', `var(--${c})`); tags.appendChild(s); });
    $('#mini-best').textContent = m.id === 'tables'
      ? `⭐ ${Object.values(P.tables).reduce((a, b) => a + b, 0)} / 33 stars`
      : `Best: ${P.best[m.id] || 0}`;
    $('#mini-dots').innerHTML = MINIS.map((_, i) => `<span class="${i === miniIdx ? 'on' : ''}"></span>`).join('');
    const tp = $('#tables-pick');
    tp.classList.toggle('hidden', m.id !== 'tables');
    if (m.id === 'tables') {
      tp.innerHTML = '';
      for (let t = 2; t <= 12; t++) {
        const b = el('button', t === tablePick ? 'active' : '', t);
        const s = P.tables[t] || 0;
        if (s) b.appendChild(el('i', null, '★'.repeat(s)));
        b.onclick = () => { tablePick = t; sfx.tap(); renderMini(); };
        tp.appendChild(b);
      }
    }
  }

  let hagdanOp = 'add';
  function renderHagdan() {
    const ops = $('#hagdan-ops');
    ops.innerHTML = '';
    Object.entries(OPS).forEach(([k, o]) => {
      const b = el('button', `op ${o.color}${k === hagdanOp ? ' active' : ''}`, o.sym);
      b.appendChild(el('small', null, o.name));
      b.onclick = () => { hagdanOp = k; sfx.tap(); renderHagdan(); };
      ops.appendChild(b);
    });
    const rec = P.ladder[hagdanOp];
    const steps = $('#hagdan-steps');
    steps.innerHTML = '';
    LADDER[hagdanOp].forEach((name, i) => {
      const li = el('li', rec && rec.step >= i ? 'done' : '');
      li.appendChild(el('span', 'num', i + 1));
      li.appendChild(el('span', 'nm', name));
      li.appendChild(el('span', 'st', rec && rec.step >= i ? '✓' : ''));
      steps.appendChild(li);
    });
    $('#hagdan-best').textContent = rec ? `Best: Step ${rec.step + 1} · ${rec.score} pts` : 'Hindi pa nasusubukan. Kaya mo yan!';
  }

  function renderCards() {
    const grid = $('#cards-grid');
    grid.innerHTML = '';
    CARDS.forEach((c) => grid.appendChild(cardEl(c, P.cards.includes(c.id))));
    $('#cards-count').textContent = `${P.cards.length}/${CARDS.length}`;
    $('#cards-bar').style.width = (P.cards.length / CARDS.length) * 100 + '%';
  }
  function cardEl(c, owned, isNew) {
    const d = el('div', 'card' + (owned ? '' : ' locked') + (isNew ? ' new' : ''));
    if (owned) d.style.setProperty('--c', `var(--${c.c})`);
    d.appendChild(el('div', 'ci', owned ? c.e : '🔒'));
    d.appendChild(el('div', 'cn', owned ? c.n : '???'));
    d.appendChild(el('div', 'cd', c.d));
    return d;
  }
  function checkCards() {
    const fresh = CARDS.filter((c) => !P.cards.includes(c.id) && c.t(P));
    fresh.forEach((c) => P.cards.push(c.id));
    return fresh;
  }

  /* ---------------- gameplay ---------------- */
  let G = null;

  function startGame(mode, opts = {}) {
    const M = MODES[mode];
    const today = manilaDate();
    rng = M.seeded ? mulberry32(hashStr('bilang-' + today)) : Math.random;
    G = {
      mode, M, opts, op: opts.op || M.op || 'mix',
      diff: mode === 'classic' ? opts.level : 2,
      score: 0, combo: 0, bestCombo: 0, correct: 0, wrong: 0, answered: 0,
      lives: M.lives || 0, timeLeft: M.time || 0, qIndex: 0, total: M.questions || 0,
      input: '', q: null, qStart: 0, fuse: 0, fuseMax: 1, locked: false, over: false, hinted: false,
      last: performance.now(), ranked: true
    };
    if (mode === 'tables') G.deck = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    if (mode === 'daily') {
      G.ranked = P.dailyDone !== today;   // only the first try each day goes to the leaderboard
      P.dailyDone = today;
      save();
    }

    let title = M.title;
    if (mode === 'classic') title = `${OPS[G.op].name} · ${ISLANDS[opts.level - 1][0].toUpperCase()}`;
    if (mode === 'tables') title = `TIMES TABLE · ${opts.table}`;
    if (mode === 'hagdan') { title = `HAGDAN · ${OPS[G.op].name}`; G.step = 0; }
    if (mode === 'daily' && !G.ranked) title += ' · PRACTICE';
    $('#hud-mode').textContent = title;
    $('#tfpad').classList.toggle('hidden', !M.tf);
    applyInputUI();
    $('#btn-hint').classList.toggle('hidden', !M.hint);
    $('#road').classList.toggle('hidden', !M.fuse);
    $('#float-layer').innerHTML = '';
    show('play');
    sfx.start();
    $('#hype-avatar').textContent = P.avatar;
    cheer(pick(['Laban! 💪', 'Kaya mo yan!', 'Game na! 🎮'], Math.random), 'var(--cyan)');
    nextQ();
    requestAnimationFrame(tick);
  }

  function nextQ() {
    if (!G || G.over) return;
    if (G.total && G.qIndex >= G.total) { endGame(); return; }
    G.qIndex++;
    G.input = '';
    G.hinted = false;
    $('#tutor').classList.add('hidden');
    $('#btn-hint').disabled = false;

    let q;
    if (G.mode === 'tables') q = tablesQ(G.opts.table, G.deck[G.qIndex - 1]);
    else if (G.M.store) q = storeQ(G.diff);
    else if (G.mode === 'daily') q = makeQ('mix', 2 + ((G.qIndex - 1) * 6) / 19);
    else if (G.M.climb) q = ladderQ(G.op, G.step);
    else q = makeQ(G.op, G.diff);
    if (G.M.tf) q.shown = rng() < 0.5 ? q.ans : wrongAnswer(q);
    else if (!q.choices) q.choices = choicesFor(q);
    G.q = q;

    const qe = $('#question');
    qe.classList.toggle('long', !!q.long);
    qe.innerHTML = '';
    if (q.long) {
      q.lines.forEach((l, i) => { if (i) qe.appendChild(document.createElement('br')); qe.appendChild(document.createTextNode(l)); });
      qe.appendChild(el('span', 'q-ask', q.ask));
    } else {
      qe.textContent = G.M.tf ? `${q.text} = ${q.shown}` : `${q.text} = ?`;
    }
    renderInput();
    renderChoices();
    G.qStart = performance.now();
    G.comboMax = Math.max(2.2, 5 - G.combo * 0.08);   // the longer the streak, the less time you get
    G.comboLeft = G.comboMax;
    if (G.M.fuse) {
      G.fuseMax = Math.max(3.2, 9 - G.correct * 0.22);
      G.fuse = G.fuseMax;
    }
    updateHUD();
  }

  function renderInput(state) {
    const a = $('#answer');
    a.classList.remove('good', 'bad');
    if (state) a.classList.add(state);
    a.textContent = G.input || ' ';
  }

  const tapMode = () => G && !G.M.tf && (G.M.tapOnly || P.inputMode !== 'type');

  // Show the tap choices or the number keypad, whichever the player picked
  function applyInputUI() {
    const tf = G.M.tf, tap = tapMode();
    $('#keypad').classList.toggle('hidden', tf || tap);
    $('#choices').classList.toggle('hidden', tf || !tap);
    $('#answer').classList.toggle('hidden', tf || tap);
    $('#btn-input').classList.toggle('hidden', !!(tf || G.M.tapOnly));
    $('#btn-input').textContent = tap ? '⌨️ Type instead' : '👆 Tap answers';
  }

  function renderChoices() {
    const box = $('#choices');
    box.innerHTML = '';
    if (!G.q.choices) return;
    G.q.choices.forEach((v) => {
      const b = el('button', null, G.q.op === 'store' ? `₱${v}` : fmtN(v));
      b.dataset.v = fmtN(v);
      box.appendChild(b);
    });
  }

  function pickChoice(btn) {
    if (!G || G.locked || G.over || !tapMode() || !btn) return;
    const ok = btn.dataset.v === fmtN(G.q.ans);
    btn.classList.add(ok ? 'good' : 'bad');
    answer(ok);
  }

  function toggleInput() {
    P.inputMode = P.inputMode === 'type' ? 'tap' : 'type';
    save();
    if (!G || G.over) return;
    G.input = '';
    renderInput();
    applyInputUI();
  }

  function press(k) {
    if (!G || G.locked || G.over || G.M.tf) return;
    sfx.tap();
    if (k === 'del') G.input = G.input.slice(0, -1);
    else if (k === 'ok') { if (G.input) submit(); return; }
    else if (G.input.length < 6) G.input += k;
    renderInput();
    // Auto-check as soon as enough digits are typed — keeps the arcade pace fast
    if (G.input.length >= String(G.q.ans).length) submit();
  }

  function submit() { answer(parseInt(G.input, 10) === G.q.ans); }

  function pressTF(saysTrue) {
    if (!G || G.locked || G.over || !G.M.tf) return;
    answer(saysTrue === (G.q.shown === G.q.ans));
  }

  function answer(ok, timedOut) {
    const secs = (performance.now() - G.qStart) / 1000;
    G.answered++;
    G.locked = true;
    const stage = $('#stage');
    stage.classList.remove('good', 'bad');
    void stage.offsetWidth; // restart the CSS animation

    if (ok) {
      G.correct++;
      const prevTier = tierOf(G.combo);
      G.combo++;
      G.bestCombo = Math.max(G.bestCombo, G.combo);
      const tier = tierOf(G.combo);
      if (G.M.climb && G.correct % PER_STEP === 0 && G.step < LADDER[G.op].length - 1) {
        G.step++;
        cheer(`🪜 STEP ${G.step + 1}! Akyat!`, 'var(--cyan)');
        toast(`🪜 Step ${G.step + 1}: ${LADDER[G.op][G.step]}`);
        sfx.step();
      }
      const speed = secs < 2 ? 10 : secs < 4 ? 5 : 0;
      let pts = Math.round((10 + G.q.d * 5) * tier[1]) + speed;
      if (G.hinted) pts = Math.round(pts / 2);
      G.score += pts;
      if (G.M.adaptive) G.diff = clamp(G.diff + (secs < 3 ? 0.45 : secs < 6 ? 0.2 : 0.05), 1, 10);
      stage.classList.add('good');
      if (!G.M.tf) renderInput('good');
      floatText(`+${pts}` + (speed ? ' ⚡' : ''), 'var(--green)');
      if (tier !== prevTier) cheer(`×${tier[1]} ${tier[2]}`, 'var(--pink)');
      else if (G.combo % 5 === 0) cheer(`${G.combo} COMBO! Laban! 🔥`, 'var(--pink)');
      else if (!(G.M.climb && G.correct % PER_STEP === 0)) cheer(pick(CHEERS, Math.random), 'var(--yellow)');
      bounceAvatar();
      sparks();
      if (tier !== prevTier && tier[1] >= 3) sfx.fever();
      else if (tier !== prevTier || G.combo % 5 === 0) sfx.combo();
      else sfx.good(G.combo);
      const c = $('#hud-combo');
      c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
      updateHUD();
      setTimeout(() => { if (G && !G.over) { G.locked = false; nextQ(); } }, 260);
    } else {
      G.wrong++;
      G.combo = 0;
      if (G.M.adaptive) G.diff = clamp(G.diff - 0.8, 1, 10);
      if (G.M.lives) G.lives--;
      stage.classList.add('bad');
      if (G.M.tf) {
        floatText(`${G.q.text} = ${G.q.ans}`, 'var(--cyan)', 20, 30);
      } else if (tapMode()) {
        $$('#choices button').forEach((b) => { if (b.dataset.v === fmtN(G.q.ans)) b.classList.add('good'); });
      } else {
        G.input = String(G.q.ans);
        renderInput('bad');
      }
      cheer(timedOut ? 'Lumampas! 🚏' : pick(OOPS, Math.random), 'var(--red)');
      if (timedOut) sfx.horn();
      sfx.bad();
      updateHUD();
      setTimeout(() => {
        if (!G || G.over) return;
        G.locked = false;
        if (G.M.lives && G.lives <= 0) endGame();
        else nextQ();
      }, 950);
    }
  }

  // Big cheer line in the hype panel above the question
  function cheer(txt, color) {
    const c = $('#hype-cheer');
    c.textContent = txt;
    c.style.color = color;
    c.style.textShadow = `0 0 12px ${color}`;
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  }
  function bounceAvatar() {
    const a = $('#hype-avatar');
    a.classList.remove('bounce'); void a.offsetWidth; a.classList.add('bounce');
  }

  function floatText(txt, color, size, offset) {
    const f = el('div', 'float', txt);
    f.style.color = color;
    f.style.textShadow = `0 0 10px ${color}`;
    if (size) f.style.fontSize = size + 'px';
    if (offset) f.style.top = `calc(42% + ${offset}px)`;
    $('#float-layer').appendChild(f);
    setTimeout(() => f.remove(), 950);
  }
  function sparks() {
    const layer = $('#float-layer');
    const colors = ['var(--cyan)', 'var(--pink)', 'var(--yellow)', 'var(--green)'];
    for (let i = 0; i < 12; i++) {
      const s = el('div', 'spark');
      const a = (Math.PI * 2 * i) / 12, r = 50 + Math.random() * 40;
      s.style.left = '50%'; s.style.top = '50%';
      s.style.background = colors[i % 4];
      s.style.boxShadow = `0 0 8px ${colors[i % 4]}`;
      s.style.setProperty('--dx', Math.cos(a) * r + 'px');
      s.style.setProperty('--dy', Math.sin(a) * r + 'px');
      layer.appendChild(s);
      setTimeout(() => s.remove(), 650);
    }
  }

  function updateHUD() {
    $('#hud-score').textContent = G.score;
    const tier = tierOf(G.combo);
    $('#hud-combo').textContent = G.combo >= 2 ? `${G.combo} COMBO` : '';
    $('#hype-combo').textContent = G.combo;
    $('#hype-mult').textContent = `×${tier[1]}`;
    $('#hype').dataset.tier = COMBO_TIERS.indexOf(tier);
    $('#combo-mult').textContent = `×${tier[1]}`;
    $('#combo-meter').classList.toggle('on', G.combo > 0);
    if (G.combo === 0) $('#combo-fill').style.width = '0%';
    $('#combo-meter').dataset.tier = COMBO_TIERS.indexOf(tier);
    $('#screen-play').classList.toggle('fever', tier[1] >= 3);
    $('#screen-play').classList.toggle('super', tier[1] >= 4);
    $('#hud-lives').textContent = G.M.lives ? '❤️'.repeat(Math.max(0, G.lives)) + '🖤'.repeat(G.M.lives - Math.max(0, G.lives)) : '';
    $('#hud-progress').textContent = G.total ? `${Math.min(G.qIndex, G.total)} / ${G.total}`
      : G.M.fuse ? `Ride ${G.qIndex}`
      : G.M.climb ? `Step ${G.step + 1} · ${LADDER[G.op][G.step]}` : '';
    if (G.M.climb) {
      const top = G.step >= LADDER[G.op].length - 1;
      $('#hud-timer').style.width = (top ? 100 : ((G.correct % PER_STEP) / PER_STEP) * 100) + '%';
    }
    if (G.total && !G.M.time) $('#hud-timer').style.width = ((G.qIndex - 1) / G.total) * 100 + '%';
  }

  function tick(t) {
    if (!G || G.over) return;
    const dt = Math.min((t - G.last) / 1000, 0.25);
    G.last = t;
    const bar = $('#hud-timer');
    if (G.M.time) {
      G.timeLeft -= dt;
      const frac = Math.max(0, G.timeLeft / G.M.time);
      bar.style.width = frac * 100 + '%';
      bar.classList.toggle('low', G.timeLeft < 10);
      const sec = Math.ceil(G.timeLeft);
      if (sec <= 5 && sec > 0 && sec !== G.lastTick) { G.lastTick = sec; sfx.tick(); }
      if (G.timeLeft <= 0) { endGame(); return; }
    }
    if (G.combo > 0 && !G.locked) {
      G.comboLeft -= dt;
      $('#combo-fill').style.width = clamp(G.comboLeft / G.comboMax, 0, 1) * 100 + '%';
      if (G.comboLeft <= 0) breakCombo();
    }
    if (G.M.fuse && !G.locked) {
      G.fuse -= dt;
      const frac = clamp(G.fuse / G.fuseMax, 0, 1);
      bar.style.width = frac * 100 + '%';
      bar.classList.toggle('low', frac < 0.3);
      $('#jeep').style.left = `calc(${(1 - frac) * 100}% - ${(1 - frac) * 44}px)`;
      $('#road').classList.toggle('danger', frac < 0.3);
      if (frac < 0.3 && G.honked !== G.qIndex) { G.honked = G.qIndex; sfx.horn(); }
      if (G.fuse <= 0) answer(false, true);
    }
    requestAnimationFrame(tick);
  }

  function breakCombo() {
    if (G.combo >= 3) {
      cheer('Combo lost! 💨', 'var(--muted)');
      sfx.comboLost();
    }
    G.combo = 0;
    updateHUD();
  }

  function useHint() {
    if (!G || G.locked || G.hinted) return;
    const h = hintFor(G.q);
    if (!h) return;
    G.hinted = true;
    G.combo = 0;
    updateHUD();
    const t = $('#tutor');
    t.textContent = '💡 ' + h;
    t.classList.remove('hidden');
    $('#btn-hint').disabled = true;
  }

  function quitGame() {
    if (!G || G.over) return;
    if (!confirm('Quit this game? Your score will not be saved.')) return;
    G.over = true;
    show('home');
  }

  /* ---------------- results ---------------- */
  function endGame() {
    if (!G || G.over) return;
    G.over = true;
    const { mode, M } = G;
    const acc = G.answered ? Math.round((G.correct / G.answered) * 100) : 0;
    let stars, title, msg = '';

    if (mode === 'classic' || mode === 'tables') {
      const failed = G.lives <= 0;
      stars = failed ? 0 : Math.max(1, 3 - G.wrong);
      title = failed ? 'UBOS ANG BUHAY!' : 'GALING MO!';
      const store = mode === 'classic' ? P.classic : P.tables;
      const key = mode === 'classic' ? `${G.op}-${G.opts.level}` : G.opts.table;
      store[key] = Math.max(store[key] || 0, stars);
      if (failed) msg = "Sayang! Try again, kaya mo 'yan! 💪";
      else if (mode === 'classic' && G.opts.level < 10) msg = `⛵ Next island unlocked: <b>${ISLANDS[G.opts.level][0]}</b>`;
      else if (mode === 'classic') msg = `🦅 You reached <b>Davao</b>! Route complete!`;
      else msg = `Times table ${G.opts.table}: ${'★'.repeat(stars)}`;
    } else if (M.climb) {
      const L = LADDER[G.op];
      stars = G.step >= L.length - 1 ? 3 : G.step >= 4 ? 2 : G.step >= 2 ? 1 : 0;
      title = 'UBOS ANG BUHAY!';
      const rec = P.ladder[G.op] || { step: 0, score: 0 };
      if (G.score > rec.score) msg = '🎉 <b>Bagong record</b> for this hagdan!';
      P.ladder[G.op] = { step: Math.max(rec.step, G.step), score: Math.max(rec.score, G.score) };
      msg = `🪜 You reached <b>Step ${G.step + 1}: ${L[G.step]}</b>` + (msg ? '<br>' + msg : '');
    } else {
      stars = M.thresholds.filter((t) => G.score >= t).length;
      title = mode === 'jeepney' ? 'LAST STOP!' : mode === 'daily' ? 'HAMON COMPLETE!' : "TIME'S UP!";
    }

    // stats & XP
    P.stats.games++;
    P.stats.correct += G.correct;
    P.stats.answered += G.answered;
    P.stats.bestCombo = Math.max(P.stats.bestCombo, G.bestCombo);
    if (mode === 'daily') P.stats.daily++;
    const xp = Math.floor(G.score / 10) + G.correct * 2;
    const lvlBefore = levelInfo(P.xp).lvl;
    P.xp += xp;
    const lvlAfter = levelInfo(P.xp).lvl;

    let record = false;
    if (M.board) {
      if (G.score > (P.best[mode] || 0)) { record = P.best[mode] > 0 || G.score > 0; P.best[mode] = G.score; }
      const list = (P.local[mode] = P.local[mode] || []);
      list.push({ name: P.name || 'Player', avatar: P.avatar, score: G.score, accuracy: acc, combo: G.bestCombo, date: new Date().toISOString() });
      list.sort((a, b) => b.score - a.score);
      list.length = Math.min(list.length, 10);
    }
    const fresh = checkCards();
    save();

    // render
    $('#res-title').textContent = title;
    $('#res-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('#res-score').textContent = G.score;
    $('#res-correct').textContent = G.correct;
    $('#res-acc').textContent = acc + '%';
    $('#res-combo').textContent = G.bestCombo;
    $('#res-xp').textContent = '+' + xp;
    const parts = [];
    if (msg) parts.push(msg);
    if (record) parts.push('🎉 <b>Bagong record!</b> New personal best!');
    if (lvlAfter > lvlBefore) parts.push(`⬆️ Level up! You are now <b>Lv.${lvlAfter}</b>`);
    if (mode === 'ranked') {
      const R = rankOf(P.best.ranked || 0);
      parts.push(`Rank: <b>${R.icon} ${R.name}</b>`);
    }
    if (mode === 'daily' && !G.ranked) parts.push('Practice run · only your first try today counts.');
    $('#res-msg').innerHTML = parts.join('<br>');
    const rc = $('#res-cards');
    rc.innerHTML = '';
    fresh.forEach((c) => rc.appendChild(cardEl(c, true, true)));
    if (fresh.length) toast(`🃏 New card${fresh.length > 1 ? 's' : ''} unlocked!`);
    $('#btn-res-board').classList.toggle('hidden', !M.board);
    show('results');
    if (stars > 0 || record) sfx.end(); else sfx.lose();
    if (fresh.length) setTimeout(sfx.card, 900);

    if (M.board && G.ranked && G.score > 0) {
      sendScore({ mode, score: G.score, correct: G.correct, accuracy: acc, combo: G.bestCombo });
    }
  }

  /* ---------------- leaderboard (Google Apps Script) ---------------- */
  function addLine(html) {
    const m = $('#res-msg');
    m.innerHTML += (m.innerHTML ? '<br>' : '') + html;
  }

  async function postScore(entry) {
    const res = await fetch(API, {
      method: 'POST',
      // text/plain avoids a CORS "preflight", which Apps Script does not support
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(entry)
    });
    return res.json();
  }

  async function sendScore(s) {
    if (!API) { addLine('📴 Offline leaderboard (no Google Sheet linked yet).'); return; }
    const entry = Object.assign({ action: 'submit', id: P.id, name: P.name || 'Player', avatar: P.avatar }, s);
    addLine('📡 Sending score…');
    try {
      const j = await postScore(entry);
      if (!j.ok) throw new Error(j.error || 'rejected');
      const m = $('#res-msg');
      m.innerHTML = m.innerHTML.replace('📡 Sending score…', j.rank ? `🌏 Global rank: <b>#${j.rank}</b>` : '🌏 Score saved!');
    } catch (e) {
      P.queue.push(entry);
      save();
      const m = $('#res-msg');
      m.innerHTML = m.innerHTML.replace('📡 Sending score…', '📶 No connection. Score will be sent next time.');
    }
  }

  async function flushQueue() {
    if (!API || !P.queue.length) return;
    const pending = P.queue.slice();
    P.queue = [];
    for (const entry of pending) {
      try {
        const j = await postScore(entry);
        if (!j.ok && /network|busy/i.test(j.error || '')) P.queue.push(entry);
      } catch (e) { P.queue.push(entry); }
    }
    save();
  }

  let boardMode = 'ranked', boardPeriod = 'all', boardReq = 0;
  function openBoard(mode) {
    if (mode) boardMode = mode;
    show('board');
    renderBoardTabs();
    loadBoard();
  }
  function renderBoardTabs() {
    const tabs = $('#board-tabs');
    tabs.innerHTML = '';
    BOARD_TABS.forEach(([id, label]) => {
      const b = el('button', id === boardMode ? 'active' : '', label);
      b.onclick = () => { boardMode = id; renderBoardTabs(); loadBoard(); };
      tabs.appendChild(b);
    });
    $('#board-period').classList.toggle('hidden', boardMode === 'daily');
    $$('#board-period button').forEach((b) => b.classList.toggle('active', b.dataset.period === boardPeriod));
  }
  async function loadBoard() {
    const req = ++boardReq;
    const list = $('#board-list'), status = $('#board-status');
    list.innerHTML = '';
    if (!API) {
      status.textContent = '📴 Offline mode: showing scores from this device only. Link a Google Sheet in config.js to go global.';
      drawBoard(P.local[boardMode] || []);
      return;
    }
    const period = boardMode === 'daily' ? 'today' : boardPeriod;
    status.textContent = '📡 Loading…';
    try {
      const url = `${API}?action=top&mode=${boardMode}&period=${period}&limit=${CFG.LEADERBOARD_SIZE}`;
      const j = await (await fetch(url)).json();
      if (req !== boardReq) return;
      if (!j.ok) throw new Error(j.error);
      status.textContent = j.scores.length
        ? (boardMode === 'daily' ? `🌟 Today's Hamon · ${manilaDate()}` : '🌏 Global leaderboard')
        : 'Wala pang score. Be the first! 🚀';
      drawBoard(j.scores);
    } catch (e) {
      if (req !== boardReq) return;
      status.textContent = '📶 Could not reach the leaderboard. Showing this device only.';
      drawBoard(P.local[boardMode] || []);
    }
  }
  function drawBoard(rows) {
    const list = $('#board-list');
    list.innerHTML = '';
    const me = (P.name || '').trim().toLowerCase();
    const medals = ['🥇', '🥈', '🥉'];
    rows.forEach((r, i) => {
      const li = el('li', String(r.name || '').trim().toLowerCase() === me ? 'me' : '');
      li.appendChild(el('span', 'pos', medals[i] || i + 1));
      li.appendChild(el('span', 'av', r.avatar || '🙂'));
      const nm = el('span', 'nm', r.name);
      const extra = [];
      if (r.accuracy != null && r.accuracy !== '') extra.push(`${r.accuracy}% tama`);
      if (r.combo) extra.push(`x${r.combo} combo`);
      if (extra.length) nm.appendChild(el('small', null, extra.join(' · ')));
      li.appendChild(nm);
      li.appendChild(el('span', 'sc', r.score));
      list.appendChild(li);
    });
  }

  /* ---------------- name / avatar ---------------- */
  let avatarPick = P.avatar;
  function openNameModal() {
    $('#name-input').value = P.name;
    avatarPick = P.avatar;
    renderAvatars();
    $('#modal-name').classList.remove('hidden');
    setTimeout(() => $('#name-input').focus(), 50);
  }
  function renderAvatars() {
    const box = $('#avatar-pick');
    box.innerHTML = '';
    AVATARS.forEach((a) => {
      const b = el('button', a === avatarPick ? 'active' : '', a);
      b.onclick = () => { avatarPick = a; renderAvatars(); };
      box.appendChild(b);
    });
  }
  function saveName() {
    const n = $('#name-input').value.replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!n) { toast('Type a nickname first 🙂'); return; }
    P.name = n;
    P.avatar = avatarPick;
    save();
    $('#modal-name').classList.add('hidden');
    renderHome();
  }

  /* ---------------- background ---------------- */
  function buildBackground() {
    const bg = $('#bg');
    const syms = ['+', '−', '×', '÷', '=', '★', '₱', '7', '3', '9', '%'];
    const colors = ['var(--cyan)', 'var(--pink)', 'var(--yellow)', 'var(--purple)', 'var(--green)'];
    for (let i = 0; i < 16; i++) {
      const s = el('span', 'sym', syms[i % syms.length]);
      const c = colors[i % colors.length];
      s.style.left = Math.random() * 96 + '%';
      s.style.fontSize = 16 + Math.random() * 30 + 'px';
      s.style.color = c;
      s.style.textShadow = `0 0 12px ${c}`;
      const dur = 16 + Math.random() * 18;
      s.style.animationDuration = dur + 's';
      s.style.animationDelay = -Math.random() * dur + 's';
      bg.appendChild(s);
    }
  }

  /* ---------------- wiring ---------------- */
  function go(target) {
    sfx.tap();
    if (target === 'ranked' || target === 'daily') {
      if (!P.name) { openNameModal(); return; }
      startGame(target);
    } else if (target === 'board') openBoard(boardMode);
    else show(target);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) go(b.dataset.go);
  });
  $('#keypad').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
  $('#choices').addEventListener('click', (e) => pickChoice(e.target.closest('button')));
  $('#btn-input').onclick = toggleInput;
  $('#tfpad').addEventListener('click', (e) => { const b = e.target.closest('[data-tf]'); if (b) pressTF(b.dataset.tf === '1'); });
  $('#btn-hint').onclick = useHint;
  $('#btn-quit').onclick = quitGame;
  $('#btn-again').onclick = () => { if (G) startGame(G.mode, G.opts); };
  $('#btn-res-board').onclick = () => openBoard(G && G.M.board ? G.mode : 'ranked');
  $('#btn-profile').onclick = openNameModal;
  $('#btn-sound').onclick = () => { P.sound = !P.sound; save(); renderHome(); };
  $('#btn-music').onclick = () => {
    P.music = !P.music;
    save();
    renderHome();
    playMusic('menu');
    toast(P.music ? '🎵 Music on' : '🎵 Music off', 1200);
  };
  $('#name-save').onclick = saveName;
  $('#name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
  $('#mini-prev').onclick = () => { miniIdx = (miniIdx + MINIS.length - 1) % MINIS.length; sfx.tap(); renderMini(); };
  $('#mini-next').onclick = () => { miniIdx = (miniIdx + 1) % MINIS.length; sfx.tap(); renderMini(); };
  $('#mini-play').onclick = () => {
    const id = MINIS[miniIdx].id;
    if (MODES[id].board && !P.name) { openNameModal(); return; }
    startGame(id, id === 'tables' ? { table: tablePick } : {});
  };
  $('#board-refresh').onclick = loadBoard;
  $('#hagdan-play').onclick = () => startGame('hagdan', { op: hagdanOp });
  $$('#board-period button').forEach((b) => {
    b.onclick = () => { boardPeriod = b.dataset.period; renderBoardTabs(); loadBoard(); };
  });

  // Swipe between mini games on phones
  let touchX = null;
  $('#mini-card').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('#mini-card').addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) (dx < 0 ? $('#mini-next') : $('#mini-prev')).click();
    touchX = null;
  });

  // Physical keyboard support
  document.addEventListener('keydown', (e) => {
    if (!$('#modal-name').classList.contains('hidden')) return;
    if (!$('#screen-play').classList.contains('active') || !G || G.over) return;
    if (G.M.tf) {
      if (['t', 'T', 'ArrowLeft', '1'].includes(e.key)) pressTF(true);
      if (['m', 'M', 'f', 'F', 'ArrowRight', '0'].includes(e.key)) pressTF(false);
      return;
    }
    if (tapMode()) {
      if (['1', '2', '3'].includes(e.key)) pickChoice($$('#choices button')[Number(e.key) - 1]);
      return;
    }
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') press('ok');
    else if (e.key === 'h' && G.M.hint) useHint();
  });

  document.title = CFG.GAME_NAME;
  buildBackground();
  show('home');
  if (!P.name) openNameModal();
  flushQueue();
})();
