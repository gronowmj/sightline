// Sightline staircase + threshold logic (pure, shared by app and unit tests)
(function (root) {
  var MIN_MS = 17, MAX_MS = 1000, START_MS = 500, DOWN = 0.85, UP = 1.15, N_REV = 6;
  function clamp(ms) { return Math.max(MIN_MS, Math.min(MAX_MS, ms)); }
  function newStair(start) { return { ms: clamp(start || START_MS), streak: 0, dir: 0, reversals: [], history: [] }; }
  // 2-down / 1-up. Returns the updated staircase (mutates s).
  function update(s, correct) {
    var prev = s.ms, move = 0;
    s.history.push({ ms: prev, correct: !!correct });
    if (correct) { s.streak++; if (s.streak >= 2) { s.streak = 0; move = -1; } }
    else { s.streak = 0; move = 1; }
    if (move) {
      if (s.dir !== 0 && move !== s.dir) s.reversals.push(prev);
      s.dir = move;
      s.ms = clamp(move < 0 ? prev * DOWN : prev * UP);
    }
    return s;
  }
  // Threshold = mean of last 6 reversal points; fewer than 6 -> mean of all reversals
  // (needs >=2); otherwise mean of the last 6 trial display times.
  function threshold(reversals, history) {
    var r = reversals || [];
    if (r.length >= 2) { var t = r.slice(-N_REV); return Math.round(t.reduce(function (a, b) { return a + b; }, 0) / t.length); }
    var h = (history || []).slice(-N_REV).map(function (x) { return typeof x === 'number' ? x : x.ms; });
    if (!h.length) return null;
    return Math.round(h.reduce(function (a, b) { return a + b; }, 0) / h.length);
  }
  function frames(ms, frameMs) { return Math.max(1, Math.round(ms / frameMs)); }
  var api = { MIN_MS: MIN_MS, MAX_MS: MAX_MS, START_MS: START_MS, DOWN: DOWN, UP: UP, N_REV: N_REV, clamp: clamp, newStair: newStair, update: update, threshold: threshold, frames: frames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SLStair = api;
})(this);
