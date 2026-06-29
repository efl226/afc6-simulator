import { useState, useEffect, useRef } from 'react'
import { COOK, fmt } from '../machine.js'
import { Ic } from '../icons.jsx'
import dualHeatSvg from '../assets/DualHeat Icon.svg'

const PRESETS_POS = [
  ['air fry', 'Air Fry', 14, 31], ['bake', 'Bake', 28, 31], ['broil', 'Broil', 42, 31],
  ['roast', 'Roast', 55, 31], ['recrisp', 'Recrisp', 69, 31], ['max crisp', 'Max Crisp', 83, 31],
  ['toast', 'Toast', 14, 44], ['fries', 'Fries', 31, 44], ['wings', 'Wings', 49, 44],
  ['frozen snacks', 'Frozen Snacks', 66, 44], ['veggies', 'Veggies', 83, 44],
]

const makeHold = (short, long) => {
  let timer, longFired = false
  return {
    onPointerDown: () => { longFired = false; timer = setTimeout(() => { longFired = true; long() }, 650) },
    onPointerUp: () => { clearTimeout(timer); if (!longFired) short() },
    onPointerLeave: () => clearTimeout(timer),
  }
}

export default function Panel({ S, C, send }) {
  const cooking = COOK.includes(S)
  const on = S !== 'off'
  const pdis = !(on && !cooking)
  const stepDis = !(on && S !== 'running' && S !== 'shakeAlert' && S !== 'shakeWaiting' && S !== 'basketOut')
  const pauseEnabled = S === 'running' || S === 'paused'
  const brightness = [0.5, 0.75, 1][C.light]
  const presetLit = (fn) => C.fn === fn && on

  const [dispMode, setDispMode] = useState('time')
  const prevFn = useRef(C.fn)
  useEffect(() => {
    if (C.fn && C.fn !== prevFn.current) setDispMode('temp')
    prevFn.current = C.fn
  }, [C.fn])

  let dispVal, ghost
  if (!on) {
    dispVal = '--:--'; ghost = '88:88'
  } else if (dispMode === 'temp') {
    dispVal = String(C.temp); ghost = '888'
  } else {
    dispVal = fmt(cooking ? C.rem : C.time)
    ghost = dispVal.replace(/[0-9]/g, '8')
  }

  const [flash, setFlash] = useState({})
  const doFlash = (key, action) => {
    action()
    setFlash(f => ({ ...f, [key]: true }))
    setTimeout(() => setFlash(f => ({ ...f, [key]: false })), 200)
  }

  const canAdjust = on && (S === 'set' || S === 'idle' || S === 'paused')
  const adjTemp = (v) => { if (canAdjust) { setDispMode('temp'); send('ADJUST_TEMP', v) } }
  const adjTime = (v) => { if (canAdjust) { setDispMode('time'); send('ADJUST_TIME', v) } }

  return (
    <div className="panelwrap">
      <div className="panel">
        <svg className="bg" viewBox="0 0 485 372" preserveAspectRatio="none">
          <path d="M242.44 371.34L261.82 371.26 268.31 371.19 281.19 370.97 300.56 370.43 319.92 369.57 330.72 368.92 344.07 367.91 358.53 366.49 370.52 364.99 382.53 363.18 397.18 360.36 406.21 358.1 415.46 355.27 425.68 351.47 434.04 347.61 441.13 343.44 449.4 337.13 456.23 330.28C459 327 461.5 323.5 463.31 320.51C468.75 310.28 471.05 304.26 473.14 298.17L478.33 277.21 480.98 260.49 482.93 240.6 483.81 226.94 484.47 210.01 484.73 196.71 484.77 185.67 484.23 153.26 479.99 103.8 474.82 78.76C472 70 469 62 465.42 54.51C461.69 48.08 457.53 42.47 453.09 37.63C448.95 33.69 444.65 30.29 440.27 27.36C435.63 24.57 430 22 424.99 19.53L389.67 9.44 341.04 3.18 289.71 0.58 252.19 0.02 218.81 0.13 190.61 0.71 148.91 2.78 114.94 6.23C100 8 92 10 88.32 10.85C80.73 12.52 74 14 69.41 15.95C64 18 60 19 57.86 20.33L48.97 24.71C46 26 44 27 41.88 29.11C36.5 33.05 30.83 38.35 25.22 45.2L17.57 58.01C13.16 68.18 9.54 79.82 6.6 93.18L3.16 116.15 1.51 134.72 0.63 151.01 0.25 162.74 0.02 177.29 0 185.68 0.5 216.23 2.49 248.31 4.8 267.66 7.7 283.27 11.43 297.45 16.66 311.39 22.24 321.71 29.42 331.26 42.89 342.92 62.55 352.88 86.27 360.02 116.51 365.33 142.22 368.02 172.3 369.94 199.6 370.87 215.34 371.16 233.93 371.32 242.45 371.34" fill="#000" />
        </svg>
        <div className="gloss" />
        <div className={'layer' + (S === 'off' ? ' off' : '')} style={{ opacity: brightness }}>
          {/* ---- top row ---- */}
          <div className="c pwr" style={{ left: '20%', top: '14%' }}
            onClick={() => send(S === 'off' ? 'POWER' : 'POWER_OFF')}>{Ic.power}</div>
          <div className={'c' + (flash.vol ? ' flash' : '')} style={{ left: '34%', top: '14%' }}
            onClick={() => doFlash('vol', () => send('VOLUME_TOGGLE'))}>{Ic.volume}<span className="lab">Volume</span></div>
          <div className="dual-ind" style={{ left: '50%', top: '14%', opacity: C.dual && on ? 1 : 0 }}>
            <img src={dualHeatSvg} alt="" draggable={false} /></div>
          <div className={'c' + (pdis ? ' dis' : '')} style={{ left: '66%', top: '14%' }}
            {...makeHold(() => send('FAVORITE'), () => send('SAVE_FAVORITE'))}>{Ic.fav}<span className="lab">Favorite</span></div>
          <div className={'c' + (pdis ? ' dis' : '')} style={{ left: '80%', top: '14%' }}
            onClick={() => !pdis && send('LAST_COOK')}>{Ic.last}<span className="lab">Last Cook</span></div>

          {/* ---- presets ---- */}
          {PRESETS_POS.map(([fn, label, x, y]) => (
            <div key={fn} className={'p' + (presetLit(fn) ? ' sel' : '') + (pdis && !presetLit(fn) ? ' dis' : '')}
              style={{ left: x + '%', top: y + '%' }}
              onClick={() => !pdis && send('SELECT_FUNCTION', fn)}>{label}</div>
          ))}

          {/* ---- shake (left) — lights up during shakeAlert ---- */}
          <div className={'shake-btn' + (C.shake || S === 'shakeAlert' ? ' sel' : '') + (pdis ? ' dis' : '')}
            style={{ left: '14%', top: '63%' }}
            onClick={() => !pdis && send('TOGGLE_SHAKE')}>{Ic.shake}</div>

          {/* ---- steppers + display ---- */}
          <div className="stepper" style={{ left: '30%', top: '63%' }}>
            <div className={'arr' + (!canAdjust ? ' dis' : '')} onClick={() => adjTemp(5)}>{Ic.arrow}</div>
            <div className="mid" onClick={() => on && setDispMode('temp')}>Temp</div>
            <div className={'arr dn' + (!canAdjust ? ' dis' : '')} onClick={() => adjTemp(-5)}>{Ic.arrow}</div>
          </div>
          <div className="disp-wrap" style={{ left: '49.9%', top: '63%' }}>
            <span className="ghost">{ghost}</span>
            <span className={'disp' + (cooking ? ' cooking' : '')}>{dispVal}</span>
          </div>
          <div className="stepper" style={{ left: '68%', top: '63%' }}>
            <div className={'arr' + (!canAdjust ? ' dis' : '')} onClick={() => adjTime(5)}>{Ic.arrow}</div>
            <div className="mid" onClick={() => on && setDispMode('time')}>Time</div>
            <div className={'arr dn' + (!canAdjust ? ' dis' : '')} onClick={() => adjTime(-5)}>{Ic.arrow}</div>
          </div>

          {/* ---- keep warm (right) ---- */}
          <div className={'p' + (presetLit('keep warm') ? ' sel' : '') + (pdis && !presetLit('keep warm') ? ' dis' : '')}
            style={{ left: '83%', top: '63%' }}
            onClick={() => !pdis && send('SELECT_FUNCTION', 'keep warm')}>Keep Warm</div>

          {/* ---- bottom row ---- */}
          <div className={'c btm' + (!pauseEnabled ? ' dis' : '')} style={{ left: '30%', top: '87%' }}
            onClick={() => { if (pauseEnabled) { if (S === 'paused') setDispMode('time'); send('PAUSE'); } }}>{Ic.pause}</div>
          <div className={'startstop' + (on ? ' on' : '')} style={{ left: '49.9%', top: '87%' }}
            onClick={() => { setDispMode('time'); send('START'); }}>
            <div className="t">Start</div><div className="ln" /><div className="t">Stop</div>
          </div>
          <div className={'c btm' + (flash.light ? ' flash' : '')} style={{ left: '68%', top: '87%' }}
            onClick={() => doFlash('light', () => send('LIGHT_TOGGLE'))}>{Ic.light}</div>
        </div>
      </div>
      <div className="hint">basket → press <b>B</b> to remove, <b>B</b> again to reinsert &nbsp;·&nbsp; hold <b>fav</b>=save</div>
    </div>
  )
}
