/*
  The Context Window film: a timeline of beats (script.ts), persistent objects
  placed per beat (scene.ts), and a camera. Motion animates every object from
  its previous state to the next, so the story reads as one continuous shot.
*/
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useIsWide } from '../shared'
import { B, BEATS, CHAPTERS, END, beatAt } from './script'
import { geo } from './scene'
import { Stage } from './Stage'
import './film.css'


// ---------- playback ----------
function usePlayback() {
  const [beat, setBeat] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const tRef = useRef(0)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let lastUi = 0
    const tick = (now: number) => {
      tRef.current = Math.min(END, tRef.current + (now - last) / 1000)
      last = now
      const b = beatAt(tRef.current)
      setBeat((prev) => (prev === b ? prev : b))
      if (now - lastUi > 200) {
        lastUi = now
        setTime(tRef.current)
      }
      if (tRef.current >= END) {
        setTime(END)
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const seek = (t: number) => {
    tRef.current = Math.max(0, Math.min(END, t))
    setBeat(beatAt(tRef.current))
    setTime(tRef.current)
  }
  const toggle = () => {
    if (tRef.current >= END) seek(0)
    setPlaying((p) => !p)
  }
  const replay = () => {
    seek(0)
    setPlaying(true)
  }
  return { beat, playing, time, seek, toggle, replay, ended: time >= END }
}

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function Film() {
  const wide = useIsWide()
  const g = useMemo(() => geo(!wide), [wide])
  const { beat, playing, time, seek, toggle, replay, ended } = usePlayback()
  const current = BEATS[beat]!
  const chapter = [...CHAPTERS].reverse().find((c) => c.beat <= beat)

  return (
    <div className="fw">
      <div
        className="fw-stage"
        style={{ aspectRatio: `${g.W} / ${g.H}` }}
        onClick={toggle}
        role="img"
        aria-label="סרטון מונפש: Context Window"
      >
        <Stage b={beat} g={g} />
        <FinalOverlay b={beat} />
        {!playing && (time === 0 || ended) && (
          <button
            type="button"
            className="fw-bigplay"
            onClick={(e) => { e.stopPropagation(); toggle() }}
            aria-label={ended ? 'לצפות שוב' : time > 0 ? 'להמשיך' : 'להפעיל'}
          >
            {ended ? '↺' : '▶'}
          </button>
        )}
      </div>

      <div className="fw-caption" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={beat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {current.caption && <p className="fw-caption-main">{current.caption}</p>}
            {'note' in current && <p className="fw-caption-note">{current.note}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fw-bar">
        <button type="button" className="fw-btn" onClick={toggle} aria-label={playing ? 'השהה' : 'הפעל'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className="fw-btn" onClick={replay} aria-label="מההתחלה">↺</button>
        <div
          className="fw-track"
          role="slider"
          aria-label="מיקום בסרטון"
          aria-valuemin={0}
          aria-valuemax={END}
          aria-valuenow={Math.round(time)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') seek(time + 5)
            if (e.key === 'ArrowRight') seek(time - 5)
          }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            seek(((r.right - e.clientX) / r.width) * END)
          }}
        >
          <span className="fw-track-fill" style={{ width: `${(time / END) * 100}%` }} />
          {CHAPTERS.map((c) => (
            <span key={c.beat} className="fw-track-tick" style={{ insetInlineStart: `${(c.t / END) * 100}%` }} />
          ))}
        </div>
        <span className="fw-time num" dir="ltr">{fmt(time)} / {fmt(END)}</span>
      </div>

      <ol className="fw-chapters" aria-label="פרקים">
        {CHAPTERS.map((c, i) => (
          <li key={c.beat}>
            <button type="button" aria-current={chapter?.beat === c.beat ? 'true' : undefined} onClick={() => seek(c.t)}>
              <span className="num">{i + 1}</span>
              {c.title}
            </button>
          </li>
        ))}
      </ol>

      <details className="fw-script">
        <summary>תסריט קריינות (טיוטה)</summary>
        <ol>
          {BEATS.filter((b) => b.say).map((b) => (
            <li key={b.id}>
              <button type="button" className="num" onClick={() => seek(b.t)}>{fmt(b.t)}</button>
              <span>{b.say}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}

function FinalOverlay({ b }: { b: number }) {
  return (
    <AnimatePresence>
      {b >= B.final && (
        <motion.div className="fw-final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, delay: 0.8 }}>
          <p className="fw-final-main">
            <span className="fw-final-term" dir="ltr">Context Window</span>
            <span className="fw-final-eq">=</span>
            <span>מרחב העבודה המוגבל של המודל עבור המשימה הנוכחית.</span>
          </p>
          <AnimatePresence>
            {b >= B.engineering && (
              <motion.p className="fw-final-next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 2.2 }}>
                בהמשך: <span dir="ltr">Context Engineering</span> — איך בוחרים מה נכנס.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

