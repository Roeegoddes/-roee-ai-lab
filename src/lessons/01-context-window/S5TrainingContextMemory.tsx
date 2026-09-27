import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ModelBox } from './ModelBox'
import { Caption, StepControls, TokenStream, useT } from './shared'

type Place = 'context' | 'memory' | null

const STEPS: { at: Place; convo: string; caption: string }[] = [
  { at: null, convo: '', caption: 'שלושה דברים שונים שקל לבלבל ביניהם. עקוב אחרי פיסת מידע אחת.' },
  {
    at: 'context',
    convo: 'שיחה 1',
    caption: 'בשיחה אתה כותב: "אני מעדיף תשובות קצרות". זה נכנס ל-Context, והמודל יכול להשתמש בזה עכשיו.',
  },
  {
    at: 'context',
    convo: 'שיחה 1',
    caption: 'אבל זה לא משנה את המודל. שיחה לא מאמנת את ה-Weights — המידע לא עובר לאימון מעצמו.',
  },
  {
    at: 'memory',
    convo: 'שיחה 1 הסתיימה',
    caption: 'השיחה נגמרת. מערכת עם זיכרון יכולה לשמור את המידע מחוץ למודל. בלי זיכרון — הוא פשוט לא יהיה בשיחה הבאה.',
  },
  {
    at: 'context',
    convo: 'שיחה 2',
    caption: 'בשיחה חדשה, המערכת יכולה לשלוף את המידע ולהכניס אותו שוב ל-Context. המודל רואה אותו כי הוא ב-Context — לא כי הוא "למד" אותו.',
  },
  {
    at: 'context',
    convo: 'שיחה 2',
    caption: 'אימון הוא תהליך נפרד, עם נתונים משלו, שמשנה את ה-Weights. גם אם נתונים משמשים לאימון בעתיד — זה לא קורה בתוך השיחה.',
  },
]

export function TrainingContextMemory() {
  const [step, setStep] = useState(0)
  const t = useT()
  const s = STEPS[step] ?? STEPS[0]!
  const training = step === 5

  const fact = (
    <motion.div
      layoutId="fact"
      className="cw-fact cw-k-message"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={t({ type: 'spring', stiffness: 170, damping: 24 })}
    >
      <span className="cw-block-code num">MSG</span>
      "אני מעדיף תשובות קצרות"
    </motion.div>
  )

  return (
    <div className="cw-s5">
      <LayoutGroup>
        <div className="cw-zones">
          <section className="cw-zone cw-zone-train" data-active={training || undefined}>
            <h3>
              <span className="num">TRAINING</span> אימון
            </h3>
            <p>תהליך נפרד, לפני השימוש. משנה את ה-Weights של המודל.</p>
            <div className="cw-train-vis">
              <div className="cw-dataset" aria-label="נתוני אימון">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
              <TokenStream kinds={Array(8).fill('noise')} run={training} />
              <span className="cw-train-target num">WEIGHTS</span>
            </div>
          </section>

          <section className="cw-zone cw-zone-context">
            <h3>
              <span className="num">CONTEXT</span> התשובה הנוכחית
            </h3>
            <p>המידע שזמין למודל עבור התשובה הזאת.</p>
            <motion.div
              className="cw-blocked"
              aria-hidden={step !== 2}
              initial={false}
              animate={{ opacity: step === 2 ? 1 : 0 }}
              transition={t({ duration: 0.3 })}
            >
              <span className="cw-blocked-x" aria-hidden="true">✕</span>
              <span className="cw-blocked-line" />
              <span>לא עובר לאימון</span>
            </motion.div>
            <div className="cw-context-vis">
              <ModelBox
                trained={training}
                weightsLabel={training ? 'Weights: מתעדכנים באימון' : 'Weights: ללא שינוי'}
              />
              <div className="cw-slot" data-empty={s.at !== 'context' || undefined}>
                <div className="cw-slot-head">
                  <span className="num">CONTEXT WINDOW</span>
                  {s.convo && <span className="cw-slot-convo">{s.convo}</span>}
                </div>
                <AnimatePresence>{s.at === 'context' && fact}</AnimatePresence>
              </div>
            </div>
          </section>

          <section className="cw-zone cw-zone-memory">
            <h3>
              <span className="num">MEMORY</span> זיכרון
            </h3>
            <p>מערכת חיצונית של המוצר, אם יש לו כזו. שומרת מידע ויכולה להחזיר אותו ל-Context.</p>
            <div className="cw-slot cw-store" data-empty={s.at !== 'memory' || undefined}>
              <div className="cw-slot-head"><span className="num">STORE</span></div>
              <AnimatePresence>{s.at === 'memory' && fact}</AnimatePresence>
            </div>
          </section>
        </div>
      </LayoutGroup>

      <Caption id={step}>{s.caption}</Caption>
      <StepControls step={step} count={STEPS.length} onStep={setStep} />
      <p className="cw-footnote">מוצרים שונים מממשים זיכרון בדרכים שונות, ויש שאין להם זיכרון בכלל.</p>
    </div>
  )
}
