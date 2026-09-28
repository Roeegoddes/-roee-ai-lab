/*
  The Context Window film: a timeline of beats (script.ts), persistent objects
  placed per beat (scene.ts), and a camera. Motion animates every object from
  its previous state to the next, so the story reads as one continuous shot.
*/
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react'
import { useIsWide } from '../shared'
import { B, BEATS, CHAPTERS, END, beatAt } from './script'
import {
  CARD, LABEL, NOISY, ORDER, PILE_TOKENS, TOKENS, TS,
  camera, cardState, ctxIds, docCard, geo, mainFrame, noisyState, pageRect, pileState, slot, tokenState,
  type Geo, type Rect, type Src,
} from './scene'
import './film.css'

const camT: Transition = { duration: 1.7, ease: [0.45, 0, 0.2, 1] }
const objT: Transition = { type: 'spring', stiffness: 55, damping: 16 }
const tokT = (delay: number): Transition => ({ type: 'spring', stiffness: 75, damping: 15, delay })

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

// ---------- stage ----------
const Stage = memo(function Stage({ b, g }: { b: number; g: Geo }) {
  const cam = camera(b, g)
  const index = useMemo(() => new Map(ctxIds(b).map((id, i) => [id, i])), [b])
  const F = mainFrame(b, g)
  const modelAt = b < B.split ? g.model : g.model9
  const modelShown = (b >= B.toModel && b <= B.retrieve) || (b >= B.ctx && b <= B.noAuto)
  const trained = b >= B.training && b <= B.noAuto
  const tag = b >= B.weights && b <= B.noAuto ? (trained ? 'Weights · עודכנו באימון' : 'Weights · ללא שינוי') : ''
  const over = b === B.overflow || b === B.rew1 || b === B.rew2

  const frameLabel =
    b < B.split ? 'CONTEXT WINDOW'
    : b < B.ctx ? 'ממוקד'
    : b < B.chatEnd ? 'CONTEXT · שיחה 1'
    : b === B.chatEnd ? 'שיחה 1 הסתיימה'
    : b < B.final ? 'CONTEXT · שיחה 2'
    : 'CONTEXT WINDOW'

  return (
    <motion.div
      className="fw-camera"
      initial={false}
      animate={{ x: `${(0.5 - (cam.s * cam.cx) / g.W) * 100}%`, y: `${(0.5 - (cam.s * cam.cy) / g.H) * 100}%`, scale: cam.s }}
      transition={camT}
      style={{ transformOrigin: '0 0' }}
    >
      <svg viewBox={`0 0 ${g.W} ${g.H}`} className="fw-svg" aria-hidden="true">
        {/* scene 9: training band, memory drawer */}
        <TrainingBand b={b} g={g} />
        <Drawer b={b} g={g} />

        {/* scene 4: things in the product that were NOT sent */}
        <Ghosts show={b >= B.outside && b <= B.filled} g={g} />

        {/* scene 7d: the other two outcomes */}
        {g.minis.map((m, k) => (
          <Mini key={k} F={m} ids={ctxIds(k === 0 ? B.remove : B.compress)} dense={k === 1} show={b === B.compare3} label={k === 0 ? 'הסרה' : 'דחיסה'} />
        ))}
        <motion.text className="fw-under" initial={false} animate={{ opacity: b === B.compare3 ? 1 : 0 }} x={g.F0.x + 300} y={g.F0.y + 690}>שליפה</motion.text>

        {/* flow from context to model */}
        <FlowLine show={b >= B.assembled && b <= B.retrieve && b !== B.compare3} g={g} flowing={b === B.assembled || b === B.filled} />

        {/* windows */}
        <Frame F={F} show={b >= B.frame} label={frameLabel} alert={over} overBy={over ? 8 : 0} />
        <Frame F={g.FN} show={b >= B.split && b <= B.goal} label="עמוס" alert={false} overBy={0} from={{ ...g.FN, y: g.FN.y - 80 }} />
        <Questions show={b >= B.split && b <= B.goal} g={g} />

        {/* scene 7c: document pages + scan */}
        <Pages b={b} g={g} />
        <DocCard b={b} g={g} />

        <Model at={modelAt} show={modelShown} trained={trained} tag={tag} />

        {/* cards */}
        {(['sys', 'hist', 'file', 'tool'] as Src[]).map((src) => (
          <Card key={src} src={src} st={cardState(src, b, g)} text={LABEL[src]} />
        ))}
        <Card src="msg" st={cardState('msg', b, g)} text="מה כתוב בדוח השנתי על ההכנסות?" small />

        <Legend b={b} g={g} />

        {/* tokens */}
        {TOKENS.map((tok) => {
          const st = tokenState(tok, b, g, index)
          return <Tok key={tok.id} id={tok.id} {...st} />
        })}
        {NOISY.map((n) => <Tok key={n.id} id={n.id} {...noisyState(n, b, g)} />)}
        {PILE_TOKENS.map((p) => <Tok key={p.id} id={p.id} {...pileState(p, b, g)} />)}

        {/* scene 9: the preference, in context and in memory */}
        <Preference b={b} g={g} />
        <NoAuto b={b} g={g} />
      </svg>
    </motion.div>
  )
})

function Tok({ id, x, y, s, o, cls, delay }: { id: string; x: number; y: number; s: number; o: number; cls: string; delay: number }) {
  return (
    <motion.rect
      data-id={id}
      className={`fw-tok ${cls}`}
      width={TS}
      height={TS}
      rx={7}
      initial={false}
      animate={{ x, y, scale: s, opacity: o }}
      transition={tokT(delay)}
    />
  )
}

function Frame({ F, show, label, alert, overBy, from }: { F: Rect; show: boolean; label: string; alert: boolean; overBy: number; from?: Rect }) {
  const reduce = useReducedMotion()
  return (
    <motion.g initial={from ? { x: from.x, y: from.y, opacity: 0 } : false} animate={{ x: F.x, y: F.y, opacity: show ? 1 : 0 }} transition={objT}>
      <rect width={600} height={600} rx={18} className="fw-frame-bg" />
      <motion.path
        d="M18 0 H582 Q600 0 600 18 V582 Q600 600 582 600 H18 Q0 600 0 582 V18 Q0 0 18 0 Z"
        className="fw-frame"
        initial={false}
        animate={{ pathLength: show ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 1.8, ease: [0.6, 0, 0.2, 1] }}
      />
      <motion.rect x={0} y={-4} width={600} height={8} rx={4} className="fw-alert" initial={false} animate={{ opacity: alert ? 1 : 0 }} />
      <motion.text className="fw-over" x={-24} y={-70} initial={false} animate={{ opacity: alert ? 1 : 0 }} textAnchor="end">
        {overBy ? `+${overBy}` : ''}
      </motion.text>
      <text x={300} y={-26} className="fw-label">{label}</text>
    </motion.g>
  )
}

function Card({ src, st, text, small }: { src: Src; st: { x: number; y: number; o: number; s: number }; text: string; small?: boolean }) {
  return (
    <motion.g initial={false} animate={{ x: st.x, y: st.y, opacity: st.o, scale: st.s }} transition={objT}>
      <rect x={-CARD.w / 2} y={-CARD.h / 2} width={CARD.w} height={CARD.h} rx={14} className={`fw-card ${src}`} />
      <rect x={CARD.w / 2 - 14} y={-CARD.h / 2} width={14} height={CARD.h} className={`fw-card-edge ${src}`} />
      <text y={small ? 8 : 10} className={small ? 'fw-card-text is-small' : 'fw-card-text'}>{text}</text>
    </motion.g>
  )
}

function Model({ at, show, trained, tag }: { at: { x: number; y: number }; show: boolean; trained: boolean; tag: string }) {
  return (
    <motion.g initial={false} animate={{ x: at.x, y: at.y, opacity: show ? 1 : 0 }} transition={objT}>
      <circle r={96} className="fw-model" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={-50 + (i % 4) * 26}
          y={-50 + Math.floor(i / 4) * 26}
          width={22}
          height={22}
          rx={3}
          className={`fw-w s${trained ? (i * 5 + 1) % 4 : (i * 7 + 3) % 4}`}
        />
      ))}
      <text y={140} className="fw-model-label">מודל</text>
      <text y={178} className="fw-tag">{tag}</text>
    </motion.g>
  )
}

function DocCard({ b, g }: { b: number; g: Geo }) {
  const d = docCard(b, g)
  return (
    <motion.g initial={false} animate={{ x: d.x, y: d.y, opacity: d.o }} transition={objT}>
      <rect width={d.w} height={d.h} rx={10} className={`fw-doc${d.empty ? ' is-empty' : ''}`} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={22} y={70 + i * 30} width={d.w - 44 - (i % 3) * 20} height={8} rx={4} className="fw-doc-line" />
      ))}
      <text x={d.w / 2} y={44} className="fw-doc-title">דוח שנתי</text>
    </motion.g>
  )
}

function Pages({ b, g }: { b: number; g: Geo }) {
  const show = b === B.retrieve
  const reduce = useReducedMotion()
  const first = pageRect(0, g)
  const last = pageRect(7, g)
  return (
    <g>
      {Array.from({ length: 8 }, (_, k) => {
        const r = pageRect(k, g)
        const rel = [1, 4, 6].includes(k)
        return (
          <motion.g key={k} initial={false} animate={show ? { x: r.x, y: r.y, opacity: 1 } : { x: g.doc.x, y: g.doc.y, opacity: 0 }} transition={{ ...objT, delay: show ? k * 0.06 : 0 }}>
            <rect width={r.w} height={r.h} rx={6} className={`fw-page${rel ? ' is-rel' : ''}`} />
          </motion.g>
        )
      })}
      {show && !reduce && (
        <motion.rect
          className="fw-scan"
          initial={g.P ? { x: last.x + last.w, y: first.y - 10, opacity: 0 } : { x: first.x - 10, y: first.y - 10, opacity: 0 }}
          animate={g.P ? { x: [last.x + last.w, first.x - 8], opacity: [0, 1, 1, 0] } : { y: [first.y - 10, last.y + last.h], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4, delay: 1.2, ease: 'linear' }}
          width={g.P ? 8 : first.w + 20}
          height={g.P ? first.h + 20 : 8}
        />
      )}
    </g>
  )
}

function Legend({ b, g }: { b: number; g: Geo }) {
  const show = b >= B.tokens && b <= B.retrieve && b !== B.compare3
  const srcs = ORDER.filter((s) => s !== 'doc' || b >= B.doc)
  const w = g.P ? 145 : 170
  const cx = g.F0.x + 300
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      {srcs.map((s, k) => {
        const x = cx + (srcs.length * w) / 2 - (k + 1) * w
        return (
          <g key={s} transform={`translate(${x} ${g.legendY})`}>
            <rect x={w - 26} y={-15} width={20} height={20} rx={4} className={`fw-tok ${s}`} />
            <text x={w - 36} y={2} className="fw-legend">{LABEL[s]}</text>
          </g>
        )
      })}
    </motion.g>
  )
}

function Ghosts({ show, g }: { show: boolean; g: Geo }) {
  const items = ['שיחות ישנות אחרות', 'קבצים אחרים בפרויקט', 'מסמכים שלא צורפו']
  const pos = g.P ? [{ x: 250, y: 130 }, { x: 650, y: 235 }, { x: 300, y: 340 }] : [{ x: 1480, y: 250 }, { x: 1480, y: 410 }, { x: 1480, y: 570 }]
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.9 }}>
      {items.map((t, k) => (
        <g key={t} transform={`translate(${pos[k]!.x} ${pos[k]!.y})`}>
          <rect x={-150} y={-34} width={300} height={68} rx={12} className="fw-ghost" />
          <text y={8} className="fw-ghost-text">{t}</text>
        </g>
      ))}
    </motion.g>
  )
}

function FlowLine({ show, g, flowing }: { show: boolean; g: Geo; flowing: boolean }) {
  const d = g.P ? `M450 ${g.F0.y + 640} V${g.model.y - 110}` : `M${g.F0.x - 16} ${g.model.y} H${g.model.x + 112}`
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }}>
      <path d={d} className={`fw-flow${flowing ? ' is-flowing' : ''}`} />
    </motion.g>
  )
}

function Mini({ F, ids, dense, show, label }: { F: Rect; ids: string[]; dense: boolean; show: boolean; label: string }) {
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.8, delay: show ? 0.9 : 0 }}>
      <rect x={F.x} y={F.y} width={600} height={600} rx={18} className="fw-frame-bg fw-frame-static" />
      {ids.map((id, i) => {
        const p = slot(i, F)
        const src = id.split('-')[0]!
        return <rect key={id} x={p.x} y={p.y} width={TS} height={TS} rx={7} className={`fw-tok ${src}${dense && src === 'hist' ? ' dense' : ''}`} />
      })}
      <text className="fw-under" x={F.x + 300} y={F.y + 690}>{label}</text>
    </motion.g>
  )
}

function Questions({ show, g }: { show: boolean; g: Geo }) {
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      {[g.FC, g.FN].map((F, k) => (
        <g key={k} transform={`translate(${F.x + 300} ${F.y - 92})`}>
          <rect x={-230} y={-26} width={460} height={52} rx={12} className="fw-card msg" />
          <text y={9} className="fw-card-text is-small">מה כתוב בדוח השנתי על ההכנסות?</text>
        </g>
      ))}
    </motion.g>
  )
}

// ---------- scene 9 pieces ----------
function Drawer({ b, g }: { b: number; g: Geo }) {
  const d = g.drawer
  const show = b >= B.ctx && b <= B.noAuto
  const active = b >= B.memSave
  return (
    <motion.g initial={false} animate={{ opacity: show ? (active ? 1 : 0.45) : 0 }} transition={{ duration: 0.7 }}>
      <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={16} className="fw-drawer" />
      <text x={d.x + d.w / 2} y={d.y + 42} className="fw-drawer-title">Memory</text>
      <text x={d.x + d.w / 2} y={d.y + 76} className="fw-drawer-sub">מערכת חיצונית · מחוץ למודל</text>
    </motion.g>
  )
}

function Preference({ b, g }: { b: number; g: Geo }) {
  const inCtx = { x: g.F9.x + 300, y: g.F9.y + 80 }
  const inDrawer = { x: g.drawer.x + g.drawer.w / 2, y: g.drawer.y + g.drawer.h - 62 }
  const original =
    b < B.ctx ? { ...inCtx, y: inCtx.y - 120, o: 0 }
    : b < B.chatEnd ? { ...inCtx, o: 1 }
    : { ...inCtx, y: inCtx.y + 320, o: 0 }
  const copy =
    b < B.memSave ? { ...inCtx, o: 0 }
    : b < B.memBack ? { ...inDrawer, o: 1 }
    : b <= B.noAuto ? { ...inCtx, o: 1 }
    : { ...inCtx, o: 0 }
  const scale = g.P ? 0.8 : 0.58
  const body = (
    <>
      <rect x={-230} y={-34} width={460} height={68} rx={14} className="fw-card msg" />
      <rect x={216} y={-34} width={14} height={68} className="fw-card-edge msg" />
      <text y={9} className="fw-card-text">"אני מעדיף תשובות קצרות"</text>
    </>
  )
  // Memory keeps its stored copy; retrieval puts another copy into the new context.
  const stored = b >= B.memSave && b <= B.noAuto
  return (
    <>
      <motion.g
        initial={false}
        animate={{ x: inDrawer.x, y: inDrawer.y, opacity: stored ? 1 : 0, scale }}
        transition={{ duration: 0.4, delay: b === B.memSave ? 1.6 : 0 }}
      >
        {body}
      </motion.g>
      <motion.g initial={false} animate={{ x: original.x, y: original.y, opacity: original.o }} transition={objT}>{body}</motion.g>
      <motion.g
        initial={false}
        animate={{ x: copy.x, y: copy.y, opacity: copy.o, scale: b >= B.memSave && b < B.memBack ? scale : 1 }}
        transition={{ ...objT, delay: b === B.memSave || b === B.memBack ? 0.6 : 0 }}
      >
        {body}
      </motion.g>
    </>
  )
}

function TrainingBand({ b, g }: { b: number; g: Geo }) {
  const r = g.band
  const show = b >= B.training && b <= B.noAuto
  const reduce = useReducedMotion()
  const m = g.model9
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.8 }}>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={18} className="fw-band" />
      <text x={r.x + r.w - 30} y={r.y + 48} className="fw-band-title">Training · אימון</text>
      <text x={r.x + r.w - 30} y={r.y + 84} className="fw-band-sub">תהליך נפרד, עם נתונים משלו</text>
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={r.x + 40 + i * 40}
          y={r.y + r.h / 2 - 12}
          width={24}
          height={24}
          rx={4}
          className="fw-data"
          style={reduce ? undefined : ({ animationDelay: `${i * 0.18}s` } as CSSProperties)}
        />
      ))}
      <path d={g.P ? `M${r.x + 60} ${r.y + r.h} V${m.y - 110}` : `M${m.x} ${r.y + r.h} V${m.y - 110}`} className="fw-band-link" />
    </motion.g>
  )
}

function NoAuto({ b, g }: { b: number; g: Geo }) {
  const show = b === B.noAuto
  const x = g.F9.x + 300
  const y1 = g.F9.y - 60
  const y2 = g.band.y + g.band.h + 14
  const mid = (y1 + y2) / 2
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      <path d={`M${x} ${y1} V${y2}`} className="fw-blocked" />
      <g transform={`translate(${x} ${mid})`}>
        <circle r={26} className="fw-x-bg" />
        <path d="M-11 -11 L11 11 M11 -11 L-11 11" className="fw-x" />
      </g>
    </motion.g>
  )
}

