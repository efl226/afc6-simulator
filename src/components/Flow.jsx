import { useEffect, useState } from 'react'
import { PRETTY } from '../machine.js'

// Node coordinates (line endpoints) in the 460x560 SVG space.
const POS = {
  off: [230, 33], idle: [230, 111], set: [230, 191], running: [230, 300],
  paused: [85, 300], basketOut: [375, 300], shakeAlert: [85, 398], shakeWaiting: [375, 398], done: [230, 505],
}
const EDGES = [
  ['off', 'idle'], ['idle', 'set'], ['set', 'running'], ['running', 'done'],
  ['running', 'paused'], ['running', 'basketOut'], ['running', 'shakeAlert'],
  ['shakeAlert', 'shakeWaiting'], ['shakeWaiting', 'running'], ['done', 'set'],
]
const AUTOE = new Set(['running>done', 'running>shakeAlert', 'basketOut>set']) // dashed = auto/timeout

const NODE_DEF = [
  ['off', 'offc', 'OFF', 'display dark'], ['idle', 'offc', 'IDLE', 'ready · presets lit'], ['set', 'happy', 'SET', 'time/temp · arm shake'],
  ['running', 'happy', 'COOKING', 'heat on · counting'], ['paused', 'intc', 'PAUSED', 'frozen'], ['basketOut', 'intc', 'BASKET OUT', 'auto-pause'],
  ['shakeAlert', 'intc', 'SHAKE ALERT', 'alarm · midpoint'], ['shakeWaiting', 'intc', 'SHAKE', 'basket out'], ['done', 'donec', 'DONE', 'beep · keep-warm'],
]
// Node box top-left positions (px within the .canvas).
const NLEFT = { off: 169, idle: 169, set: 169, running: 169, paused: 24, basketOut: 314, shakeAlert: 24, shakeWaiting: 314, done: 169 }
const NTOP = { off: 6, idle: 84, set: 164, running: 270, paused: 270, basketOut: 270, shakeAlert: 368, shakeWaiting: 368, done: 478 }

export default function Flow({ S, flash }) {
  const [hot, setHot] = useState('')
  // flash the fired transition (orange) for 650ms whenever flash.n changes.
  useEffect(() => {
    setHot(flash.k)
    const id = setTimeout(() => setHot(''), 650)
    return () => clearTimeout(id)
  }, [flash.n])

  return (
    <div className="card reveal" style={{ animationDelay: '.15s' }}>
      <h2>State Flow</h2>
      <p className="now">live ▸ <b>{PRETTY[S]}</b></p>
      <div className="canvas">
        <div className="cookzone" style={{ left: 14, top: 248, width: 432, height: 222 }}><span>COOKING</span></div>
        <svg viewBox="0 0 460 560">
          <defs>
            <marker id="ah" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
              <path d="M0,0 L6.5,3 L0,6 Z" fill="#c4c4c4" />
            </marker>
          </defs>
          {EDGES.map(([a, b]) => {
            const [x1, y1] = POS[a], [x2, y2] = POS[b]
            const k = a + '>' + b
            const isHot = hot === k || hot === b + '>' + a
            const auto = AUTOE.has(k)
            return (
              <line key={k} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isHot ? '#f0892e' : '#c9c9c9'} strokeWidth={isHot ? 3 : 1.6}
                markerEnd="url(#ah)" strokeDasharray={auto ? '7 6' : '0'} />
            )
          })}
        </svg>
        {NODE_DEF.map(([id, cls, t, sub]) => (
          <div key={id} className={'node ' + cls + (S === id ? ' active' : '')} style={{ left: NLEFT[id], top: NTOP[id] }}>
            {t}<small>{sub}</small>
          </div>
        ))}
      </div>
      <div className="legend">
        <span className="sw" style={{ background: '#fff4e7', border: '1.5px solid #e6983f' }} />active &nbsp;
        <span className="sw" style={{ background: '#fff8e6', border: '1.5px solid #dcab3a' }} />interrupt &nbsp;
        <span className="sw" style={{ background: '#edeee9', border: '1.5px solid #a7a39a' }} />off/idle &nbsp;
        <span className="sw" style={{ background: '#e6f4ec', border: '1.5px solid #46a073' }} />done<br />
        <b>solid</b>=button · <b>dashed</b>=auto/timeout · always: POWER_OFF · LIGHT/VOLUME · AUTO-OFF · KEEP-WARM
      </div>
    </div>
  )
}
