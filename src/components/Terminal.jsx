import { useEffect, useRef } from 'react'
import { PRETTY } from '../machine.js'

// Console-style live event log. Auto-scrolls to the newest line.
export default function Terminal({ log }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [log])

  return (
    <div className="terminal">
      <div className="tbar">
        <i className="r" /><i className="y" /><i className="g" />
        <span>afc6@console — live event stream</span>
      </div>
      <div className="tbody" ref={ref}>
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
    </div>
  )
}
