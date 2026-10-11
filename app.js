/* Sightline — original visual speed & attention exercise. All art and sound generated in code. */
(function () {
  'use strict';
  var S = window.SLStair;
  var params = new URLSearchParams(location.search);
  var TEST = params.get('test') === '1';
  var TRIALS = (TEST && +params.get('trials')) || 24;
  var FIX_MS = 500, MASK_MS = 300, FB_MS = 700;
  var KEY = 'sightline.v1';

  // ---------- levels ----------
  var LEVELS = {
    1: { name: 'Level 1', desc: 'Car or truck. The diamond appears close to the centre, nothing else on screen.', radius: 45, pair: 'easy', distract: [0, 0], busy: false, unlock: 200 },
    2: { name: 'Level 2', desc: 'Car or truck. The diamond can appear further out.', radius: 66, pair: 'easy', distract: [0, 0], busy: false, unlock: 180 },
    3: { name: 'Level 3', desc: 'Look-alike signs appear. Find the diamond among 8–12 decoys.', radius: 66, pair: 'easy', distract: [8, 12], busy: false, unlock: 200 },
    4: { name: 'Level 4', desc: 'Two cars that differ only in roof shape. Find the diamond among 10–14 look-alike signs.', radius: 66, pair: 'roof', distract: [10, 14], busy: false, unlock: 220 },
    5: { name: 'Level 5', desc: 'Widest field and a busy background. Find the diamond among 16 look-alike signs; vans differ in wheel count.', radius: 82, pair: 'wheels', distract: [16, 16], busy: true, unlock: null }
  };

  // ---------- art (original, drawn in code) ----------
  var INK = '#1d2433', BODY = '#2d5aa8', GLASS = '#cfe3f5';
  function wheel(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + INK + '"/><circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#d8dce4"/>'; }
  // all vehicles in a 120x70 box, ground at y=62
  var VEH = {
    car: function () { // sloped-roof saloon
      return '<path d="M8 50 Q8 40 18 39 L34 37 L46 22 Q49 19 54 19 L78 19 Q83 19 86 23 L97 37 L106 39 Q114 41 114 50 L114 54 L8 54 Z" fill="' + BODY + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M50 24 L60 24 L60 37 L40 37 Z M65 24 L78 24 Q80 24 82 27 L90 37 L65 37 Z" fill="' + GLASS + '" stroke="' + INK + '" stroke-width="1.5"/>' + wheel(32, 55) + wheel(92, 55);
    },
    truck: function () { // cab + cargo box
      return '<rect x="6" y="10" width="72" height="42" rx="3" fill="#e9e4d8" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M80 52 L80 22 Q80 19 83 19 L100 19 Q104 19 106 23 L114 37 L114 52 Z" fill="' + BODY + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M86 24 L100 24 L107 36 L86 36 Z" fill="' + GLASS + '" stroke="' + INK + '" stroke-width="1.5"/>' + wheel(22, 55) + wheel(46, 55) + wheel(98, 55);
    },
    estate: function () { // same body as car, flat long roof
      return '<path d="M8 50 Q8 40 18 39 L34 37 L42 21 Q44 19 48 19 L100 19 Q104 19 105 23 L108 39 Q114 41 114 50 L114 54 L8 54 Z" fill="' + BODY + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M46 24 L60 24 L60 37 L39 37 Z M65 24 L99 24 L101 37 L65 37 Z" fill="' + GLASS + '" stroke="' + INK + '" stroke-width="1.5"/>' + wheel(32, 55) + wheel(92, 55);
    },
    van2: function () { return van(2); },
    van3: function () { return van(3); }
  };
  function van(n) {
    var s = '<path d="M6 52 L6 16 Q6 12 10 12 L86 12 Q92 12 96 18 L112 36 Q114 38 114 42 L114 52 Z" fill="' + BODY + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M84 18 L92 18 L106 36 L84 36 Z" fill="' + GLASS + '" stroke="' + INK + '" stroke-width="1.5"/><line x1="78" y1="14" x2="78" y2="50" stroke="' + INK + '" stroke-width="1.5"/>';
    var xs = n === 2 ? [26, 94] : [22, 42, 94];
    xs.forEach(function (x) { s += wheel(x, 55); });
    return s;
  }
  var PAIRS = { easy: ['car', 'truck'], roof: ['car', 'estate'], wheels: ['van2', 'van3'] };
  function vehicleSVG(kind) { return '<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">' + VEH[kind]() + '</svg>'; }

  // signs centred at 0,0, ~20 units across
  var SY = '#f2b705', SK = INK;
  var SIGNS = {
    target: '<rect x="-7.5" y="-7.5" width="15" height="15" transform="rotate(45)" fill="' + SY + '" stroke="' + SK + '" stroke-width="2"/><rect x="-2.6" y="-2.6" width="5.2" height="5.2" transform="rotate(45)" fill="' + SK + '"/>',
    tri: '<path d="M0 -10 L10 8 L-10 8 Z" fill="' + SY + '" stroke="' + SK + '" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="2" r="2.6" fill="' + SK + '"/>',
    square: '<rect x="-8" y="-8" width="16" height="16" fill="' + SY + '" stroke="' + SK + '" stroke-width="2"/><rect x="-2.6" y="-2.6" width="5.2" height="5.2" fill="' + SK + '"/>',
    circle: '<circle r="9" fill="' + SY + '" stroke="' + SK + '" stroke-width="2"/><circle r="2.8" fill="' + SK + '"/>',
    octa: '<path d="M-3.8 -9 L3.8 -9 L9 -3.8 L9 3.8 L3.8 9 L-3.8 9 L-9 3.8 L-9 -3.8 Z" fill="' + SY + '" stroke="' + SK + '" stroke-width="2"/><circle r="2.6" fill="' + SK + '"/>',
    invtri: '<path d="M0 10 L10 -8 L-10 -8 Z" fill="' + SY + '" stroke="' + SK + '" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-2" r="2.6" fill="' + SK + '"/>'
  };
  function signSVG(k, pad) { pad = pad || 12; return '<svg viewBox="' + (-pad) + ' ' + (-pad) + ' ' + 2 * pad + ' ' + 2 * pad + '" xmlns="http://www.w3.org/2000/svg">' + SIGNS[k] + '</svg>'; }
  var DISTRACT_KINDS = ['tri', 'square', 'circle', 'octa', 'invtri'];

  var ICON_SVG = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#1f5fbf"/>' +
    '<circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2"/>' +
    (function () { var s = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; var x = 50 + 31 * Math.sin(a), y = 50 - 31 * Math.cos(a); s += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (i === 1 ? 6.5 : 4.5) + '" fill="' + (i === 1 ? '#f2b705' : '#fff') + '"/>'; } return s; })() +
    '<path d="M28 50 Q50 30 72 50 Q50 70 28 50 Z" fill="#fff"/><circle cx="50" cy="50" r="9" fill="#1d2433"/><circle cx="53" cy="47" r="2.6" fill="#fff"/></svg>';
  var FLAME = '<svg viewBox="0 0 24 24"><path d="M12 2 C13 7 18 9 18 15 A6 6 0 0 1 6 15 C6 11 9 10 9 6 C11 8 11 10 12 11 C13 8 12 5 12 2 Z" fill="#f07b1e"/><path d="M12 13 C13 15 15 16 15 18 A3 3 0 0 1 9 18 C9 16 11 15 12 13 Z" fill="#ffd34d"/></svg>';
  var SPK_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="#1d2433" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#1d2433"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';
  var SPK_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="#1d2433" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#1d2433"/><path d="M16 9l6 6M22 9l-6 6"/></svg>';

  // ---------- storage ----------
  function load() {
    var d; try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    d = d || {};
    d.best = d.best || {}; d.history = d.history || []; d.streak = d.streak || { count: 0, lastDate: null };
    d.unlocked = d.unlocked || 1; d.level = Math.min(d.level || 1, d.unlocked); d.muted = !!d.muted; d.last = d.last || null;
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { } }
  var data = load();
  function londonDate(dt) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dt || new Date()); }
  function dayDiff(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
  function currentStreak() { var s = data.streak; if (!s.lastDate) return 0; var d = dayDiff(s.lastDate, londonDate()); return d <= 1 ? s.count : 0; }
  function bumpStreak() {
    var today = londonDate(), s = data.streak;
    if (s.lastDate === today) return;
    s.count = (s.lastDate && dayDiff(s.lastDate, today) === 1) ? s.count + 1 : 1;
    s.lastDate = today;
  }

  // ---------- audio ----------
  var actx = null;
  function unlockAudio() {
    if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === 'suspended') actx.resume();
    if (actx && !unlockAudio.done) { var b = actx.createBuffer(1, 1, 22050), s = actx.createBufferSource(); s.buffer = b; s.connect(actx.destination); s.start(0); unlockAudio.done = true; }
  }
  function tone(freq, start, dur, type, vol) {
    if (!actx || data.muted) return;
    var t = actx.currentTime + start, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  var sfx = {
    good: function () { tone(784, 0, 0.18); tone(1175, 0.08, 0.3, 'sine', 0.14); },
    bad: function () { tone(196, 0, 0.32, 'triangle', 0.16); tone(165, 0.06, 0.3, 'sine', 0.1); },
    done: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.45, 'sine', 0.14); }); }
  };
  window.addEventListener('pointerdown', unlockAudio, { capture: true });
  window.addEventListener('keydown', unlockAudio, { capture: true });

  // ---------- frame timing ----------
  var frameMs = 1000 / 60;
  (function measure() {
    var ts = [];
    function f(t) { ts.push(t); if (ts.length < 31) requestAnimationFrame(f); else { var d = []; for (var i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort(function (a, b) { return a - b; }); var m = d[d.length >> 1]; if (m > 4 && m < 60) frameMs = m; } }
    requestAnimationFrame(f);
  })();

  // ---------- DOM ----------
  var $ = function (id) { return document.getElementById(id); };
  var screens = { home: $('home'), play: $('play-screen'), results: $('results') };
  var cur = 'home';
  function show(name) { Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('active', k === name); }); cur = name; window.scrollTo(0, 0); }
  document.querySelector('.logo').innerHTML = ICON_SVG;
  document.querySelector('.locicon').innerHTML = signSVG('target', 11);
  document.querySelectorAll('.flame').forEach(function (e) { e.innerHTML = FLAME; });
  function renderMute() { document.querySelectorAll('.mute').forEach(function (b) { b.innerHTML = data.muted ? SPK_OFF : SPK_ON; b.setAttribute('aria-pressed', data.muted ? 'true' : 'false'); }); }
  function toggleMute() { data.muted = !data.muted; save(); renderMute(); }
  document.querySelectorAll('.mute').forEach(function (b) { b.addEventListener('click', toggleMute); });
  renderMute();

  function renderHome() {
    var lv = $('levels'); lv.innerHTML = '';
    for (var i = 1; i <= 5; i++) {
      var b = document.createElement('button'); b.className = 'lvl'; b.dataset.level = i;
      b.setAttribute('aria-pressed', i === data.level ? 'true' : 'false');
      if (i > data.unlocked) { b.disabled = true; b.innerHTML = i + '<span class="lock">locked</span>'; b.setAttribute('aria-label', 'Level ' + i + ' locked'); }
      else { b.textContent = i; b.setAttribute('aria-label', 'Level ' + i); }
      b.addEventListener('click', function () { selectLevel(+this.dataset.level); });
      lv.appendChild(b);
    }
    var L = LEVELS[data.level];
    $('leveldesc').textContent = L.desc + (L.unlock ? ' Unlock the next level with a time under ' + L.unlock + ' ms.' : '');
    $('h-level').textContent = data.level;
    var best = data.best[data.level]; $('h-best').textContent = best ? best + ' ms' : '–';
    $('h-streak').querySelector('b').textContent = currentStreak();
    renderChart();
  }
  function selectLevel(n) { if (n >= 1 && n <= data.unlocked) { data.level = n; save(); renderHome(); } }
  function renderChart() {
    var h = data.history.slice(-30), el = $('chart');
    if (!h.length) { el.innerHTML = '<svg viewBox="0 0 300 110"><text x="150" y="60" text-anchor="middle" font-size="14" fill="#5b6475">Your session times will appear here</text></svg>'; return; }
    var vals = h.map(function (x) { return x.ms; }), mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    var pad = Math.max(10, (mx - mn) * 0.15); mx += pad; mn = Math.max(0, mn - pad);
    var W = 300, H = 110, L = 34, R = 8, T = 8, B = 16;
    function X(i) { return h.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (h.length - 1); }
    function Y(v) { return T + (mx - v) / (mx - mn || 1) * (H - T - B); }
    var pts = h.map(function (x, i) { return X(i).toFixed(1) + ',' + Y(x.ms).toFixed(1); }).join(' ');
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Session times chart">' +
      '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" stroke="#d9d3c5"/>' +
      '<text x="' + (L - 4) + '" y="' + (Y(mx - pad) + 4) + '" text-anchor="end" font-size="11" fill="#5b6475">' + Math.round(mx - pad) + '</text>' +
      '<text x="' + (L - 4) + '" y="' + (Y(mn + pad) + 4) + '" text-anchor="end" font-size="11" fill="#5b6475">' + Math.round(mn + pad) + '</text>' +
      '<polyline points="' + pts + '" fill="none" stroke="#1f5fbf" stroke-width="2.5" stroke-linejoin="round"/>';
    h.forEach(function (x, i) { s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.ms).toFixed(1) + '" r="3.5" fill="#fff" stroke="#1f5fbf" stroke-width="2"/>'; });
    s += '<text x="' + (W - R) + '" y="' + (H - 2) + '" text-anchor="end" font-size="11" fill="#5b6475">ms · latest on right</text></svg>';
    el.innerHTML = s;
  }

  // ---------- stage layout ----------
  var stage = $('stage'), stim = $('stim'), maskC = $('mask'), fix = $('fix');
  var Spx = 360;
  function layout() {
    var land = window.innerWidth > window.innerHeight && window.innerHeight < 500;
    var w = window.innerWidth - 20 - (land ? 82 : 0), h = window.innerHeight - (land ? 14 : 64 + 24);
    Spx = Math.max(240, Math.floor(Math.min(w, h, 640)));
    stage.style.setProperty('--S', Spx + 'px');
    var dpr = window.devicePixelRatio || 1; maskC.width = Spx * dpr; maskC.height = Spx * dpr;
    if (game && game.phase === 'loc') placeLoc();
  }
  window.addEventListener('resize', layout);

  // ---------- session ----------
  var game = null;
  var rand = function (n) { return Math.floor(Math.random() * n); };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function posXY(idx, r) { var a = idx * Math.PI / 4; return [r * Math.sin(a), -r * Math.cos(a)]; }

  function startSession() {
    var lvl = data.level;
    game = { level: lvl, L: LEVELS[lvl], stair: S.newStair(S.START_MS), n: 0, correct: 0, phase: 'ready', trial: null, log: [] };
    var p = PAIRS[game.L.pair];
    document.querySelectorAll('.vbtn').forEach(function (b, i) { b.innerHTML = vehicleSVG(p[i]); b.setAttribute('aria-label', p[i]); });
    show('play'); layout(); setBar();
    $('tc-sign').innerHTML = signSVG('target'); $('tc-lure').classList.toggle('hidden', !(lvl >= 3 && lvl <= 5));
    $('ready').classList.remove('hidden'); hideAll();
    $('msread').textContent = Math.round(game.stair.ms) + ' ms';
  }
  function hideAll() {
    stim.classList.remove('on'); maskC.classList.remove('on'); fix.classList.remove('on');
    $('resp-vehicle').classList.add('hidden'); $('resp-loc').classList.add('hidden'); $('locprompt').classList.add('hidden'); $('fb').classList.add('hidden');
  }
  function setBar() { var p = (game.n / TRIALS * 100) + '%'; $('bar').style.width = p; $('bar').style.setProperty('--p', p); $('bar').parentNode.style.setProperty('--p', p); }

  function buildTrial() {
    var L = game.L, p = PAIRS[L.pair];
    var t = { vehicle: rand(2), pos: rand(8) };
    var s = '';
    if (L.busy) {
      for (var i = 0; i < 34; i++) {
        var x = rand(200) - 100, y = rand(200) - 100, c = ['#c9cfd9', '#d8cfb8', '#bcc9bf', '#d6c3c3'][rand(4)];
        var k = rand(3);
        if (k === 0) s += '<circle cx="' + x + '" cy="' + y + '" r="' + (3 + rand(8)) + '" fill="none" stroke="' + c + '" stroke-width="2"/>';
        else if (k === 1) s += '<rect x="' + x + '" y="' + y + '" width="' + (5 + rand(14)) + '" height="' + (4 + rand(10)) + '" fill="' + c + '" transform="rotate(' + rand(90) + ' ' + x + ' ' + y + ')"/>';
        else s += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + rand(30) - 15) + '" y2="' + (y + rand(30) - 15) + '" stroke="' + c + '" stroke-width="2.5" stroke-linecap="round"/>';
      }
    }
    var nd = L.distract[0] + rand(L.distract[1] - L.distract[0] + 1), spots = [];
    if (nd > 0) {
      for (var j = 0; j < 8; j++) if (j !== t.pos) spots.push(posXY(j, L.radius));
      var extra = [];
      for (var m = 0; m < 8; m++) extra.push(posXY(m + 0.5, L.radius));
      if (L.busy) for (var q = 0; q < 8; q++) extra.push(posXY(q + 0.5, L.radius * 0.6));
      shuffle(extra); spots = spots.concat(extra.slice(0, Math.max(0, nd - 7)));
      spots.forEach(function (xy) { s += '<g transform="translate(' + xy[0].toFixed(1) + ' ' + xy[1].toFixed(1) + ')">' + SIGNS[DISTRACT_KINDS[rand(DISTRACT_KINDS.length)]] + '</g>'; });
    }
    var txy = posXY(t.pos, L.radius);
    s += '<g transform="translate(' + txy[0].toFixed(1) + ' ' + txy[1].toFixed(1) + ')">' + SIGNS.target + '</g>';
    s += '<g transform="translate(-22 -13) scale(0.3667)">' + VEH[p[t.vehicle]]() + '</g>';
    stim.innerHTML = s;
    t.distractors = spots.length;
    return t;
  }

  function nextTrial() {
    if (game.n >= TRIALS) return finish();
    hideAll();
    game.trial = buildTrial(); game.trial.ms = game.stair.ms; game.trial.frames = S.frames(game.stair.ms, frameMs);
    game.phase = 'fix'; fix.classList.add('on');
    $('msread').textContent = Math.round(game.stair.ms) + ' ms';
    setTimeout(flash, FIX_MS);
  }
  function hold(phase, fn) { if (TEST && api.freeze === phase) { api._resume = function () { api._resume = null; fn(); }; return true; } return false; }
  function flash() {
    if (!game) return;
    var tr = game.trial, shown = 0, t0 = 0, p0 = 0;
    requestAnimationFrame(function f(ts) {
      if (!game || game.trial !== tr) return;
      if (shown === 0) { fix.classList.remove('on'); stim.classList.add('on'); game.phase = 'stimulus'; t0 = ts; p0 = performance.now(); shown = 1; requestAnimationFrame(f); return; }
      if (shown < tr.frames) { shown++; requestAnimationFrame(f); return; }
      tr.actualMs = Math.round((ts - t0) * 10) / 10; tr.perfMs = Math.round((performance.now() - p0) * 10) / 10; tr.frameMs = Math.round(frameMs * 100) / 100;
      if (hold('stimulus', endStim)) return;
      endStim();
    });
    function endStim() { stim.classList.remove('on'); showMask(); }
  }
  function drawMask() {
    var c = maskC.getContext('2d'), w = maskC.width, h = maskC.height;
    c.fillStyle = '#fbf9f4'; c.fillRect(0, 0, w, h);
    var cols = ['#1d2433', '#2d5aa8', '#f2b705', '#cfe3f5', '#8a93a6', '#e9e4d8', '#c4372f', '#5b6475'];
    for (var i = 0; i < 420; i++) {
      c.fillStyle = cols[rand(cols.length)]; c.strokeStyle = cols[rand(cols.length)];
      var x = Math.random() * w, y = Math.random() * h, r = (4 + Math.random() * 16) * w / 360, k = rand(4);
      c.beginPath();
      if (k === 0) { c.arc(x, y, r, 0, 7); c.fill(); }
      else if (k === 1) { c.save(); c.translate(x, y); c.rotate(Math.random() * 3); c.fillRect(-r, -r * .6, r * 2, r * 1.2); c.restore(); }
      else if (k === 2) { c.moveTo(x, y - r); c.lineTo(x + r, y + r); c.lineTo(x - r, y + r); c.closePath(); c.fill(); }
      else { c.lineWidth = 3 * w / 360; c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.stroke(); }
    }
  }
  function showMask() {
    drawMask(); maskC.classList.add('on'); game.phase = 'mask'; game.trial.masked = true; api.maskCount++;
    setTimeout(function () { if (hold('mask', toVehicle)) return; toVehicle(); }, MASK_MS);
  }
  function toVehicle() { if (!game) return; maskC.classList.remove('on'); game.phase = 'vehicle'; $('resp-vehicle').classList.remove('hidden'); document.querySelectorAll('.vbtn').forEach(function (b) { b.classList.remove('sel'); }); }
  function chooseVehicle(v) {
    if (!game || game.phase !== 'vehicle') return;
    game.trial.choseVehicle = v; game.phase = 'loc';
    $('resp-vehicle').classList.add('hidden'); placeLoc(); $('resp-loc').classList.remove('hidden'); $('locprompt').classList.remove('hidden');
  }
  function placeLoc() {
    var box = $('resp-loc'); box.innerHTML = '';
    var rpx = game.L.radius * Spx / 200, chord = 0.765 * rpx;
    var B = Math.max(56, Math.min(76, Math.floor(chord - 4)));
    box.style.setProperty('--B', B + 'px');
    for (var i = 0; i < 8; i++) {
      var xy = posXY(i, rpx), b = document.createElement('button');
      b.className = 'locbtn'; b.dataset.pos = i; b.textContent = i + 1; b.setAttribute('aria-label', 'Position ' + (i + 1));
      b.style.left = (Spx / 2 + xy[0]) + 'px'; b.style.top = (Spx / 2 + xy[1]) + 'px';
      b.addEventListener('click', function () { chooseLoc(+this.dataset.pos); });
      box.appendChild(b);
    }
  }
  function chooseLoc(p) {
    if (!game || game.phase !== 'loc') return;
    var t = game.trial; t.chosePos = p; game.phase = 'feedback';
    var ok = t.choseVehicle === t.vehicle && p === t.pos;
    t.correct = ok; game.n++; if (ok) game.correct++;
    var btns = $('resp-loc').children; if (btns[p]) btns[p].classList.add('sel'); if (btns[t.pos]) btns[t.pos].classList.add('right');
    $('locprompt').classList.add('hidden');
    var fb = $('fb'); fb.className = 'fb ' + (ok ? 'good' : 'bad'); fb.textContent = ok ? '✓' : '✕'; fb.setAttribute('aria-label', ok ? 'Correct' : 'Wrong');
    (ok ? sfx.good : sfx.bad)();
    S.update(game.stair, ok);
    game.log.push({ ms: t.ms, frames: t.frames, actualMs: t.actualMs, frameMs: t.frameMs, correct: ok });
    setBar();
    setTimeout(nextTrial, FB_MS);
  }
  function finish() {
    hideAll(); game.phase = 'done';
    var thr = S.threshold(game.stair.reversals, game.stair.history);
    var acc = Math.round(game.correct / game.n * 100), lvl = game.level;
    var prev = data.best[lvl], isBest = !prev || thr < prev;
    if (isBest) data.best[lvl] = thr;
    var unlocked = null;
    if (game.L.unlock && thr < game.L.unlock && data.unlocked === lvl && lvl < 5) { data.unlocked = lvl + 1; unlocked = lvl + 1; }
    bumpStreak();
    data.last = { date: londonDate(), level: lvl, ms: thr, acc: acc, reversals: game.stair.reversals.length, frameMs: Math.round(frameMs * 100) / 100 };
    data.history.push({ date: data.last.date, level: lvl, ms: thr, acc: acc });
    if (data.history.length > 365) data.history = data.history.slice(-365);
    save(); sfx.done();
    $('r-ms').textContent = thr; $('r-acc').textContent = acc + '%'; $('r-level').textContent = lvl;
    $('r-streak').querySelector('b').textContent = currentStreak();
    $('r-best').classList.toggle('hidden', !isBest || !prev && false);
    $('r-best').textContent = prev ? 'New best! (was ' + prev + ' ms)' : 'New best!';
    $('r-unlock').classList.toggle('hidden', !unlocked); if (unlocked) $('r-unlock').textContent = 'Level ' + unlocked + ' unlocked';
    api.lastResult = { threshold: thr, accuracy: acc, newBest: isBest, unlocked: unlocked };
    show('results');
  }
  function quit() { game = null; hideAll(); renderHome(); show('home'); }

  // ---------- wiring ----------
  $('play').addEventListener('click', startSession);
  $('go').addEventListener('click', function () { $('ready').classList.add('hidden'); nextTrial(); });
  $('quit').addEventListener('click', quit);
  $('again').addEventListener('click', startSession);
  $('home-btn').addEventListener('click', function () { game = null; renderHome(); show('home'); });
  document.querySelectorAll('.vbtn').forEach(function (b) { b.addEventListener('click', function () { b.classList.add('sel'); chooseVehicle(+b.dataset.v); }); });
  stage.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  var NUMPAD = { Numpad8: 0, Numpad9: 1, Numpad6: 2, Numpad3: 3, Numpad2: 4, Numpad1: 5, Numpad4: 6, Numpad7: 7, ArrowUp: 0, PageUp: 1, ArrowRight: 2, PageDown: 3, ArrowDown: 4, End: 5, ArrowLeft: 6, Home: 7 };
  document.addEventListener('keydown', function (e) {
    var k = e.key, c = e.code;
    if (c === 'KeyM') { toggleMute(); return; }
    var start = k === ' ' || k === 'Enter';
    if (cur === 'home') {
      if (start && !(document.activeElement && document.activeElement.tagName === 'SUMMARY')) { e.preventDefault(); startSession(); }
      else if (/^Digit[1-5]$/.test(c)) selectLevel(+c.slice(5));
      return;
    }
    if (cur === 'results') { if (start) { e.preventDefault(); startSession(); } else if (k === 'Escape') { renderHome(); show('home'); } return; }
    if (!game) return;
    if (k === 'Escape') { quit(); return; }
    if (game.phase === 'ready' && start) { e.preventDefault(); $('go').click(); return; }
    if (game.phase === 'vehicle') {
      if (k === 'ArrowLeft' || c === 'KeyA') { e.preventDefault(); chooseVehicle(0); }
      else if (k === 'ArrowRight' || c === 'KeyD') { e.preventDefault(); chooseVehicle(1); }
      return;
    }
    if (game.phase === 'loc') {
      var p = null;
      if (/^Digit[1-8]$/.test(c)) p = +c.slice(5) - 1;
      else if (c in NUMPAD) p = NUMPAD[c];
      else if (k in NUMPAD) p = NUMPAD[k];
      if (p !== null) { e.preventDefault(); chooseLoc(p); }
    }
  });

  // ---------- test hook ----------
  var api = { maskCount: 0, freeze: null, _resume: null, lastResult: null };
  if (TEST) {
    window.__game = api;
    api.answers = function () { return game && game.trial ? { vehicle: game.trial.vehicle, pos: game.trial.pos } : null; };
    api.phase = function () { return game ? game.phase : cur; };
    api.ms = function () { return game ? game.stair.ms : null; };
    api.stair = function () { return game ? JSON.parse(JSON.stringify(game.stair)) : null; };
    api.trialInfo = function () { return game && game.trial ? JSON.parse(JSON.stringify(game.trial)) : null; };
    api.log = function () { return game ? game.log.slice() : []; };
    api.frameMs = function () { return frameMs; };
    api.resume = function () { if (api._resume) api._resume(); };
    api.data = function () { return JSON.parse(JSON.stringify(data)); };
    api.iconSVG = ICON_SVG;
    api.vehicleSVG = vehicleSVG;
  }

  layout(); renderHome();
})();
