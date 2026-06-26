import { COOK, fmt, PRETTY } from '../machine.js'

const AVAIL = {
  off: ['POWER (on)'],
  idle: ['select preset', 'adjust time/temp', 'LAST COOK*', 'FAVORITE*'],
  set: ['select preset', 'adjust', 'toggle SHAKE', 'START', 'SAVE FAV', 'LAST/FAV'],
  running: ['PAUSE (pause)', 'START/STOP (cancel)', 'adjust', '+30s', 'remove basket'],
  shakeAlert: ['remove basket → shake'],
  shakeWaiting: ['insert basket → resume'],
  paused: ['START/STOP (resume)', 'PAUSE (resume)', 'remove basket'],
  basketOut: ['insert basket', '⏱ timeout→SET'],
  done: ['POWER/STOP→SET', 'select preset', '⏱ keep-warm→IDLE'],
}

export default function Telemetry({ S, C }) {
  const cooking = COOK.includes(S)
  return (
    <>
      <div className="card reveal" style={{ animationDelay: '.22s' }}>
        <h2>Machine State</h2>
        <div className="kv-h">
          <div className="kv-col">
            <span className="k">state</span>
            <span className="v hot">{PRETTY[S]}</span>
          </div>
          <div className="kv-col">
            <span className="k">function</span>
            <span className="v">{C.fn || '—'}</span>
          </div>
          <div className="kv-col">
            <span className="k">dual heat</span>
            <span className={'v' + (C.dual && S !== 'off' ? ' hot' : '')}>{C.dual && S !== 'off' ? 'ON' : 'off'}</span>
          </div>
          <div className="kv-col">
            <span className="k">time / temp</span>
            <span className="v">{fmt(cooking ? C.rem : C.time)} · {S === 'off' ? '—' : C.temp + '°F'}</span>
          </div>
          <div className="kv-col">
            <span className="k">shake</span>
            <span className="v">{C.shake ? 'yes' : 'no'}</span>
          </div>
          <div className="kv-col">
            <span className="k">basket</span>
            <span className={'v' + (!C.basket ? ' warn' : '')}>{C.basket ? 'locked' : 'REMOVED'}</span>
          </div>
          <div className="kv-col">
            <span className="k">bright / vol</span>
            <span className="v">{['50%', '75%', '100%'][C.light]} / {C.vol ? 'on' : 'off'}</span>
          </div>
        </div>
      </div>
      <div className="card reveal" style={{ animationDelay: '.3s' }}>
        <h2>Available Now</h2>
        <div className="avail">
          {(AVAIL[S] || []).map((e, i) => (
            <span key={i} className={'pill' + (e.indexOf('⏱') >= 0 ? ' auto' : '')}>{e}</span>
          ))}
          <span className="pill glob">POWER_OFF (hold)</span>
          <span className="pill glob">LIGHT</span>
          <span className="pill glob">VOLUME</span>
        </div>
      </div>
    </>
  )
}
