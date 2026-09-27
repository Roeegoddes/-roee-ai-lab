import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ContextColumn, sumTokens, type Block } from './ContextColumn'
import { ModelBox } from './ModelBox'
import { Caption, StepControls, TokenStream, kindsByShare, useT } from './shared'

// The relevant information is identical in A and B. B only adds material around it.
const SYS: Block = { id: 'sys', kind: 'instructions', tokens: 5, label: 'הוראות' }
const FILE: Block = { id: 'file', kind: 'file', tokens: 8, label: 'הקטע הרלוונטי' }
const Q: Block = { id: 'q', kind: 'message', tokens: 5, label: 'השאלה' }

const IRR1: Block = { id: 'irr1', kind: 'noise', tokens: 9, label: 'לא קשור', variant: 'noise' }
const DUP: Block = { id: 'dup', kind: 'file', tokens: 8, label: 'אותו קטע שוב', tag: 'כפילות', variant: 'dup' }
const OLD: Block = { id: 'old', kind: 'file', tokens: 8, label: 'גרסה ישנה של הקטע', tag: 'ישן', variant: 'old' }
const IRR2: Block = { id: 'irr2', kind: 'noise', tokens: 12, label: 'לא קשור', variant: 'noise' }
const CONFLICT: Block = { id: 'conflict', kind: 'instructions', tokens: 5, label: 'הוראה סותרת', tag: 'סותר', variant: 'conflict' }
const IRR3: Block = { id: 'irr3', kind: 'noise', tokens: 7, label: 'לא קשור', variant: 'noise' }

const A = [SYS, FILE, Q]
const B = [SYS, IRR1, FILE, DUP, OLD, IRR2, CONFLICT, IRR3, Q]
// Schematic scale for this experiment (not a 100K window).
const CAP = 70

const CAPTIONS = [
  'אותה שאלה, אותו מודל. בשני המקרים יש בדיוק את אותו מידע רלוונטי.',
  'ב-B נוסף עוד הרבה: כפילויות, מידע לא קשור, מידע ישן ומידע סותר.',
  'שני ה-Context נכנסים לאותו מודל.',
  'המידע הרלוונטי עדיין נמצא ב-B — אבל מוקף בכל השאר.',
  '',
]

const LEGEND: { variant: NonNullable<Block['variant']>; kind: Block['kind']; label: string }[] = [
  { variant: 'dup', kind: 'file', label: 'כפילות' },
  { variant: 'noise', kind: 'noise', label: 'לא קשור' },
  { variant: 'old', kind: 'file', label: 'ישן' },
  { variant: 'conflict', kind: 'instructions', label: 'סותר' },
]

export function MoreIsNotBetter() {
  const [step, setStep] = useState(0)
  const t = useT()
  const bBlocks = step === 0 ? A : B
  const highlight = step >= 3
  const mark = (blocks: Block[]) => blocks.map((b) => (highlight && A.includes(b) ? { ...b, highlight: true } : b))
  const flowing = step >= 2

  return (
    <div className="cw-s4">
      <div className="cw-s4-lanes">
        <Lane name="A" title="Context קטן ורלוונטי" blocks={mark(A)} flowing={flowing} />
        <Lane name="B" title="Context גדול ורועש" blocks={mark(bBlocks)} flowing={flowing} />
      </div>

      <AnimatePresence>
        {step === 1 && (
          <motion.ul className="cw-legend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t({ duration: 0.2 })}>
            {LEGEND.map((l) => (
              <li key={l.variant}>
                <span className={`cw-swatch cw-block cw-k-${l.kind} is-${l.variant}`} />
                {l.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {step >= 3 && <Consequences />}

      {step === 4 ? (
        <motion.div className="cw-takeaway" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t({ duration: 0.4 })}>
          <p className="cw-takeaway-main">
            יותר Context <span className="cw-neq">≠</span> בהכרח תשובה טובה יותר
          </p>
          <p className="cw-takeaway-sub">המטרה היא לא למלא את החלון. המטרה היא להכניס את המידע הנכון.</p>
        </motion.div>
      ) : (
        <Caption id={step}>{CAPTIONS[step]}</Caption>
      )}

      <StepControls step={step} count={CAPTIONS.length} onStep={setStep} />
    </div>
  )
}

function Lane({ name, title, blocks, flowing }: { name: string; title: string; blocks: Block[]; flowing: boolean }) {
  return (
    <div className="cw-lane">
      <div className="cw-lane-head">
        <span className="num cw-lane-name">{name}</span>
        <span>{title}</span>
      </div>
      <ContextColumn className="cw-h-md" blocks={blocks} capacity={CAP} />
      <TokenStream kinds={kindsByShare(blocks, Math.round(sumTokens(blocks) / 3))} run={flowing} vertical />
      <ModelBox input={flowing ? blocks : undefined} capacity={CAP} />
    </div>
  )
}

const aTokens = sumTokens(A)
const bTokens = sumTokens(B)
const bNoise = B.filter((b) => b.variant).length

function Consequences() {
  const t = useT()
  const rows: { label: string; a: ReactNode; b: ReactNode }[] = [
    { label: 'Tokens לעיבוד', a: <Bar pct={(aTokens / CAP) * 100} />, b: <Bar pct={(bTokens / CAP) * 100} /> },
    { label: 'רעש', a: <Marks count={0} />, b: <Marks count={bNoise} /> },
    { label: 'מידע מתחרה', a: <Marks count={0} sym="≠" />, b: <Marks count={2} sym="≠" /> },
    { label: 'עבודה ועלות', a: <Bar pct={(aTokens / CAP) * 100} soft />, b: <Bar pct={(bTokens / CAP) * 100} soft /> },
  ]
  return (
    <motion.div className="cw-cmp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t({ duration: 0.3 })}>
      <div className="cw-cmp-head" aria-hidden="true">
        <span />
        <span className="num">A</span>
        <span className="num">B</span>
      </div>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          className="cw-cmp-row"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={t({ duration: 0.3, delay: 0.15 * i })}
        >
          <span className="cw-cmp-label">{r.label}</span>
          <span>{r.a}</span>
          <span>{r.b}</span>
        </motion.div>
      ))}
      <p className="cw-cmp-note">
        השוואה מושגית, בלי מספרים. עלות וזמן עיבוד בדרך כלל גדלים עם כמות ה-Tokens. זה לא אומר שכל תשובה מ-B תהיה
        גרועה יותר — אלא שיש יותר מה לסנן, ויותר דרכים לטעות.
      </p>
    </motion.div>
  )
}

function Bar({ pct, soft = false }: { pct: number; soft?: boolean }) {
  const t = useT()
  return (
    <span className={`cw-bar${soft ? ' is-soft' : ''}`}>
      <motion.span initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={t({ duration: 0.6, delay: 0.3 })} />
    </span>
  )
}

function Marks({ count, sym = '■' }: { count: number; sym?: string }) {
  if (count === 0) return <span className="cw-marks is-none">—</span>
  return (
    <span className="cw-marks" data-sym={sym === '≠' ? 'neq' : undefined}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{sym}</span>
      ))}
    </span>
  )
}
