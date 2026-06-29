import { useReducer, useEffect, useRef, useState } from 'react'
import { reducer, init, COOK, fmt, PRETTY, AUTO_OFF, KEEP_WARM, BASKET_TO } from './machine.js'
import Panel from './components/Panel.jsx'

const AVAIL = {
  off: ['POWER (on)'],
  idle: ['Select Function/Preset', 'ADJUST TIME/TEMP', 'LAST COOK*', 'FAVORITE*'],
  set: ['Select Function/Preset', 'ADJUST TIME/TEMP', 'TOGGLE SHAKE', 'START', 'SAVE FAV', 'LAST/FAV'],
  running: ['PAUSE (pause)', 'START/STOP (cancel)', 'ADJUST TIME/TEMP', '+30s', 'REMOVE BASKET'],
  shakeAlert: ['REMOVE BASKET → shake'],
  shakeWaiting: ['INSERT BASKET → resume'],
  paused: ['START/STOP (resume)', 'PAUSE (resume)', 'REMOVE BASKET'],
  basketOut: ['INSERT BASKET', '⏱ timeout → SET'],
  done: ['POWER/STOP → SET', 'Select Function/Preset', '⏱ KEEP_WARM → IDLE'],
}

export default function PanelPage() {
  const [st, dispatch] = useReducer(reducer, init)
  const send = (ev, arg) => dispatch({ type: 'SEND', ev, arg })
  const sendRef = useRef(send)
  sendRef.current = send

  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  useEffect(() => {
    if (st.S !== 'running') return
    const id = setInterval(() => sendRef.current('TICK'), 1000)
    return () => clearInterval(id)
  }, [st.S])

  useEffect(() => {
    let id
    if (st.S === 'idle' || st.S === 'set') id = setTimeout(() => sendRef.current('AUTO_OFF'), AUTO_OFF * 1000)
    else if (st.S === 'done') id = setTimeout(() => sendRef.current('KEEP_WARM'), KEEP_WARM * 1000)
    else if (st.S === 'basketOut') id = setTimeout(() => sendRef.current('BASKET_TIMEOUT'), BASKET_TO * 1000)
    return () => clearTimeout(id)
  }, [st.S, st.acts])

  useEffect(() => {
    if (!st.msg) return
    const id = setTimeout(() => dispatch({ type: 'CLEARMSG' }), 1800)
    return () => clearTimeout(id)
  }, [st.msg])

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'b' || e.key === 'B') sendRef.current(st.C.basket ? 'BASKET_REMOVED' : 'BASKET_INSERTED')
      if (e.key === 'a' || e.key === 'A') sendRef.current('ADD_30')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [st.C.basket])

  const cooking = COOK.includes(st.S)
  const STATUS_MAP = {
    off: 'standby', idle: 'ready', running: 'cooking', paused: 'paused',
    shakeAlert: 'shake now', shakeWaiting: 'reinsert basket', basketOut: 'basket out', done: 'enjoy',
  }
  const status = st.msg || (st.S === 'set' ? (st.C.fn || 'manual') + ' — press start' : STATUS_MAP[st.S])

  return (
    <div className="pp">
      {/* ---- LEFT DRAWER: POSSIBLE ACTIONS ---- */}
      <div className={'drawer left' + (leftOpen ? ' open' : '')}>
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="drawer-title">POSSIBLE ACTIONS</span>
            <button className="drawer-close" onClick={() => setLeftOpen(false)}>
              <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="drawer-body">
            <div className="dr-pills">
              {(AVAIL[st.S] || []).map((e, i) => (
                <span key={i} className={'dr-pill' + (e.indexOf('⏱') >= 0 ? ' auto' : '')}>{e}</span>
              ))}
              <span className="dr-pill glob">POWER_OFF (hold)</span>
              <span className="dr-pill glob">LIGHT</span>
              <span className="dr-pill glob">VOLUME</span>
            </div>
          </div>
        </div>
        <button className="drawer-tab left" onClick={() => setLeftOpen(true)}>
          <span>ACTIONS</span>
        </button>
      </div>

      {/* ---- CENTER: PANEL ---- */}
      <div className="pp-center">
        <div className="brand">
          <h1>AFC&#8209;6<b>.</b></h1>
          <span className="tag">dual-heat air fryer · console</span>
        </div>
        <div className="status"><span className="dot" /> simulation active</div>
        <Panel S={st.S} C={st.C} send={send} />
        <div className="pp-status">
          STATUS&nbsp;&nbsp;<span style={{ color: st.msg ? 'var(--org-deep)' : 'var(--ink)', fontWeight: 700 }}>{status.toUpperCase()}</span>
        </div>
      </div>

      {/* ---- RIGHT DRAWER: MACHINE STATE ---- */}
      <div className={'drawer right' + (rightOpen ? ' open' : '')}>
        <button className="drawer-tab right" onClick={() => setRightOpen(true)}>
          <span>STATE</span>
        </button>
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="drawer-title">MACHINE STATE</span>
            <button className="drawer-close" onClick={() => setRightOpen(false)}>
              <svg viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="drawer-body">
            <div className="dr-kv">
              <div className="dr-row">
                <span className="dr-k">STATE</span>
                <span className="dr-v hot">{PRETTY[st.S]}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">FUNCTION</span>
                <span className="dr-v">{st.C.fn || '—'}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">DUAL HEAT</span>
                <span className={'dr-v' + (st.C.dual && st.S !== 'off' ? ' hot' : '')}>{st.C.dual && st.S !== 'off' ? 'ON' : 'off'}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">TIME</span>
                <span className="dr-v">{fmt(cooking ? st.C.rem : st.C.time)}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">TEMP</span>
                <span className="dr-v">{st.S === 'off' ? '—' : (st.C.temp > 0 ? st.C.temp + '°F' : '—')}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">SHAKE</span>
                <span className="dr-v">{st.C.shake ? 'yes' : 'no'}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">BASKET</span>
                <span className={'dr-v' + (!st.C.basket ? ' warn' : '')}>{st.C.basket ? 'locked' : 'REMOVED'}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">BRIGHTNESS</span>
                <span className="dr-v">{['50%', '75%', '100%'][st.C.light]}</span>
              </div>
              <div className="dr-row">
                <span className="dr-k">VOLUME</span>
                <span className="dr-v">{st.C.vol ? 'on' : 'off'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
