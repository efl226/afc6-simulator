import { useEffect, useRef, useState, useCallback } from 'react'
import { PRETTY } from '../machine.js'

export default function Terminal({ log }) {
  const ref = useRef(null)
  const [bodyH, setBodyH] = useState(28)
  const bodyHRef = useRef(28)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [log, bodyH])

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = bodyHRef.current

    const onMove = (ev) => {
      const h = Math.max(28, Math.min(400, startH + ev.clientY - startY))
      bodyHRef.current = h
      setBodyH(h)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  return (
    <div className="terminal">
      <div className="tbar">
        <span>afc6@console — live event stream</span>
      </div>
      <div className="tbody" ref={ref} style={{ height: bodyH }}>
        {log.length === 0 && <div className="mt">&gt; waiting for input…</div>}
        {log.map((l, i) => (
          <div key={i}>
            <span className="mt">&gt;</span> <span className="ev">{l.ev}</span>{' '}
            {l.from !== l.to
              ? <span className="ar">{PRETTY[l.from]} → {PRETTY[l.to]}</span>
              : <span className="mt">{PRETTY[l.to]}</span>}
          </div>
        ))}
      </div>
      <div className="tresizer" onPointerDown={onPointerDown} />
    </div>
  )
}
