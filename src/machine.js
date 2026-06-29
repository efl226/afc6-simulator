// ===================== AFC-6 STATE MACHINE =====================
// Pure, framework-agnostic transition logic. Times are DEMO-SHORTENED
// (seconds) so a full cook cycle runs in ~30s.

export const DUAL = new Set([
  'air fry', 'bake', 'roast', 'wings', 'recrisp', 'toast', 'veggies', 'frozen snacks', 'fries', 'max crisp',
]);

export const PRESETS = {
  'air fry': { t: 25, T: 400 }, bake: { t: 45, T: 350 }, roast: { t: 40, T: 380 }, broil: { t: 25, T: 450 },
  wings: { t: 36, T: 400 }, recrisp: { t: 20, T: 375 }, toast: { t: 14, T: 400 },
  veggies: { t: 24, T: 375 }, 'frozen snacks': { t: 26, T: 400 }, fries: { t: 30, T: 400 },
  'max crisp': { t: 24, T: 450 }, 'keep warm': { t: 60, T: 165 },
};

export const AUTO_OFF = 120, KEEP_WARM = 25, BASKET_TO = 25;
export const COOK = ['running', 'paused', 'basketOut', 'shakeAlert', 'shakeWaiting'];

export const initCtx = {
  fn: null, dual: false, time: 0, temp: 0, rem: 0, total: 0,
  shake: false, shaken: false, light: 2, vol: true, basket: true, last: null, fav: null,
};

const PERSIST = (C) => ({ light: C.light, vol: C.vol, last: C.last, fav: C.fav, basket: C.basket });
const reset   = (C) => ({ ...initCtx, ...PERSIST(C) });

const clampT = (t) => Math.min(450, Math.max(120, t));

export const fmt = (s) => {
  s = Math.max(0, Math.round(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

export const PRETTY = {
  off: 'OFF', idle: 'IDLE', set: 'SET', running: 'COOKING', paused: 'PAUSED',
  basketOut: 'BASKET OUT', shakeAlert: 'SHAKE ALERT', shakeWaiting: 'SHAKE WAIT', done: 'DONE',
};

// Pure transition: (state, context, event, arg) → { S, C, msg }
export function transition(S, C0, ev, arg) {
  let C = { ...C0 }, msg = '';

  // ---- global events ----
  if (ev === 'LIGHT_TOGGLE')  { C.light = (C.light + 1) % 3; return { S, C, msg }; }
  if (ev === 'VOLUME_TOGGLE') { C.vol = !C.vol;              return { S, C, msg }; }
  if (ev === 'POWER_OFF')     { return { S: 'off', C, msg }; }

  if ((ev === 'BASKET_REMOVED' || ev === 'BASKET_INSERTED') && !COOK.includes(S)) {
    C.basket = ev === 'BASKET_INSERTED';
    return { S, C, msg };
  }

  // ---- helpers ----
  const setFn  = (fn) => { C.fn = fn; C.dual = DUAL.has(fn); C.time = PRESETS[fn].t; C.temp = PRESETS[fn].T; };
  const recall = (o)  => { if (o) { C.fn = o.fn; C.time = o.time; C.temp = o.temp; C.dual = o.dual; } };

  switch (S) {

    // ---- OFF ----
    case 'off':
      if (ev === 'POWER') { C = reset(C); S = 'idle'; }
      break;

    // ---- IDLE ----
    case 'idle':
      if      (ev === 'SELECT_FUNCTION')       { setFn(arg); S = 'set'; }
      else if (ev === 'ADJUST_TIME')           { C.time = Math.max(0, C.time + arg); S = 'set'; }
      else if (ev === 'ADJUST_TEMP')           { C.temp = clampT(C.temp + arg); S = 'set'; }
      else if (ev === 'LAST_COOK' && C.last)   { recall(C.last); S = 'set'; }
      else if (ev === 'FAVORITE' && C.fav)     { recall(C.fav);  S = 'set'; }
      else if (ev === 'AUTO_OFF')              { S = 'off'; }
      break;

    // ---- SET (configure cook) ----
    case 'set':
      if      (ev === 'SELECT_FUNCTION')       setFn(arg);
      else if (ev === 'ADJUST_TIME')           { C.time = Math.max(0, C.time + arg); }
      else if (ev === 'ADJUST_TEMP')           { C.temp = clampT(C.temp + arg); }
      else if (ev === 'TOGGLE_SHAKE')          C.shake = !C.shake;
      else if (ev === 'LAST_COOK' && C.last)   recall(C.last);
      else if (ev === 'FAVORITE' && C.fav)     recall(C.fav);
      else if (ev === 'SAVE_FAVORITE')         { C.fav = { fn: C.fn, time: C.time, temp: C.temp, dual: C.dual }; msg = '★ Favorite saved'; }
      else if (ev === 'START') {
        if (C.basket && C.time > 0) {
          C.rem = C.time; C.total = C.time; C.shaken = false;
          C.last = { fn: C.fn, time: C.time, temp: C.temp, dual: C.dual };
          S = 'running';
        } else msg = C.basket ? 'Set a time first' : 'Lock the basket in';
      }
      else if (ev === 'AUTO_OFF') S = 'off';
      break;

    // ---- RUNNING (cooking) ----
    case 'running':
      if (ev === 'TICK') {
        C.rem--;
        if (C.rem <= 0) S = 'done';
        else if (C.shake && !C.shaken && C.rem <= Math.ceil(C.total / 2)) { C.shaken = true; S = 'shakeAlert'; }
      }
      else if (ev === 'PAUSE')                   S = 'paused';
      else if (ev === 'START' || ev === 'STOP')  { C = reset(C); S = 'idle'; }
      else if (ev === 'BASKET_REMOVED')          { C.basket = false; S = 'basketOut'; }
      break;

    // ---- SHAKE CYCLE ----
    case 'shakeAlert':
      if (ev === 'BASKET_REMOVED') { C.basket = false; S = 'shakeWaiting'; }
      break;
    case 'shakeWaiting':
      if (ev === 'BASKET_INSERTED') { C.basket = true; S = 'running'; }
      break;

    // ---- PAUSED ----
    case 'paused':
      if      (ev === 'START' || ev === 'PAUSE') S = 'running';
      else if (ev === 'STOP')                    { C = reset(C); S = 'idle'; }
      else if (ev === 'ADJUST_TIME')             { C.rem = Math.max(0, C.rem + arg); }
      else if (ev === 'ADJUST_TEMP')             { C.temp = clampT(C.temp + arg); }
      else if (ev === 'BASKET_REMOVED')          { C.basket = false; S = 'basketOut'; }
      break;

    // ---- BASKET OUT ----
    case 'basketOut':
      if      (ev === 'BASKET_INSERTED') { C.basket = true; S = 'running'; }
      else if (ev === 'BASKET_TIMEOUT')  { C = reset(C); S = 'idle'; }
      break;

    // ---- DONE ----
    case 'done':
      if      (ev === 'POWER' || ev === 'STOP' || ev === 'START') { C = reset(C); S = 'idle'; }
      else if (ev === 'SELECT_FUNCTION')                          { C = reset(C); setFn(arg); S = 'set'; }
      else if (ev === 'KEEP_WARM')                                { C = reset(C); S = 'idle'; }
      break;

    default: break;
  }
  return { S, C, msg };
}

// ---- reducer (adds log / flash / message bookkeeping) ----
export const init = { S: 'off', C: initCtx, log: [], lastEv: '—', flash: { k: '', n: 0 }, msg: '', acts: 0 };

export function reducer(st, a) {
  if (a.type === 'CLEARMSG') return st.msg ? { ...st, msg: '' } : st;
  if (a.type !== 'SEND') return st;
  const prev = st.S;
  const r = transition(st.S, st.C, a.ev, a.arg);
  const log = a.ev === 'TICK' ? st.log : [...st.log, { ev: a.ev, from: prev, to: r.S }].slice(-60);
  return {
    S: r.S, C: r.C, log, lastEv: a.ev,
    flash: { k: prev + '>' + r.S, n: st.flash.n + 1 },
    msg: r.msg !== undefined ? r.msg : st.msg,
    acts: st.acts + 1,
  };
}
