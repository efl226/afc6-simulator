import { useReducer, useEffect, useRef } from 'react'
import { reducer, init, AUTO_OFF, KEEP_WARM, BASKET_TO } from './machine.js'
import Panel from './components/Panel.jsx'
import Terminal from './components/Terminal.jsx'
import Flow from './components/Flow.jsx'
import Telemetry from './components/Telemetry.jsx'

const STATUS = {
  off: 'standby', idle: 'ready', running: 'cooking', paused: 'paused',
  shakeAlert: 'shake now', shakeWaiting: 'reinsert basket', basketOut: 'basket out', done: 'enjoy',
}

export default function App() {
  const [st, dispatch] = useReducer(reducer, init)
  const send = (ev, arg) => dispatch({ type: 'SEND', ev, arg })

  // keep a stable ref so timers always call the latest send.
  const sendRef = useRef(send)
  sendRef.current = send

  // 1Hz tick while cooking.
  useEffect(() => {
    if (st.S !== 'running') return
    const id = setInterval(() => sendRef.current('TICK'), 1000)
    return () => clearInterval(id)
  }, [st.S])

  // auto-off / keep-warm / basket timeout — re-armed on activity via st.acts.
  useEffect(() => {
    let id
    if (st.S === 'idle' || st.S === 'set') id = setTimeout(() => sendRef.current('AUTO_OFF'), AUTO_OFF * 1000)
    else if (st.S === 'done') id = setTimeout(() => sendRef.current('KEEP_WARM'), KEEP_WARM * 1000)
    else if (st.S === 'basketOut') id = setTimeout(() => sendRef.current('BASKET_TIMEOUT'), BASKET_TO * 1000)
    return () => clearTimeout(id)
  }, [st.S, st.acts])

  // clear a transient status message (e.g. "Lock the basket in") after a beat.
  useEffect(() => {
    if (!st.msg) return
    const id = setTimeout(() => dispatch({ type: 'CLEARMSG' }), 1800)
    return () => clearTimeout(id)
  }, [st.msg])

  // keyboard: B = basket in/out, A = +30s (the panel has no physical buttons for these).
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'b' || e.key === 'B') sendRef.current(st.C.basket ? 'BASKET_REMOVED' : 'BASKET_INSERTED')
      if (e.key === 'a' || e.key === 'A') sendRef.current('ADD_30')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [st.C.basket])

  const status = st.msg || (st.S === 'set' ? (st.C.fn || 'manual') + ' — press start' : STATUS[st.S])

  return (
    <>
      <header>
        <div className="brand">
          <h1>AFC&#8209;6<b>.</b></h1>
          <span className="tag">dual-heat air fryer · console</span>
        </div>
        <div className="status"><span className="dot" /> simulation active</div>
      </header>
      <main>
        <section className="stage reveal" style={{ animationDelay: '.05s' }}>
          <Panel S={st.S} C={st.C} send={send} />
          <div className="statusline">
            STATUS&nbsp;&nbsp;<span style={{ color: st.msg ? 'var(--org-deep)' : 'var(--ink)', fontWeight: 700 }}>{status.toUpperCase()}</span>
          </div>
          <Terminal log={st.log} />
        </section>
        <aside className="rail">
          <Flow S={st.S} flash={st.flash} />
          <Telemetry S={st.S} C={st.C} />
        </aside>
      </main>
    </>
  )
}
