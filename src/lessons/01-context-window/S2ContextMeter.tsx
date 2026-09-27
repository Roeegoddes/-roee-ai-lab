import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ContextColumn, Readout, sumTokens, type Block } from './ContextColumn'
import { useExhibit } from './Exhibit'
import { KIND_CODE, useT } from './shared'

export const METER_ITEMS: Block[] = [
  { id: 'hist', kind: 'history', tokens: 18, label: 'היסטוריית שיחה', size: true },
  { id: 'proj', kind: 'instructions', tokens: 7, label: 'הוראות פרויקט', size: true },
  { id: 'code', kind: 'file', tokens: 25, label: 'קוד וקבצים', size: true },
  { id: 'tool', kind: 'tool', tokens: 15, label: 'תוצאת חיפוש / כלי', size: true },
  { id: 'doc', kind: 'document', tokens: 40, label: 'מסמך גדול', size: true },
]

const CAPACITY = 100

export function ContextMeter() {
  const [order, setOrder] = useState<string[]>([])
  const [shakeKey, setShakeKey] = useState(0)
  const { index, goTo } = useExhibit()
  const t = useT()
  const reduce = useReducedMotion()
  const decisionRef = useRef<HTMLDivElement>(null)

  const blocks = order.flatMap((id) => METER_ITEMS.filter((it) => it.id === id))
  const total = sumTokens(blocks)
  const overflowing = total > CAPACITY

  const toggle = (item: Block) => {
    if (order.includes(item.id)) {
      setOrder(order.filter((id) => id !== item.id))
      return
    }
    setOrder([...order, item.id])
    if (total + item.tokens > CAPACITY) setShakeKey((k) => k + 1)
  }

  return (
    <div className="cw-s2">
      <p className="cw-lead">
        Context Window של <span className="num">100K</span> Tokens. הוסף פריטים וראה כמה מקום כל אחד תופס.
      </p>
      <div className="cw-s2-grid">
        <ContextColumn className="cw-h-lg" blocks={blocks} ruler headroom={0.1} shakeKey={shakeKey} />

        <div className="cw-s2-panel">
          <Readout total={total} capacity={CAPACITY} />

          <AnimatePresence>
            {overflowing && (
              <motion.div
                className="cw-decision"
                role="alert"
                onAnimationComplete={(def) => {
                  // On narrow screens the decision can sit below the fold.
                  if (typeof def === 'object' && 'y' in def) decisionRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
                }}
                ref={decisionRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={t({ duration: 0.25, delay: 0.35 })}
              >
                <p className="cw-decision-title">
                  לא נכנס. <span className="num">{total}K</span> בחלון של <span className="num">100K</span>.
                </p>
                <p className="cw-muted">
                  מה קורה במצב כזה תלוי במערכת: יש שיחזירו שגיאה, יש שיקצצו או יסכמו תוכן ישן באופן אוטומטי.
                  כאן — ההחלטה שלך.
                </p>
                <div className="cw-row">
                  <button type="button" className="cw-btn cw-btn-primary" onClick={() => goTo(index + 1)}>
                    להחליט מה עושים ←
                  </button>
                  <button type="button" className="cw-btn" onClick={() => setOrder(order.slice(0, -1))}>
                    לבטל את ההוספה
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ul className="cw-tray" aria-label="פריטים להוספה">
            {METER_ITEMS.map((item) => {
              const inside = order.includes(item.id)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`cw-tray-item cw-k-${item.kind}`}
                    aria-pressed={inside}
                    disabled={overflowing}
                    onClick={() => toggle(item)}
                  >
                    <span className="cw-tray-code num">{KIND_CODE[item.kind]}</span>
                    <span className="cw-tray-label">{item.label}</span>
                    <span className="cw-tray-size num">{item.tokens}K</span>
                    <span className="cw-tray-act">{inside ? 'הוצא' : '+ הוסף'}</span>
                  </button>
                </li>
              )
            })}
          </ul>

        </div>
      </div>
      <p className="cw-footnote">הגדלים לדוגמה.</p>
    </div>
  )
}
