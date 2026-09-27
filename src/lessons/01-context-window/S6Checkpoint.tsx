import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ContextColumn, Readout, sumTokens, type Block } from './ContextColumn'
import { useT } from './shared'

type Choice = 'all' | 'retrieve' | 'summarize' | 'clear'

const SYS: Block = { id: 'sys', kind: 'instructions', tokens: 6, label: 'הוראות', size: true }
const HIST_OLD: Block = { id: 'hist-old', kind: 'history', tokens: 40, label: 'שיחה ישנה', size: true }
const HIST_NEW: Block = { id: 'hist-new', kind: 'history', tokens: 6, label: 'שיחה אחרונה', size: true }
const FILES: Block = { id: 'files', kind: 'file', tokens: 30, label: 'קבצים', size: true }
const REPORT: Block = { id: 'report', kind: 'document', tokens: 50, label: 'דוח שנתי', size: true }
const SECTIONS: Block = { id: 'sections', kind: 'document', tokens: 6, label: 'קטעים רלוונטיים מהדוח', size: true }
const SUMMARY: Block = { id: 'summary', kind: 'document', tokens: 8, label: 'סיכום הדוח', tag: 'סיכום', size: true }

const BASE = [SYS, HIST_OLD, HIST_NEW, FILES]

const CHOICES: { id: Choice; text: string; blocks: Block[]; reply: string }[] = [
  {
    id: 'all',
    text: 'להכניס את כל הדוח',
    blocks: [...BASE, REPORT],
    reply:
      'לא נכנס: 82K ועוד 50K הם 132K. מה יקרה תלוי במערכת — שגיאה, קיצוץ אוטומטי או משהו אחר. בכל מקרה, לא אתה בוחר מה נשאר.',
  },
  {
    id: 'retrieve',
    text: 'לשלוף רק את הקטעים שקשורים לשאלה',
    blocks: [...BASE, SECTIONS],
    reply:
      'לשאלה אחת, סביר שרק חלק קטן מהדוח רלוונטי. זה נכנס בנוחות — בתנאי שהשליפה מוצאת את הקטעים הנכונים.',
  },
  {
    id: 'summarize',
    text: 'לסכם את הדוח ולהכניס את הסיכום',
    blocks: [...BASE, SUMMARY],
    reply: 'נכנס. אבל סיכום כללי נכתב בלי לדעת מה השאלה, ועלול להשמיט בדיוק את הפרט שצריך.',
  },
  {
    id: 'clear',
    text: 'לפנות Context ישן, ואז להכניס את כל הדוח',
    blocks: [SYS, HIST_NEW, FILES, REPORT],
    reply:
      'אם השיחה הישנה באמת לא נחוצה — זה עובד. אבל הדוח עדיין תופס חצי חלון בשביל שאלה אחת, ומה שהוסר כבר לא זמין.',
  },
]

export function Checkpoint() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [tried, setTried] = useState<Choice[]>([])
  const t = useT()
  const current = CHOICES.find((c) => c.id === choice)
  const blocks = current?.blocks ?? BASE
  const total = sumTokens(blocks)

  const choose = (c: Choice) => {
    setChoice(c)
    if (!tried.includes(c)) setTried([...tried, c])
  }

  return (
    <div className="cw-s6">
      <div className="cw-scenario">
        <span className="num cw-scenario-tag">SCENARIO</span>
        <p>
          יש לך Context Window של <span className="num">100K</span>. <span className="num">82K</span> כבר תפוסים. אתה צריך
          לענות על שאלה אחת מתוך דוח שנתי של <span className="num">50K</span> Tokens.
        </p>
      </div>

      <div className="cw-s6-grid">
        <div className="cw-s6-vis">
          <ContextColumn className="cw-h-md" blocks={blocks} ruler headroom={0.36} label="CONTEXT" />
          <div className="cw-s6-report" data-used={choice !== null || undefined}>
            <div className="cw-col-label num">OUTSIDE</div>
            <div className="cw-ghost cw-k-document cw-report">
              <span className="cw-block-code num">DOC</span>
              <span>דוח שנתי</span>
              <span className="num">50K</span>
            </div>
          </div>
        </div>

        <div className="cw-s6-panel">
          <Readout total={total} />
          <p className="cw-question">מה היית עושה?</p>
          <div className="cw-options" role="group" aria-label="אפשרויות">
            {CHOICES.map((c, i) => (
              <button key={c.id} type="button" className="cw-option" aria-pressed={choice === c.id} onClick={() => choose(c.id)}>
                <span className="num cw-option-key">{String.fromCharCode(65 + i)}</span>
                <span>{c.text}</span>
                {tried.includes(c.id) && choice !== c.id && <span className="cw-option-mark">נוסה</span>}
              </button>
            ))}
          </div>
          <div className="cw-explain" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {current && (
                <motion.p
                  key={current.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={t({ duration: 0.2, delay: 0.2 })}
                >
                  {current.reply}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          {tried.length >= 2 && (
            <p className="cw-insight">אין כאן תשובה אחת. השאלה היא מה המשימה באמת צריכה ב-Context.</p>
          )}
        </div>
      </div>
      <p className="cw-footnote">גודל הקטעים והסיכום להמחשה.</p>
    </div>
  )
}
