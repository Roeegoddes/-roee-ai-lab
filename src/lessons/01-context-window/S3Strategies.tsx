import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ContextColumn, Readout, sumTokens, type Block } from './ContextColumn'
import { KIND_CODE, useT, type Kind } from './shared'

type Strategy = 'remove' | 'compress' | 'retrieve'

// Illustrative sizes. The baseline is the overflow from the previous stage (105K).
const PROJ: Block = { id: 'proj', kind: 'instructions', tokens: 7, label: 'הוראות פרויקט', size: true }
const HIST_OLD: Block = { id: 'hist-old', kind: 'history', tokens: 12, label: 'שיחה ישנה', size: true }
const HIST_NEW: Block = { id: 'hist-new', kind: 'history', tokens: 6, label: 'שיחה אחרונה', size: true }
const HIST_SUM: Block = { id: 'hist-sum', kind: 'history', tokens: 4, label: 'סיכום השיחה', tag: 'סיכום', size: true }
const CODE: Block = { id: 'code', kind: 'file', tokens: 25, label: 'קוד וקבצים', size: true }
const TOOL: Block = { id: 'tool', kind: 'tool', tokens: 15, label: 'תוצאת חיפוש / כלי', size: true }
const RELEVANT = [1, 4, 6]
const docSections = (onlyRelevant: boolean): Block[] =>
  Array.from({ length: 8 }, (_, i) => i)
    .filter((i) => !onlyRelevant || RELEVANT.includes(i))
    .map((i, n) => ({
      id: `doc-${i}`,
      kind: 'document' as const,
      tokens: 5,
      label: n === 0 ? (onlyRelevant ? 'קטעים רלוונטיים · 15K' : 'מסמך גדול · 40K') : undefined,
      tag: onlyRelevant ? 'רלוונטי' : undefined,
    }))

function blocksFor(s: Strategy | null): Block[] {
  const hist = s === 'remove' ? [HIST_NEW] : s === 'compress' ? [HIST_SUM] : [HIST_OLD, HIST_NEW]
  return [PROJ, ...hist, CODE, TOOL, ...docSections(s === 'retrieve')]
}

const OUTSIDE: Record<Strategy, { kind: Kind; tokens: number; label: string }> = {
  remove: { kind: 'history', tokens: 12, label: 'שיחה ישנה' },
  compress: { kind: 'history', tokens: 18, label: 'השיחה המלאה, לפני הסיכום' },
  retrieve: { kind: 'document', tokens: 25, label: '5 קטעים שלא נשלפו' },
}

const INFO: Record<Strategy, { title: string; does: string; fits: string; cost: string }> = {
  remove: {
    title: 'להסיר Context ישן ולא רלוונטי',
    does: 'השיחה הישנה יוצאת מהחלון.',
    fits: 'מתאים כשהחלק הישן באמת לא קשור למשימה.',
    cost: 'מה שהוסר כבר לא זמין למודל. אם היה בו משהו חשוב — הוא חסר.',
  },
  compress: {
    title: 'לסכם / לדחוס מידע',
    does: 'השיחה (18K) הופכת לסיכום קצר (4K).',
    fits: 'מתאים כשצריך את התמונה הכללית, לא כל פרט.',
    cost: 'סיכום מאבד פרטים. מה שלא נכנס לסיכום — המודל לא יראה.',
  },
  retrieve: {
    title: 'לשלוף רק את הקטעים הרלוונטיים',
    does: 'מתוך המסמך נכנסים רק 3 קטעים (15K) במקום 40K.',
    fits: 'מתאים כשיש שאלה ממוקדת על מסמך גדול.',
    cost: 'תלוי באיכות השליפה. קטע חשוב שלא נשלף — לא יהיה ב-Context.',
  },
}

const ORDER: Strategy[] = ['remove', 'compress', 'retrieve']

export function Strategies() {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [tried, setTried] = useState<Strategy[]>([])
  const t = useT()
  const blocks = blocksFor(strategy)
  const total = sumTokens(blocks)
  const info = strategy ? INFO[strategy] : null
  const outside = strategy ? OUTSIDE[strategy] : null

  const choose = (s: Strategy) => {
    setStrategy(s)
    if (!tried.includes(s)) setTried([...tried, s])
  }

  return (
    <div className="cw-s3">
      <p className="cw-lead">
        <span className="num">105K</span> לא נכנסים ב-<span className="num">100K</span>. נסה כל אחת מהפעולות וראה מה היא עושה
        ל-Context.
      </p>
      <div className="cw-s3-grid">
        <div className="cw-s3-vis">
          <ContextColumn className="cw-h-lg" blocks={blocks} ruler headroom={0.1} label="CONTEXT" />
          <div className="cw-shelf">
            <div className="cw-col-label num">OUTSIDE</div>
            <div className="cw-shelf-area">
              <AnimatePresence mode="popLayout">
                {outside && (
                  <motion.div
                    key={strategy}
                    className={`cw-ghost cw-k-${outside.kind}`}
                    style={{ '--tokens': outside.tokens } as CSSProperties}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={t({ duration: 0.4, delay: 0.15 })}
                  >
                    <span className="cw-block-code num">{KIND_CODE[outside.kind]}</span>
                    <span>{outside.label}</span>
                    <span className="num">{outside.tokens}K</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="cw-shelf-note">מחוץ ל-Context — המודל לא רואה את זה.</p>
            </div>
          </div>
        </div>

        <div className="cw-s3-panel">
          <Readout total={total} />
          <div className="cw-options" role="group" aria-label="פעולות">
            {ORDER.map((s, i) => (
              <button
                key={s}
                type="button"
                className="cw-option"
                aria-pressed={strategy === s}
                onClick={() => choose(s)}
              >
                <span className="num cw-option-key">{String.fromCharCode(65 + i)}</span>
                <span>{INFO[s].title}</span>
                {tried.includes(s) && strategy !== s && <span className="cw-option-mark">נוסה</span>}
              </button>
            ))}
          </div>

          <div className="cw-explain" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {info ? (
                <motion.dl
                  key={strategy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={t({ duration: 0.2 })}
                >
                  <div><dt>מה קרה</dt><dd>{info.does}</dd></div>
                  <div><dt>מתי זה הגיוני</dt><dd>{info.fits}</dd></div>
                  <div><dt>המחיר</dt><dd>{info.cost}</dd></div>
                </motion.dl>
              ) : (
                <motion.p key="none" className="cw-muted" exit={{ opacity: 0 }}>
                  בחר פעולה.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {strategy && (
            <button type="button" className="cw-btn" onClick={() => setStrategy(null)}>
              ↺ חזרה למצב המלא
            </button>
          )}

          <AnimatePresence>
            {tried.length >= 2 && (
              <motion.p
                className="cw-insight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={t({ duration: 0.3 })}
              >
                כל הפעולות פתרו את החריגה — אבל כל אחת השאירה ב-Context משהו אחר. המשימה קובעת מה צריך להישאר.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="cw-footnote">הגדלים להמחשה.</p>
    </div>
  )
}
