import { useEffect, useState } from 'react'
import { PRETTY } from '../machine.js'

const POS = {
  off: [50, 140], idle: [150, 140], set: [250, 140], running: [430, 140],
  paused: [355, 55], basketOut: [505, 55],
  shakeAlert: [355, 245], shakeWaiting: [505, 245],
  done: [690, 140],
}

const EDGES = [
  ['off', 'idle'], ['idle', 'set'], ['set', 'running'], ['running', 'done'],
  ['running', 'paused'], ['running', 'basketOut'], ['running', 'shakeAlert'],
  ['shakeAlert', 'shakeWaiting'], ['shakeWaiting', 'running'], ['done', 'set'],
]

const AUTOE = new Set(['running>done', 'running>shakeAlert', 'basketOut>set'])
const CURVED = { 'done>set': 'M690,140 C690,305 250,305 250,140' }

const NODE_DEF = [
  ['off', 'offc', 'OFF', 'display dark'],
  ['idle', 'offc', 'IDLE', 'ready'],
  ['set', 'happy', 'SET', 'time / temp'],
  ['running', 'happy', 'COOKING', 'heat on'],
  ['paused', 'intc', 'PAUSED', 'frozen'],
  ['basketOut', 'intc', 'BASKET OUT', 'auto-pause'],
  ['shakeAlert', 'intc', 'SHAKE', 'midpoint'],
  ['shakeWaiting', 'intc', 'SHAKE WAIT', 'basket out'],
  ['done', 'donec', 'DONE', 'keep-warm'],
]

const NPOS = {
  off: [6.58, 43.75], idle: [19.74, 43.75], set: [32.89, 43.75],
  running: [56.58, 43.75], paused: [46.71, 17.19], basketOut: [66.45, 17.19],
  shakeAlert: [46.71, 76.56], shakeWaiting: [66.45, 76.56], done: [90.79, 43.75],
}

export default function Flow({ S, flash }) {
  const [hot, setHot] = useState('')
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
        <div className="cookzone" style={{ left: '37%', top: '3%', width: '40%', height: '94%' }}><span>COOKING</span></div>
        <svg viewBox="0 0 760 320" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ah" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
              <path d="M0,0 L6.5,3 L0,6 Z" fill="#c4c4c4" />
            </marker>
            <marker id="ah-hot" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
              <path d="M0,0 L6.5,3 L0,6 Z" fill="#f0892e" />
            </marker>
          </defs>
          {EDGES.map(([a, b]) => {
            const k = a + '>' + b
            const isHot = hot === k || hot === b + '>' + a
            const auto = AUTOE.has(k)
            const curved = CURVED[k]
            if (curved) {
              return (
                <path key={k} d={curved} fill="none"
                  stroke={isHot ? '#f0892e' : '#c9c9c9'} strokeWidth={isHot ? 3 : 1.6}
                  markerEnd={isHot ? 'url(#ah-hot)' : 'url(#ah)'}
                  strokeDasharray={auto ? '7 6' : '0'} />
              )
            }
            const [x1, y1] = POS[a], [x2, y2] = POS[b]
            return (
              <line key={k} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isHot ? '#f0892e' : '#c9c9c9'} strokeWidth={isHot ? 3 : 1.6}
                markerEnd={isHot ? 'url(#ah-hot)' : 'url(#ah)'}
                strokeDasharray={auto ? '7 6' : '0'} />
            )
          })}
        </svg>
        {NODE_DEF.map(([id, cls, t, sub]) => (
          <div key={id} className={'node ' + cls + (S === id ? ' active' : '')}
            style={{ left: NPOS[id][0] + '%', top: NPOS[id][1] + '%' }}>
            {t}<small>{sub}</small>
          </div>
        ))}
      </div>
      <div className="legend">
        <span className="sw" style={{ background: '#fff4e7', border: '1.5px solid #e6983f' }} />active &nbsp;
        <span className="sw" style={{ background: '#fff8e6', border: '1.5px solid #dcab3a' }} />interrupt &nbsp;
        <span className="sw" style={{ background: '#edeee9', border: '1.5px solid #a7a39a' }} />off/idle &nbsp;
        <span className="sw" style={{ background: '#e6f4ec', border: '1.5px solid #46a073' }} />done
        &nbsp;&nbsp;<b>—</b> button · <b>- -</b> auto/timeout
      </div>
    </div>
  )
}
