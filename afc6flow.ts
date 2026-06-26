import { setup, assign } from 'xstate';

const DUAL_HEAT = new Set([
  'air fry','bake','roast','wings','recrisp','toast','veggies','frozen snacks','fries','max crisp',
]);
const PRESETS: Record<string, { time: number; temp: number }> = {
  'air fry': { time: 900, temp: 400 }, 'bake': { time: 1500, temp: 350 },
  'roast': { time: 1800, temp: 380 }, 'broil': { time: 600, temp: 450 },
  'wings': { time: 1320, temp: 400 }, 'recrisp': { time: 300, temp: 375 },
  'toast': { time: 240, temp: 400 }, 'veggies': { time: 720, temp: 375 },
  'frozen snacks': { time: 720, temp: 400 }, 'fries': { time: 900, temp: 400 },
  'max crisp': { time: 600, temp: 450 },
  'keep warm': { time: 1800, temp: 165 },   // TBD: keep-warm may be CONTINUOUS (no countdown) — unresolved
};

// POWER-LOSS = RESET: the machine boots to `off` and does NOT persist cook state,
// so any power interruption restarts fresh (no auto-resume). Per spec.

export const airFryerMachine = setup({
  types: {
    context: {} as {
      selectedFn: string | null;
      dualHeat: boolean;        // drives the DUAL HEAT ICON (lit=true, dark=false)
      time: number; temp: number; remaining: number; total: number;
      shakeReminder: boolean; shaken: boolean;
      light: boolean; volume: boolean; basketLocked: boolean;
      lastCook: { fn: string|null; time: number; temp: number; dualHeat: boolean } | null;
      favorite: { fn: string|null; time: number; temp: number; dualHeat: boolean } | null;
    },
    events: {} as
      | { type: 'POWER' } | { type: 'POWER_OFF' }
      | { type: 'SELECT_FUNCTION'; fn: string }
      | { type: 'ADJUST_TIME'; delta: number } | { type: 'ADJUST_TEMP'; delta: number }
      | { type: 'TOGGLE_SHAKE' } | { type: 'LAST_COOK' }
      | { type: 'FAVORITE' }          // tap = recall
      | { type: 'SAVE_FAVORITE' }     // hold = save current as favorite  ← NEW
      | { type: 'START' } | { type: 'PAUSE' } | { type: 'STOP' } | { type: 'ADD_30' }
      | { type: 'BASKET_REMOVED' } | { type: 'BASKET_INSERTED' }
      | { type: 'LIGHT_TOGGLE' } | { type: 'VOLUME_TOGGLE' },
  },

  actions: {
    setFunction: assign(({ event }) => {
      const fn = (event as any).fn; const p = PRESETS[fn] ?? { time: 0, temp: 350 };
      return { selectedFn: fn, dualHeat: DUAL_HEAT.has(fn), time: p.time, temp: p.temp };
    }),
    resetSelection: assign({ selectedFn: null, dualHeat: false, time: 0, temp: 350, remaining: 0, shakeReminder: false, shaken: false }),
    // Adjusting a value BLANKS the preset label (selectedFn -> null).
    // NOTE: dualHeat is KEPT (a tweaked dual-heat cook is still dual heat) — CONFIRM if you'd rather it go dark.
    adjustTime:      assign({ time: ({ context, event }) => Math.max(0, context.time + (event as any).delta), selectedFn: null }),
    adjustTemp:      assign({ temp: ({ context, event }) => Math.min(450, Math.max(120, context.temp + (event as any).delta)), selectedFn: null }),
    adjustRemaining: assign({ remaining: ({ context, event }) => Math.max(0, context.remaining + (event as any).delta), selectedFn: null }),
    add30:           assign({ remaining: ({ context }) => context.remaining + 30 }),
    toggleShake:     assign({ shakeReminder: ({ context }) => !context.shakeReminder }),
    recallLast:      assign(({ context }) => ({ selectedFn: context.lastCook!.fn, time: context.lastCook!.time, temp: context.lastCook!.temp, dualHeat: context.lastCook!.dualHeat })),
    recallFavorite:  assign(({ context }) => ({ selectedFn: context.favorite!.fn, time: context.favorite!.time, temp: context.favorite!.temp, dualHeat: context.favorite!.dualHeat })),
    saveFavorite:    assign({ favorite: ({ context }) => ({ fn: context.selectedFn, time: context.time, temp: context.temp, dualHeat: context.dualHeat }) }),  // ← NEW (hold)
    beginCook:       assign(({ context }) => ({ remaining: context.time, total: context.time, shaken: false, lastCook: { fn: context.selectedFn, time: context.time, temp: context.temp, dualHeat: context.dualHeat } })),
    tick:            assign({ remaining: ({ context }) => context.remaining - 1 }),
    markShaken:      assign({ shaken: true }),
    toggleLight:     assign({ light: ({ context }) => !context.light }),
    toggleVolume:    assign({ volume: ({ context }) => !context.volume }),
    setBasketOut:    assign({ basketLocked: false }),
    setBasketIn:     assign({ basketLocked: true }),

    // hardware effects — ENGINEERS IMPLEMENT:
    startHeat:  () => {/* elements + fan ON; dualHeat -> both elements else single */},
    stopHeat:   () => {/* elements + fan OFF */},
    doneBeep:   () => {/* completion chime (respect volume) */},
    shakeAlarm: () => {/* SHAKE alarm + flash; heat paused */},
    startError: () => {/* refuse start: error tone + "LOCK BASKET" / "SET TIME" */},
  },

  guards: {
    canStart:    ({ context }) => context.basketLocked && context.time > 0,
    timeUp:      ({ context }) => context.remaining <= 1,
    // TBD: +time mid-cook does NOT currently move this midpoint (fixed at start). Revisit.
    shakeDue:    ({ context }) => context.shakeReminder && !context.shaken && context.remaining <= Math.ceil(context.total / 2),
    hasLastCook: ({ context }) => context.lastCook !== null,
    hasFavorite: ({ context }) => context.favorite !== null,
  },

  delays: { TICK: 1000, KEEP_WARM: 300000, BASKET_TIMEOUT: 120000, AUTO_OFF: 600000 },
}).createMachine({
  id: 'airFryer',
  initial: 'off',
  context: {
    selectedFn: null, dualHeat: false, time: 0, temp: 350, remaining: 0, total: 0,
    shakeReminder: false, shaken: false, light: false, volume: true, basketLocked: true,
    lastCook: null, favorite: null,
  },

  on: {
    POWER_OFF:       '#off',
    LIGHT_TOGGLE:    { actions: 'toggleLight' },
    VOLUME_TOGGLE:   { actions: 'toggleVolume' },
    BASKET_REMOVED:  { actions: 'setBasketOut' },   // cooking states override w/ transitions
    BASKET_INSERTED: { actions: 'setBasketIn' },
  },

  states: {
    off: { id: 'off', on: { POWER: '#idle' } },

    powered: {
      id: 'powered', initial: 'idle',
      states: {

        idle: {
          id: 'idle', entry: 'resetSelection',
          after: { AUTO_OFF: '#off' },                 // ← NEW: inactivity auto-shutoff (resets on input)
          on: {
            SELECT_FUNCTION: { target: '#set', actions: 'setFunction' },
            ADJUST_TIME:     { target: '#set', actions: 'adjustTime' },
            ADJUST_TEMP:     { target: '#set', actions: 'adjustTemp' },
            LAST_COOK:       { target: '#set', guard: 'hasLastCook', actions: 'recallLast' },
            FAVORITE:        { target: '#set', guard: 'hasFavorite', actions: 'recallFavorite' },
          },
        },

        set: {
          id: 'set',
          after: { AUTO_OFF: '#off' },                 // ← NEW
          on: {
            SELECT_FUNCTION: { actions: 'setFunction' },
            ADJUST_TIME:     { actions: 'adjustTime' },   // blanks preset
            ADJUST_TEMP:     { actions: 'adjustTemp' },   // blanks preset
            TOGGLE_SHAKE:    { actions: 'toggleShake' },
            LAST_COOK:       { guard: 'hasLastCook', actions: 'recallLast' },
            FAVORITE:        { guard: 'hasFavorite', actions: 'recallFavorite' },
            SAVE_FAVORITE:   { actions: 'saveFavorite' }, // ← NEW: hold to set new favorite
            START: [
              { guard: 'canStart', target: '#cooking', actions: 'beginCook' },
              { actions: 'startError' },                  // basket unlocked OR no time
            ],
          },
        },

        cooking: {
          id: 'cooking', entry: 'startHeat', exit: 'stopHeat', initial: 'running',
          // NOTE: function CANNOT be changed mid-cook (SELECT_FUNCTION not handled here).
          states: {
            running: {
              id: 'running',
              after: {
                TICK: [
                  { guard: 'timeUp',   target: '#done' },
                  { guard: 'shakeDue', target: '#shakeAlert', actions: 'markShaken' },
                  { target: 'running', actions: 'tick', reenter: true },
                ],
              },
              on: {
                PAUSE:          '#paused',
                STOP:           '#set',                 // ← CHANGED: Stop returns to SET (keeps settings)
                ADJUST_TIME:    { actions: 'adjustRemaining' },
                ADJUST_TEMP:    { actions: 'adjustTemp' },
                ADD_30:         { actions: 'add30' },
                BASKET_REMOVED: { target: '#basketOut', actions: 'setBasketOut' },
              },
            },
            shakeAlert: {
              id: 'shakeAlert', entry: 'shakeAlarm',
              on: { BASKET_REMOVED: { target: '#shakeWaiting', actions: 'setBasketOut' } },
            },
            shakeWaiting: {
              id: 'shakeWaiting',
              on: { BASKET_INSERTED: { target: '#running', actions: 'setBasketIn' } },
            },
            paused: {
              id: 'paused',
              on: {
                START:          '#running',
                PAUSE:          '#running',
                STOP:           '#set',                 // ← CHANGED
                BASKET_REMOVED: { target: '#basketOut', actions: 'setBasketOut' },
              },
            },
            basketOut: {
              id: 'basketOut',
              after: { BASKET_TIMEOUT: '#set' },        // ← CHANGED: safety cancel returns to SET
              on: { BASKET_INSERTED: { target: '#running', actions: 'setBasketIn' } },
            },
          },
        },

        done: {
          id: 'done', entry: 'doneBeep',
          after: { KEEP_WARM: '#idle' },                // times out to fresh idle
          on: {
            POWER:           '#set',                    // ← CHANGED: dismiss keeps settings
            STOP:            '#set',                     // ← CHANGED
            SELECT_FUNCTION: { target: '#set', actions: 'setFunction' },
          },
        },
      },
    },
  },
});