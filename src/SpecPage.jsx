// ===================== AFC-6 ENGINEERING REFERENCE =====================
// Full-coverage state-by-state walkthrough of the panel, generated from
// real screenshots of the live prototype. Built for engineering handoff —
// every state, every error, every automatic timeout.

const SHOT = (name) => `./spec-shots/${name}.png`

// Control touch-point positions — must match src/components/Panel.jsx exactly.
const POS = {
  power: [20, 14], volume: [34, 14], favorite: [66, 14], lastCook: [80, 14],
  airFry: [14, 31], bake: [28, 31], broil: [42, 31], roast: [55, 31], recrisp: [69, 31], maxCrisp: [83, 31],
  toast: [14, 44], fries: [31, 44], wings: [49, 44], frozenSnacks: [66, 44], veggies: [83, 44],
  shake: [14, 63], tempUp: [30, 57], tempDn: [30, 69], display: [49.9, 63], timeUp: [68, 57], timeDn: [68, 69],
  keepWarm: [83, 63], pause: [30, 87], startStop: [49.9, 87], light: [68, 87],
}

function Touch({ at, label }) {
  const [x, y] = at
  return (
    <div className="spec-touch" style={{ left: x + '%', top: y + '%' }}>
      <span className="spec-touch-dot" />
      {label && <span className="spec-touch-label">{label}</span>}
    </div>
  )
}

function Card({ id, title, badge, status, desc, touches, out }) {
  return (
    <div className="spec-card">
      <div className="spec-shot">
        <img src={SHOT(id)} alt={title} draggable={false} />
        {touches && touches.map((t, i) => <Touch key={i} {...t} />)}
      </div>
      <div className="spec-info">
        <div className="spec-title-row">
          <h3>{title}</h3>
          {badge && <span className={'spec-badge ' + badge.type}>{badge.text}</span>}
        </div>
        {status && <div className="spec-status">STATUS: <b>{status}</b></div>}
        <p className="spec-desc">{desc}</p>
        {out && out.length > 0 && (
          <div className="spec-out">
            {out.map((o, i) => (
              <div key={i} className={'spec-out-row out-' + o.kind}>
                <span className="oo-icon">{o.kind === 'auto' ? '⏱' : o.kind === 'sensor' ? '◇' : '☞'}</span>
                <span className="oo-event">{o.event}</span>
                <span className="oo-arrow">→</span>
                <span className="oo-dest">{o.dest}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ n, title, note, children }) {
  return (
    <section className="spec-section">
      <div className="spec-section-head">
        <span className="spec-section-n">{n}</span>
        <h2>{title}</h2>
      </div>
      {note && <p className="spec-section-note">{note}</p>}
      <div className="spec-grid">{children}</div>
    </section>
  )
}

export default function SpecPage() {
  return (
    <div className="spec-page">
      <header className="spec-header">
        <h1>AFC&#8209;6 — STATE MACHINE REFERENCE</h1>
        <p className="spec-sub">Full coverage of every screen, every touch point, every error. For engineering use.</p>
        <div className="spec-legend">
          <span><i className="leg-dot leg-touch">1</i> touch a control</span>
          <span><i className="leg-dot leg-auto">⏱</i> automatic — no touch, happens after a wait</span>
          <span><i className="leg-dot leg-sensor">◇</i> basket sensor — no touch, basket in/out</span>
        </div>
      </header>

      <Section n="1" title="NORMAL COOK CYCLE" note="The main path: power on, pick a food, cook, done.">
        <Card id="01-off" title="OFF" status="STANDBY"
          desc="Display is dark. Only the power button is visible and lit."
          touches={[{ at: POS.power, n: 1, label: 'tap power' }]}
          out={[{ kind: 'touch', event: 'POWER (tap)', dest: 'IDLE' }]} />
        <Card id="02-idle" title="IDLE" status="READY"
          desc="Power is on. Machine is ready. All function buttons are lit and selectable. No timer is set yet."
          touches={[{ at: POS.wings, n: 1, label: 'pick a food' }]}
          out={[
            { kind: 'touch', event: 'pick a food button', dest: 'SET (food selected)' },
            { kind: 'touch', event: 'press a TIME/TEMP arrow', dest: 'SET (manual)' },
            { kind: 'auto', event: '120 sec, no touch', dest: 'OFF' },
          ]} />
        <Card id="03-set-preset" title="SET — food selected" status="WINGS — PRESS START"
          desc="A food was selected (Wings shown). Time and temp are filled in automatically. Display shows temp, then alternates with time for a few seconds so the user sees both."
          touches={[{ at: POS.startStop, n: 1, label: 'tap START' }]}
          out={[
            { kind: 'touch', event: 'START', dest: 'COOKING' },
            { kind: 'touch', event: 'pick a different food', dest: 'SET (new food)' },
            { kind: 'touch', event: 'TIME/TEMP arrows', dest: 'stays in SET, value updates' },
            { kind: 'auto', event: '120 sec, no touch', dest: 'OFF' },
          ]} />
        <Card id="08-running" title="COOKING" status="COOKING"
          desc="Heat is on, timer counts down every second. Selected food name stays bright. All other foods are hidden (not just dimmed) so nothing else can be touched by accident."
          touches={[{ at: POS.pause, n: 1, label: 'tap to pause' }]}
          out={[
            { kind: 'auto', event: 'timer reaches 0:00', dest: 'DONE' },
            { kind: 'auto', event: 'timer reaches midpoint (if SHAKE armed)', dest: 'SHAKE ALERT' },
            { kind: 'touch', event: 'PAUSE', dest: 'PAUSED' },
            { kind: 'touch', event: 'START/STOP', dest: 'cancels — back to IDLE' },
            { kind: 'sensor', event: 'basket pulled out', dest: 'BASKET OUT' },
            { kind: 'touch', event: 'TIME/TEMP arrows', dest: 'value updates live, no need to pause' },
          ]} />
        <Card id="14-done" title="DONE" status="ENJOY" badge={{ type: 'warn', text: 'KNOWN ISSUE' }}
          desc="Cook finished. Machine beeps. After 25 sec with no touch, it quietly resets itself (keep-warm timeout). ⚠ Display currently shows the ORIGINAL set time (e.g. 00:36) instead of 00:00 — it is showing the saved cook time, not the remaining time. Needs a fix: DONE should display 00:00 or a dedicated 'done' indicator."
          touches={[{ at: POS.startStop, n: 1, label: 'tap to restart' }]}
          out={[
            { kind: 'touch', event: 'START / STOP / POWER', dest: 'resets — back to IDLE' },
            { kind: 'touch', event: 'pick a new food', dest: 'SET (new food)' },
            { kind: 'auto', event: '25 sec, no touch', dest: 'IDLE' },
          ]} />
      </Section>

      <Section n="2" title="SET WITHOUT PICKING A FOOD (MANUAL)" note="A user can set time and temp by hand, without choosing a preset food.">
        <Card id="04-set-manual" title="SET — manual entry" status="MANUAL — PRESS START"
          desc="No food button was pressed — user adjusted TEMP and TIME arrows directly. No food name is highlighted. Dual-heat indicator stays off since no preset was chosen."
          touches={[{ at: POS.tempUp, n: 1, label: 'temp arrow' }, { at: POS.timeUp, n: 2, label: 'time arrow' }]}
          out={[{ kind: 'touch', event: 'START (if time > 0)', dest: 'COOKING' }]} />
      </Section>

      <Section n="3" title="PAUSE / RESUME">
        <Card id="10-paused" title="PAUSED" status="PAUSED"
          desc="Cooking is frozen. Pause button turns fully white. Digits on the display blink on/off (hard cut, not a fade) so it's obvious nothing is moving. Time/temp can still be adjusted while paused."
          touches={[{ at: POS.startStop, n: 1, label: 'tap to resume' }]}
          out={[
            { kind: 'touch', event: 'START or PAUSE', dest: 'resumes — back to COOKING' },
            { kind: 'touch', event: 'START/STOP held / STOP', dest: 'cancels — back to IDLE' },
            { kind: 'sensor', event: 'basket pulled out', dest: 'BASKET OUT' },
          ]} />
      </Section>

      <Section n="4" title="BASKET REMOVED MID-COOK" note="Pulling the basket out always auto-pauses cooking, whether running or already paused.">
        <Card id="11-basket-out" title="BASKET OUT" status="BASKET OUT"
          desc="Basket sensor detected the basket was pulled out during a cook. Heat stops automatically. Waits for the basket to be reinserted."
          touches={null}
          out={[
            { kind: 'sensor', event: 'basket reinserted', dest: 'resumes — back to COOKING' },
            { kind: 'auto', event: '25 sec, basket still out', dest: 'resets — back to IDLE' },
          ]} />
      </Section>

      <Section n="5" title="SHAKE REMINDER CYCLE" note="Only happens if SHAKE is armed for the selected food. Defaults ON for Air Fry, Fries, Wings, Frozen Snacks, Veggies, Toast — OFF for everything else. The machine remembers the user's last choice per food after that.">
        <Card id="12-shake-alert" title="SHAKE ALERT" status="SHAKE NOW"
          desc="Cook reached the halfway point with SHAKE armed. Shake icon lights up fully to prompt the user to pull the basket and shake the food."
          touches={null}
          out={[{ kind: 'sensor', event: 'basket pulled out', dest: 'SHAKE WAITING' }]} />
        <Card id="13-shake-waiting" title="SHAKE WAITING" status="REINSERT BASKET"
          desc="Basket is out for shaking. Machine waits here — no timeout, no auto-cancel. Stays paused until the basket goes back in."
          touches={null}
          out={[{ kind: 'sensor', event: 'basket reinserted', dest: 'resumes — back to COOKING' }]} />
      </Section>

      <Section n="6" title="ERRORS — REJECTED ACTIONS" note="Pressing START doesn't always work. These two messages explain why, shown for about 2 seconds on the status line below the panel.">
        <Card id="05-error-no-time" title="ERROR — no time set" badge={{ type: 'err', text: 'REJECTED' }}
          status="SET A TIME FIRST"
          desc="START was pressed but time is still 0:00 (no food picked, no manual time entered). Machine refuses to start and shows this message. State stays in SET."
          touches={[{ at: POS.startStop, n: 1, label: 'START (rejected)' }]}
          out={[]} />
        <Card id="06-error-basket" title="ERROR — basket not locked in" badge={{ type: 'err', text: 'REJECTED' }}
          status="LOCK THE BASKET IN"
          desc="START was pressed but the basket sensor reports the basket is out. Machine refuses to start. State stays in SET."
          touches={[{ at: POS.startStop, n: 1, label: 'START (rejected)' }]}
          out={[]} />
      </Section>

      <Section n="7" title="CONFIRMATIONS & FEEDBACK" note="Brief on-screen confirmations for actions that don't change state.">
        <Card id="07-favorite-saved" title="FAVORITE SAVED" badge={{ type: 'ok', text: 'CONFIRMATION' }}
          status="★ FAVORITE SAVED"
          desc="Holding the Favorite button for 650ms+ (instead of a quick tap) saves the current food/time/temp as the one-touch favorite. Confirmation shows for ~2 seconds."
          touches={[{ at: POS.favorite, n: 1, label: 'hold 650ms+' }]}
          out={[]} />
        <Card id="09-volume-flash" title="VOLUME LEVEL" badge={{ type: 'ok', text: 'FEEDBACK' }}
          status="READY"
          desc="Tapping Volume cycles LOW → MED → HIGH. The level name flashes on the 4-digit display for 1 second (instant on, no fade) so the user can read it, then the display returns to whatever it was showing before."
          touches={[{ at: POS.volume, n: 1, label: 'tap volume' }]}
          out={[]} />
      </Section>

      <Section n="8" title="AUTOMATIC TIMEOUTS — SUMMARY" note="These never need a screenshot of their own — they always land on a screen already shown above. Listed here for completeness.">
        <table className="spec-table">
          <thead><tr><th>FROM STATE</th><th>WAIT</th><th>RESULT</th></tr></thead>
          <tbody>
            <tr><td>IDLE or SET</td><td>120 sec, no touch</td><td>→ OFF</td></tr>
            <tr><td>DONE</td><td>25 sec, no touch (keep-warm)</td><td>→ IDLE</td></tr>
            <tr><td>BASKET OUT</td><td>25 sec, basket still out</td><td>→ IDLE (cook cancelled)</td></tr>
          </tbody>
        </table>
      </Section>

      <Section n="9" title="ALWAYS AVAILABLE — GLOBAL CONTROLS" note="These three work from any state, any time, and never appear as a separate screenshot since they don't change the cook state.">
        <table className="spec-table">
          <thead><tr><th>CONTROL</th><th>ACTION</th><th>RESULT</th></tr></thead>
          <tbody>
            <tr><td>POWER</td><td>hold 650ms+</td><td>→ OFF, from any state</td></tr>
            <tr><td>LIGHT</td><td>tap</td><td>toggles interior light on/off — no effect on cooking</td></tr>
            <tr><td>VOLUME</td><td>tap</td><td>cycles LOW/MED/HIGH — see Section 7</td></tr>
          </tbody>
        </table>
      </Section>

      <footer className="spec-footer">
        Generated from the live prototype. Source: machine.js (state logic) + Panel.jsx (UI).
      </footer>
    </div>
  )
}
