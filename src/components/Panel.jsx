import { COOK, fmt } from '../machine.js'
import { Ic } from '../icons.jsx'

// Control positions as % of the panel box (485 x 372 design space), matching
// Figma frame 415:6576. Each control is translate(-50%, -50%) centered.
const PRESETS_POS = [
  ['bake', 30, 31], ['roast', 42.5, 31], ['broil', 55, 31], ['wings', 68.5, 31], ['recrisp', 82.5, 31],
  ['toast', 15.7, 43], ['veggies', 30, 43], ['frozen snacks', 48, 43], ['fries', 65.6, 43], ['max crisp', 80.4, 43],
  ['keep warm', 17.3, 63],
]

// The real appliance has no on-screen basket / +30s buttons, so power & favorite
// use tap-vs-hold: short tap = primary action, 650ms hold = secondary.
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
  const pdis = !(on && !cooking)                                         // presets disabled while cooking / off
  const stepDis = !(on && S !== 'shakeAlert' && S !== 'shakeWaiting' && S !== 'basketOut')
  const dispVal = S === 'off' ? '--:--' : fmt(cooking ? C.rem : C.time)

  return (
    <div className="panelwrap">
      <div className="panel">
        <svg className="bg" viewBox="0 0 485 372" preserveAspectRatio="none">
          <path d="M242.44 371.34L261.82 371.26 268.31 371.19 281.19 370.97 300.56 370.43 319.92 369.57 330.72 368.92 344.07 367.91 358.53 366.49 370.52 364.99 382.53 363.18 397.18 360.36 406.21 358.1 415.46 355.27 425.68 351.47 434.04 347.61 441.13 343.44 449.4 337.13 456.23 330.28C459 327 461.5 323.5 463.31 320.51C468.75 310.28 471.05 304.26 473.14 298.17L478.33 277.21 480.98 260.49 482.93 240.6 483.81 226.94 484.47 210.01 484.73 196.71 484.77 185.67 484.23 153.26 479.99 103.8 474.82 78.76C472 70 469 62 465.42 54.51C461.69 48.08 457.53 42.47 453.09 37.63C448.95 33.69 444.65 30.29 440.27 27.36C435.63 24.57 430 22 424.99 19.53L389.67 9.44 341.04 3.18 289.71 0.58 252.19 0.02 218.81 0.13 190.61 0.71 148.91 2.78 114.94 6.23C100 8 92 10 88.32 10.85C80.73 12.52 74 14 69.41 15.95C64 18 60 19 57.86 20.33L48.97 24.71C46 26 44 27 41.88 29.11C36.5 33.05 30.83 38.35 25.22 45.2L17.57 58.01C13.16 68.18 9.54 79.82 6.6 93.18L3.16 116.15 1.51 134.72 0.63 151.01 0.25 162.74 0.02 177.29 0 185.68 0.5 216.23 2.49 248.31 4.8 267.66 7.7 283.27 11.43 297.45 16.66 311.39 22.24 321.71 29.42 331.26 42.89 342.92 62.55 352.88 86.27 360.02 116.51 365.33 142.22 368.02 172.3 369.94 199.6 370.87 215.34 371.16 233.93 371.32 242.45 371.34" fill="#000" />
        </svg>
        <div className="gloss" />
        <div className="layer">
          {/* ---- top row ---- */}
          <div className="c" style={{ left: '20%', top: '14.5%' }} {...makeHold(() => send('POWER'), () => send('POWER_OFF'))}>{Ic.power}</div>
          <div className={'c' + (C.vol ? ' lit' : '')} style={{ left: '33.4%', top: '14%' }} onClick={() => send('VOLUME_TOGGLE')}>{Ic.volume}<span className="lab">volume</span></div>
          <div className={'c' + (C.dual && on ? ' lit' : '')} style={{ left: '50%', top: '14%' }}>{Ic.dual}<span className="lab" style={{ fontSize: '12px' }}>DualHeat</span><div className="ul" /></div>
          <div className={'c' + (pdis ? ' dis' : '')} style={{ left: '66.4%', top: '14%' }} onClick={() => !pdis && send('LAST_COOK')}>{Ic.last}<span className="lab">last cook</span></div>
          <div className={'c' + (pdis ? ' dis' : '')} style={{ left: '80%', top: '14%' }} {...makeHold(() => send('FAVORITE'), () => send('SAVE_FAVORITE'))}>{Ic.fav}<span className="lab">favorite</span></div>

          {/* ---- presets ---- */}
          {PRESETS_POS.map(([fn, x, y]) => (
            <div key={fn} className={'p' + (C.fn === fn && on ? ' sel' : '') + (pdis ? ' dis' : '')} style={{ left: x + '%', top: y + '%' }}
              onClick={() => !pdis && send('SELECT_FUNCTION', fn)}>{fn}</div>
          ))}

          {/* ---- steppers + display ---- */}
          <div className={'stepper' + (stepDis ? ' dis' : '')} style={{ left: '30.3%', top: '63%' }}>
            <div className="arr" onClick={() => !stepDis && send('ADJUST_TEMP', 5)}>{Ic.up}</div>
            <div className="mid">temp</div>
            <div className="arr" onClick={() => !stepDis && send('ADJUST_TEMP', -5)}>{Ic.down}</div>
          </div>
          <div className="disp-wrap" style={{ left: '49.9%', top: '63%' }}>
            <span className="ghost">{dispVal.replace(/[0-9]/g, '8')}</span>
            <span className={'disp' + (cooking ? ' cooking' : '')}>{dispVal}</span>
          </div>
          <div className={'stepper' + (stepDis ? ' dis' : '')} style={{ left: '67.6%', top: '63%' }}>
            <div className="arr" onClick={() => !stepDis && send('ADJUST_TIME', 30)}>{Ic.up}</div>
            <div className="mid">time</div>
            <div className="arr" onClick={() => !stepDis && send('ADJUST_TIME', -30)}>{Ic.down}</div>
          </div>
          <div className={'shake' + (C.shake ? ' lit' : '') + (pdis ? ' dis' : '')} style={{ left: '81%', top: '63%' }}
            onClick={() => !pdis && send('TOGGLE_SHAKE')}>&#10218;&#10218; shake &#10219;&#10219;</div>

          {/* ---- bottom row ---- */}
          <div className={'c' + (!(cooking && S !== 'shakeAlert' && S !== 'shakeWaiting') ? ' dis' : '')} style={{ left: '32%', top: '86.5%' }}
            onClick={() => send('PAUSE')}>{Ic.pause}</div>
          <div className={'startstop' + (on ? ' on' : '')} style={{ left: '49.9%', top: '86.5%' }} onClick={() => send('START')}>
            <div className="t">start</div><div className="ln" /><div className="t">stop</div>
          </div>
          <div className={'c' + (C.light ? ' lit' : '')} style={{ left: '67.6%', top: '86.5%' }} onClick={() => send('LIGHT_TOGGLE')}>{Ic.light}</div>
        </div>
      </div>
      <div className="hint">basket sensor → press <b>B</b> &nbsp;·&nbsp; +30s → press <b>A</b> &nbsp;·&nbsp; hold <b>power</b>=off, hold <b>fav</b>=save</div>
    </div>
  )
}
