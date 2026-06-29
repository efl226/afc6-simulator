import { useEffect, useState, useRef } from 'react'
import { PRETTY } from '../machine.js'

// --- layout: 1200 × 380 viewBox, scrollable ---
const POS = {
  off: [80, 190], idle: [220, 190], set: [370, 190],
  running: [680, 190], paused: [555, 100], basketOut: [805, 100],
  shakeAlert: [555, 285], shakeWaiting: [805, 285], done: [1080, 190],
}

const NODE_DEF = [
  ['off',          'offc',  'OFF',        'standby'],
  ['idle',         'offc',  'IDLE',       'ready'],
  ['set',          'happy', 'SET',        'time / temp',   5],
  ['running',      'happy', 'COOKING',    'heat on',       3],
  ['paused',       'intc',  'PAUSED',     'frozen'],
  ['basketOut',    'intc',  'BASKET OUT', 'auto-pause'],
  ['shakeAlert',   'intc',  'SHAKE',      'midpoint'],
  ['shakeWaiting', 'intc',  'SHAKE WAIT', 'basket out'],
  ['done',         'donec', 'DONE',       'keep-warm'],
]

const EDGES = [
  { a: 'off', b: 'idle', label: 'POWER' },
  { a: 'idle', b: 'set', label: 'SELECT / ADJUST' },
  { a: 'set', b: 'running', label: 'START' },
  { a: 'running', b: 'done', label: 'TICK → 0', auto: true },

  { a: 'running', b: 'paused', label: 'PAUSE', bow: 14 },
  { a: 'paused', b: 'running', label: 'RESUME', bow: 14 },
  { a: 'running', b: 'basketOut', label: 'BASKET_OUT', bow: -14, sensor: true },
  { a: 'basketOut', b: 'running', label: 'BASKET_IN', bow: -14, sensor: true },
  { a: 'running', b: 'shakeAlert', label: 'midpoint', auto: true, bow: 14 },
  { a: 'shakeAlert', b: 'shakeWaiting', label: 'BASKET_OUT', sensor: true },
  { a: 'shakeWaiting', b: 'running', label: 'BASKET_IN', sensor: true },
  { a: 'paused', b: 'basketOut', label: 'BASKET_OUT', sensor: true },

  { a: 'running', b: 'idle', label: 'START/STOP', curveY: 38 },
  { a: 'paused', b: 'idle', label: 'STOP', curveY: 18 },
  { a: 'basketOut', b: 'set', label: 'timeout', auto: true, curveY: 52 },
  { a: 'done', b: 'set', label: 'START / STOP', curveY: 360 },
  { a: 'done', b: 'idle', label: 'KEEP_WARM', auto: true, curveY: 8 },
]

const NODE_INFO = {
  off: {
    title: 'OFF', desc: 'Display dark — standby power mode',
    out: [{ ev: 'POWER', to: 'IDLE' }],
    self: [],
    inc: ['Any state → POWER_OFF', 'IDLE / SET → AUTO_OFF'],
  },
  idle: {
    title: 'IDLE', desc: 'Ready — presets lit, waiting for input',
    out: [
      { ev: 'SELECT_FUNCTION', to: 'SET' },
      { ev: 'ADJUST_TIME / TEMP', to: 'SET' },
      { ev: 'LAST_COOK / FAVORITE', to: 'SET' },
      { ev: 'AUTO_OFF (120s)', to: 'OFF' },
    ],
    self: ['LIGHT_TOGGLE', 'VOLUME_TOGGLE'],
    inc: ['OFF → POWER', 'RUNNING → START/STOP', 'PAUSED → STOP', 'DONE → KEEP_WARM'],
  },
  set: {
    title: 'SET', desc: 'Configure cook — presets, time, temp, shake',
    out: [
      { ev: 'START', to: 'RUNNING' },
      { ev: 'AUTO_OFF (120s)', to: 'OFF' },
    ],
    self: ['SELECT_FUNCTION', 'ADJUST_TIME', 'ADJUST_TEMP', 'TOGGLE_SHAKE', 'SAVE_FAVORITE'],
    inc: ['IDLE → select/adjust', 'DONE → START/STOP', 'BASKET_OUT → timeout'],
  },
  running: {
    title: 'COOKING', desc: 'Heat on — counting down, basket locked',
    out: [
      { ev: 'TICK → 0', to: 'DONE' },
      { ev: 'PAUSE', to: 'PAUSED' },
      { ev: 'START/STOP', to: 'IDLE' },
      { ev: 'BASKET_REMOVED', to: 'BASKET OUT' },
      { ev: 'shake midpoint', to: 'SHAKE' },
    ],
    self: ['TICK', 'ADJUST_TIME', 'ADJUST_TEMP', 'ADD_30'],
    inc: ['SET → START', 'PAUSED → resume', 'BASKET_OUT → insert', 'SHAKE_WAIT → insert'],
  },
  paused: {
    title: 'PAUSED', desc: 'Cook frozen — press start or pause to resume',
    out: [
      { ev: 'START / PAUSE', to: 'RUNNING' },
      { ev: 'STOP', to: 'IDLE' },
      { ev: 'BASKET_REMOVED', to: 'BASKET OUT' },
    ],
    self: [],
    inc: ['RUNNING → PAUSE'],
  },
  basketOut: {
    title: 'BASKET OUT', desc: 'Auto-paused — basket removed during cook',
    out: [
      { ev: 'BASKET_INSERTED', to: 'RUNNING' },
      { ev: 'BASKET_TIMEOUT (25s)', to: 'SET' },
    ],
    self: [],
    inc: ['RUNNING → basket removed', 'PAUSED → basket removed'],
  },
  shakeAlert: {
    title: 'SHAKE ALERT', desc: 'Midpoint reached — remove basket to shake food',
    out: [{ ev: 'BASKET_REMOVED', to: 'SHAKE WAIT' }],
    self: [],
    inc: ['RUNNING → midpoint (auto)'],
  },
  shakeWaiting: {
    title: 'SHAKE WAIT', desc: 'Basket out for shaking — reinsert to resume',
    out: [{ ev: 'BASKET_INSERTED', to: 'RUNNING' }],
    self: [],
    inc: ['SHAKE ALERT → basket removed'],
  },
  done: {
    title: 'DONE', desc: 'Cook complete — beep, enter keep-warm countdown',
    out: [
      { ev: 'START / STOP / POWER', to: 'SET' },
      { ev: 'SELECT_FUNCTION', to: 'SET' },
      { ev: 'KEEP_WARM (25s)', to: 'IDLE' },
    ],
    self: [],
    inc: ['RUNNING → timer expires'],
  },
}

function bowPath(x1, y1, x2, y2, bow) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const px = -dy / len * bow, py = dx / len * bow
  return { d: `M${x1},${y1} Q${mx + px},${my + py} ${x2},${y2}`, lx: mx + px * 0.6, ly: my + py * 0.6 }
}

function edgePath(edge) {
  const [x1, y1] = POS[edge.a], [x2, y2] = POS[edge.b]
  if (edge.curveY !== undefined) {
    const cy = edge.curveY
    const lx = (x1 + x2) / 2
    const ly = 0.125 * y1 + 0.75 * cy + 0.125 * y2 + (cy < y1 ? -10 : 10)
    return { d: `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`, lx, ly }
  }
  if (edge.bow) {
    return bowPath(x1, y1, x2, y2, edge.bow)
  }
  return { d: `M${x1},${y1} L${x2},${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 - 9 }
}

export default function Flow({ S, flash }) {
  const [hot, setHot] = useState('')
  const [selected, setSelected] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    setHot(flash.k)
    const id = setTimeout(() => setHot(''), 650)
    return () => clearTimeout(id)
  }, [flash.n])

  useEffect(() => {
    if (!canvasRef.current) return
    const x = POS[S]?.[0] || 0
    const w = canvasRef.current.clientWidth
    canvasRef.current.scrollTo({ left: Math.max(0, x - w / 2), behavior: 'smooth' })
  }, [S])

  return (
    <div className="card reveal flow-card" style={{ animationDelay: '.15s' }}>
      <h2>State Flow</h2>
      <p className="now">live ▸ <b>{PRETTY[S]}</b></p>
      <div className="canvas" ref={canvasRef}>
        <div className="canvas-inner" onClick={() => setSelected(null)}>
          <div className="cookzone"><span>COOKING ZONE</span></div>
          <svg viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#b0b0b0" /></marker>
              <marker id="ah-s" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#7cb3d0" /></marker>
              <marker id="ah-h" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#f0892e" /></marker>
            </defs>
            {EDGES.map((edge) => {
              const k = edge.a + '>' + edge.b
              const isHot = hot === k || hot === edge.b + '>' + edge.a
              const { d, lx, ly } = edgePath(edge)
              const col = isHot ? '#f0892e' : edge.sensor ? '#7cb3d0' : '#b0b0b0'
              const marker = isHot ? 'url(#ah-h)' : edge.sensor ? 'url(#ah-s)' : 'url(#ah)'
              return (
                <g key={k}>
                  <path d={d} fill="none" stroke={col}
                    strokeWidth={isHot ? 2.5 : 1.3} markerEnd={marker}
                    strokeDasharray={edge.auto ? '6 4' : '0'} />
                  {edge.label && (
                    <text x={lx} y={ly} textAnchor="middle"
                      className={'edge-label' + (edge.auto ? ' auto' : '') + (edge.sensor ? ' sensor' : '')}>
                      {edge.auto ? '⏱ ' : ''}{edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          {NODE_DEF.map(([id, cls, title, sub, loops]) => (
            <div key={id}
              className={'node ' + cls + (S === id ? ' active' : '') + (selected === id ? ' selected' : '')}
              style={{ left: POS[id][0], top: POS[id][1] }}
              onClick={(e) => { e.stopPropagation(); setSelected(selected === id ? null : id) }}>
              {title}
              <small>{sub}</small>
              {loops > 0 && <span className="self-badge">↺ {loops}</span>}
            </div>
          ))}
        </div>
      </div>
      {selected && <NodeDetail id={selected} onClose={() => setSelected(null)} />}
      <div className="legend">
        <span className="sw" style={{ background: '#fff4e7', border: '1.5px solid #e6983f' }} />active &nbsp;
        <span className="sw" style={{ background: '#fff8e6', border: '1.5px solid #dcab3a' }} />interrupt &nbsp;
        <span className="sw" style={{ background: '#edeee9', border: '1.5px solid #a7a39a' }} />off/idle &nbsp;
        <span className="sw" style={{ background: '#e6f4ec', border: '1.5px solid #46a073' }} />done
        &nbsp;&nbsp;<b>—</b> user &nbsp; <b style={{ color: '#7cb3d0' }}>—</b> sensor &nbsp; <b>┄</b> auto/timeout &nbsp; <b>↺</b> = self-loop (click node)
      </div>
    </div>
  )
}

function NodeDetail({ id, onClose }) {
  const info = NODE_INFO[id]
  if (!info) return null
  const cls = NODE_DEF.find(n => n[0] === id)?.[1] || ''
  return (
    <div className="node-detail">
      <div className="nd-head">
        <span className={'nd-chip ' + cls}>{info.title}</span>
        <span className="nd-desc">{info.desc}</span>
        <button className="nd-close" onClick={onClose}>✕</button>
      </div>
      <div className="nd-body">
        <div className="nd-col">
          <h4>Transitions Out</h4>
          {info.out.map((t, i) => (
            <div key={i} className="nd-row">
              <span className="nd-ev">{t.ev}</span><span className="nd-arr">→</span><span className="nd-to">{t.to}</span>
            </div>
          ))}
        </div>
        {info.self.length > 0 && (
          <div className="nd-col">
            <h4>Self-Loops ↺</h4>
            {info.self.map((ev, i) => <div key={i} className="nd-row"><span className="nd-ev">{ev}</span></div>)}
          </div>
        )}
        <div className="nd-col">
          <h4>Incoming From</h4>
          {info.inc.map((s, i) => <div key={i} className="nd-row nd-inc">{s}</div>)}
        </div>
      </div>
    </div>
  )
}
