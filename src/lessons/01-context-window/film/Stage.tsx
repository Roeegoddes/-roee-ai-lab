/*
  The film's stage: a table in soft shadow, a lens (the model) above it,
  and the pool of light it casts (the Context Window). Every object keeps
  its identity across beats; Motion moves it to where the beat puts it.
*/
import { memo, useMemo } from 'react'
import { motion, useReducedMotion, type Transition } from 'motion/react'
import { B } from './script'
import {
  CH, CW, LABEL, NOISY, ORDER, PILE_CHIPS, POOL, SLIP, TOKENS,
  camera, chipState, ctxIds, docState, frag, lensAt, mainPool, noisyState, pageRect, pileState, slipState, slot,
  type Geo, type Pt, type Rect, type SlipState, type Src,
} from './scene'

const camT: Transition = { duration: 2, ease: [0.45, 0, 0.15, 1] }
const objT: Transition = { type: 'spring', stiffness: 50, damping: 15 }
const chipT = (delay: number): Transition => ({ type: 'spring', stiffness: 70, damping: 14, delay })

export const Stage = memo(function Stage({ b, g }: { b: number; g: Geo }) {
  const cam = camera(b, g)
  const index = useMemo(() => new Map(ctxIds(b).map((id, i) => [id, i])), [b])
  const F = mainPool(b, g)
  const lens = lensAt(b, g)
  const lit = b >= B.frame
  const lensShown = b >= B.toModel && b !== B.compare3
  const trained = b >= B.training && b <= B.noAuto
  const tag = b >= B.weights && b <= B.noAuto ? (trained ? 'Weights · עוצבו מחדש באימון' : 'Weights · ללא שינוי') : ''
  const over = b === B.overflow || b === B.rew1 || b === B.rew2
  const split = b >= B.split && b <= B.goal

  const poolLabel =
    b === B.compare3 ? ''
    : b < B.split ? 'CONTEXT WINDOW'
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
        <defs>
          <radialGradient id="fw-light" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#fffdf6" />
            <stop offset="100%" stopColor="#fbf6ea" />
          </radialGradient>
          <linearGradient id="fw-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffaf0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fffaf0" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* scene 9: the separate training process, and memory outside the light */}
        <TrainingLane b={b} g={g} lens={lens} />
        <MemoryBox b={b} g={g} />

        {/* things in the product that were NOT sent: they stay in the shadow */}
        <Ghosts show={b >= B.outside && b <= B.filled} g={g} />

        {/* light: one beam per pool */}
        <Beam lens={lens} F={F} show={lit && b !== B.compare3} />
        <Beam lens={lens} F={g.FN} show={split} />
        <Pool F={F} show={lit} label={poolLabel} spill={over} />
        <Pool F={g.FN} show={split} label="עמוס" spill={false} enter={{ ...g.FN, y: g.FN.y + 40 }} />
        {g.minis.map((m, k) => (
          <MiniPool key={k} F={m} ids={ctxIds(k === 0 ? B.remove : B.compress)} dense={k === 1} show={b === B.compare3} label={k === 0 ? 'הסרה' : 'דחיסה'} />
        ))}
        <motion.text className="fw-under" initial={false} animate={{ opacity: b === B.compare3 ? 1 : 0 }} x={g.F0.x + POOL.w / 2} y={g.F0.y + POOL.h + 70}>
          שליפה
        </motion.text>
        <Questions show={split} g={g} />

        <Lens at={lens} show={lensShown} trained={trained} tag={tag} />

        {/* document, its pages, and the scan that picks relevant pages */}
        <Pages b={b} g={g} />
        <Doc b={b} g={g} />

        {/* paper slips */}
        {(['sys', 'hist', 'file', 'tool'] as Src[]).map((src) => (
          <Slip key={src} src={src} st={slipState(src, b, g)} text={LABEL[src]} />
        ))}
        <Slip src="msg" st={slipState('msg', b, g)} text="מה כתוב בדוח השנתי על ההכנסות?" />

        <Legend b={b} g={g} />

        {/* tokens */}
        {TOKENS.map((tok) => {
          const st = chipState(tok, b, g, index)
          return <Chip key={tok.id} id={tok.id} {...st} />
        })}
        {NOISY.map((n) => <Chip key={n.id} id={n.id} text={n.text} {...noisyState(n, b, g)} />)}
        {PILE_CHIPS.map((p) => <Chip key={p.id} id={p.id} text={p.text} {...pileState(p, b, g)} />)}

        <Preference b={b} g={g} />
        <NoAuto b={b} g={g} />
      </svg>
    </motion.div>
  )
})

// ---------- tokens ----------
function Chip({ id, x, y, s, o, r, cls, delay, text }: { id: string; x: number; y: number; s: number; o: number; r: number; cls: string; delay: number; text: string }) {
  return (
    <motion.g data-id={id} className={`fw-chip ${cls}`} initial={false} animate={{ x, y, scale: s, opacity: o, rotate: r }} transition={chipT(delay)}>
      <rect width={CW} height={CH} rx={7} className="fw-chip-body" />
      <text x={CW / 2} y={CH / 2 + 6} className="fw-chip-text">{text}</text>
    </motion.g>
  )
}

// ---------- light ----------
function beamPoints(lens: Pt, F: Rect) {
  const below = F.y > lens.y
  const ly = lens.y + (below ? 46 : -46)
  const ey = below ? F.y : F.y + F.h
  return `${lens.x - 30},${ly} ${lens.x + 30},${ly} ${F.x + F.w},${ey} ${F.x},${ey}`
}
function Beam({ lens, F, show }: { lens: Pt; F: Rect; show: boolean }) {
  return (
    <motion.polygon
      className="fw-beam"
      initial={false}
      animate={{ points: beamPoints(lens, F), opacity: show ? 1 : 0 }}
      transition={{ ...camT, opacity: { duration: 1.4 } }}
    />
  )
}

function Pool({ F, show, label, spill, enter }: { F: Rect; show: boolean; label: string; spill: boolean; enter?: Rect }) {
  return (
    <motion.g initial={enter ? { x: enter.x, y: enter.y, opacity: 0 } : false} animate={{ x: F.x, y: F.y, opacity: show ? 1 : 0 }} transition={{ ...objT, opacity: { duration: 1.2 } }}>
      <rect x={-14} y={-14} width={POOL.w + 28} height={POOL.h + 28} rx={40} className="fw-pool-halo" />
      <rect width={POOL.w} height={POOL.h} rx={26} className="fw-pool" />
      {Array.from({ length: 9 }, (_, k) => (
        <line key={k} x1={18} x2={POOL.w - 18} y1={10 + (k + 1) * 40 - 3} y2={10 + (k + 1) * 40 - 3} className="fw-pool-rule" />
      ))}
      <motion.path
        d={`M24 ${POOL.h} H${POOL.w - 24}`}
        className="fw-pool-edge"
        initial={false}
        animate={{ opacity: spill ? 1 : 0 }}
      />
      <text x={POOL.w / 2} y={-30} className="fw-pool-label">{label}</text>
    </motion.g>
  )
}

function MiniPool({ F, ids, dense, show, label }: { F: Rect; ids: string[]; dense: boolean; show: boolean; label: string }) {
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.9, delay: show ? 1 : 0 }}>
      <rect x={F.x} y={F.y} width={POOL.w} height={POOL.h} rx={26} className="fw-pool" />
      {ids.map((id, i) => {
        const p = slot(i, F)
        const [src, j] = id.split('-') as [Src, string]
        return (
          <g key={id} transform={`translate(${p.x} ${p.y})`} className={`fw-chip ${src}${dense && src === 'hist' ? ' dense' : ''}`}>
            <rect width={CW} height={CH} rx={7} className="fw-chip-body" />
            <text x={CW / 2} y={CH / 2 + 6} className="fw-chip-text">{dense && src === 'hist' ? '∑' : frag(src, +j)}</text>
          </g>
        )
      })}
      <text className="fw-under" x={F.x + POOL.w / 2} y={F.y + POOL.h + 70}>{label}</text>
    </motion.g>
  )
}

// ---------- the model: a lens ----------
function Lens({ at, show, trained, tag }: { at: Pt; show: boolean; trained: boolean; tag: string }) {
  return (
    <motion.g initial={false} animate={{ x: at.x, y: at.y, opacity: show ? 1 : 0 }} transition={objT}>
      <circle r={62} className="fw-lens-rim" />
      <circle r={50} className="fw-lens" />
      <motion.g initial={false} animate={{ rotate: trained ? 38 : 0 }} transition={{ duration: 2.4, ease: [0.5, 0, 0.2, 1] }}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x={-5}
            y={-42}
            width={10}
            height={24}
            rx={3}
            transform={`rotate(${i * 36})`}
            className={`fw-facet f${trained ? (i * 3 + 1) % 4 : (i * 7 + 2) % 4}`}
          />
        ))}
        <circle r={10} className="fw-facet f3" />
      </motion.g>
      <text x={-84} y={4} className="fw-lens-label">מודל</text>
      <text x={-84} y={40} className="fw-tag">{tag}</text>
    </motion.g>
  )
}

// ---------- paper ----------
function Slip({ src, st, text }: { src: Src; st: SlipState; text: string }) {
  return (
    <motion.g className="fw-paper" initial={false} animate={{ x: st.x, y: st.y, opacity: st.o, scale: st.s, rotate: st.r }} transition={objT}>
      <rect x={-SLIP.w / 2} y={-SLIP.h / 2} width={SLIP.w} height={SLIP.h} rx={6} className="fw-slip" />
      <rect x={SLIP.w / 2 - 12} y={-SLIP.h / 2} width={12} height={SLIP.h} className={`fw-slip-tab ${src}`} />
      <text x={SLIP.w / 2 - 34} y={9} className={`fw-slip-text${src === 'msg' ? ' is-msg' : ''}`}>{text}</text>
    </motion.g>
  )
}

function Doc({ b, g }: { b: number; g: Geo }) {
  const d = docState(b, g)
  return (
    <motion.g className="fw-paper" initial={false} animate={{ x: d.x, y: d.y, opacity: d.o, rotate: d.r }} transition={objT}>
      {[2, 1, 0].map((k) => (
        <rect key={k} x={k * 7} y={k * 7} width={d.w} height={d.h} rx={6} className={`fw-doc${d.empty ? ' is-empty' : ''}`} />
      ))}
      {!d.empty && Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={d.w - 24 - (d.w - 60 - (i % 3) * 18)} y={70 + i * 22} width={d.w - 60 - (i % 3) * 18} height={7} rx={3.5} className="fw-doc-line" />
      ))}
      <text x={d.w - 20} y={44} className="fw-doc-title">דוח שנתי</text>
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
          <motion.g key={k} className="fw-paper" initial={false} animate={show ? { x: r.x, y: r.y, opacity: 1 } : { x: g.doc.x, y: g.doc.y, opacity: 0 }} transition={{ ...objT, delay: show ? k * 0.07 : 0 }}>
            <rect width={r.w} height={r.h} rx={5} className={`fw-page${rel ? ' is-rel' : ''}`} />
          </motion.g>
        )
      })}
      {show && !reduce && (
        <motion.rect
          className="fw-scan"
          initial={{ opacity: 0 }}
          animate={g.P ? { x: [last.x + last.w, first.x - 8], y: first.y - 12, opacity: [0, 0.9, 0.9, 0] } : { y: [first.y - 12, last.y + last.h], x: first.x - 12, opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: 2.6, delay: 1.3, ease: 'linear' }}
          width={g.P ? 6 : first.w + 24}
          height={g.P ? first.h + 24 : 6}
          rx={3}
        />
      )}
    </g>
  )
}

function Legend({ b, g }: { b: number; g: Geo }) {
  const show = b >= B.tokens && b <= B.retrieve && b !== B.compare3
  const srcs = ORDER.filter((s) => s !== 'doc' || b >= B.doc)
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.8 }}>
      {srcs.map((s, k) => {
        const pos = g.P ? { x: 840 - (k % 3) * 270, y: 1400 + Math.floor(k / 3) * 46 } : { x: 440, y: 300 + k * 50 }
        return (
          <g key={s} transform={`translate(${pos.x} ${pos.y})`} className={`fw-chip ${s}`}>
            <rect x={-26} y={-16} width={26} height={20} rx={5} className="fw-chip-body" />
            <text x={-38} y={0} className="fw-legend">{LABEL[s]}</text>
          </g>
        )
      })}
    </motion.g>
  )
}

function Ghosts({ show, g }: { show: boolean; g: Geo }) {
  const items = ['שיחות ישנות אחרות', 'קבצים אחרים בפרויקט', 'מסמכים שלא צורפו']
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.1 }}>
      {items.map((t, k) => (
        <g key={t} transform={`translate(${g.ghosts[k]!.x} ${g.ghosts[k]!.y}) rotate(${[-3, 2, -1.5][k]})`}>
          <rect x={-140} y={-28} width={280} height={56} rx={6} className="fw-ghost" />
          <text y={7} className="fw-ghost-text">{t}</text>
        </g>
      ))}
    </motion.g>
  )
}

function Questions({ show, g }: { show: boolean; g: Geo }) {
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.8 }}>
      {[g.FC, g.FN].map((F, k) => {
        return (
          <g key={k} transform={`translate(${F.x + F.w / 2} ${F.y - 76})`} className="fw-paper">
            <rect x={-210} y={-24} width={420} height={48} rx={6} className="fw-slip" />
            <rect x={198} y={-24} width={12} height={48} className="fw-slip-tab msg" />
            <text x={176} y={8} className="fw-slip-text is-small">מה כתוב בדוח השנתי על ההכנסות?</text>
          </g>
        )
      })}
    </motion.g>
  )
}

// ---------- scene 9 ----------
function MemoryBox({ b, g }: { b: number; g: Geo }) {
  const d = g.drawer
  const show = b >= B.ctx && b <= B.noAuto
  const active = b >= B.memSave
  return (
    <motion.g initial={false} animate={{ opacity: show ? (active ? 1 : 0.5) : 0 }} transition={{ duration: 0.9 }}>
      <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={14} className="fw-box" />
      <rect x={d.x + 16} y={d.y + 92} width={d.w - 32} height={d.h - 108} rx={8} className="fw-box-well" />
      <text x={d.x + d.w - 22} y={d.y + 42} className="fw-box-title">Memory · זיכרון</text>
      <text x={d.x + d.w - 22} y={d.y + 72} className="fw-box-sub">מערכת חיצונית, מחוץ למודל</text>
    </motion.g>
  )
}

function Preference({ b, g }: { b: number; g: Geo }) {
  const inCtx = { x: g.F9.x + POOL.w / 2, y: g.F9.y + 230 }
  const inBox = { x: g.drawer.x + g.drawer.w / 2, y: g.drawer.y + g.drawer.h - 58 }
  const scale = g.P ? 0.78 : 0.64
  const original =
    b < B.ctx ? { ...inCtx, y: inCtx.y + 60, o: 0 }
    : b < B.chatEnd ? { ...inCtx, o: 1 }
    : { ...inCtx, y: inCtx.y + 60, o: 0 }
  const traveller =
    b < B.memSave ? { ...inCtx, o: 0, s: 1 }
    : b < B.memBack ? { ...inBox, o: 1, s: scale }
    : b <= B.noAuto ? { ...inCtx, o: 1, s: 1 }
    : { ...inCtx, o: 0, s: 1 }
  const stored = b >= B.memSave && b <= B.noAuto
  const body = (
    <>
      <rect x={-220} y={-28} width={440} height={56} rx={6} className="fw-slip" />
      <rect x={208} y={-28} width={12} height={56} className="fw-slip-tab msg" />
      <text x={186} y={9} className="fw-slip-text is-msg">"אני מעדיף תשובות קצרות"</text>
    </>
  )
  return (
    <>
      <motion.g className="fw-paper" initial={false} animate={{ x: inBox.x, y: inBox.y, opacity: stored ? 1 : 0, scale }} transition={{ duration: 0.4, delay: b === B.memSave ? 1.8 : 0 }}>
        {body}
      </motion.g>
      <motion.g className="fw-paper" initial={false} animate={{ x: original.x, y: original.y, opacity: original.o }} transition={objT}>{body}</motion.g>
      <motion.g
        className="fw-paper"
        initial={false}
        animate={{ x: traveller.x, y: traveller.y, opacity: traveller.o, scale: traveller.s }}
        transition={{ ...objT, delay: b === B.memSave || b === B.memBack ? 0.6 : 0 }}
      >
        {body}
      </motion.g>
    </>
  )
}

function TrainingLane({ b, g, lens }: { b: number; g: Geo; lens: Pt }) {
  const r = g.lane
  const show = b >= B.training && b <= B.noAuto
  const reduce = useReducedMotion()
  const link = g.P ? `M${r.x + 20} ${r.y} V${lens.y - 58} H${lens.x - 24}` : `M${r.x + r.w} ${lens.y - 58} H${lens.x - 24}`
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1 }}>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={20} className="fw-lane" />
      <text x={r.x + r.w - 24} y={r.y + 46} className="fw-lane-title">Training · אימון</text>
      <text x={r.x + r.w - 24} y={r.y + 80} className="fw-lane-sub">תהליך נפרד, עם נתונים משלו</text>
      {Array.from({ length: 18 }, (_, i) => (
        <rect
          key={i}
          x={r.x + 24 + (i % 6) * ((r.w - 48) / 6)}
          y={r.y + 120 + Math.floor(i / 6) * 44}
          width={(r.w - 48) / 6 - 8}
          height={30}
          rx={6}
          className="fw-data"
          style={reduce ? undefined : { animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <path d={link} className="fw-lane-link" />
    </motion.g>
  )
}

function NoAuto({ b, g }: { b: number; g: Geo }) {
  const show = b === B.noAuto
  const r = g.lane
  const from = g.P ? { x: g.F9.x + 120, y: g.F9.y + POOL.h + 14 } : { x: g.F9.x - 14, y: g.F9.y + POOL.h / 2 }
  const to = g.P ? { x: from.x, y: r.y - 14 } : { x: r.x + r.w + 14, y: from.y }
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.7 }}>
      <path d={`M${from.x} ${from.y} L${to.x} ${to.y}`} className="fw-blocked" />
      <g transform={`translate(${mid.x} ${mid.y})`}>
        <circle r={24} className="fw-x-bg" />
        <path d="M-10 -10 L10 10 M10 -10 L-10 10" className="fw-x" />
      </g>
    </motion.g>
  )
}

