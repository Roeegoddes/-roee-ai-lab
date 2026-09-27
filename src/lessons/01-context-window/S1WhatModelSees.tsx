import { useState } from 'react'
import { ContextColumn, type Block } from './ContextColumn'
import { ModelBox } from './ModelBox'
import { Caption, StepControls, TokenStream, kindsByShare, useIsWide } from './shared'

// Schematic proportions — not real sizes.
const SYS: Block = { id: 'sys', kind: 'instructions', tokens: 10, label: 'הוראות מערכת' }
const HIST: Block = { id: 'hist', kind: 'history', tokens: 24, label: 'שיחה קודמת' }
const FILE: Block = { id: 'file', kind: 'file', tokens: 20, label: 'קובץ' }
const TOOL: Block = { id: 'tool', kind: 'tool', tokens: 14, label: 'תוצאת כלי' }
const MSG: Block = { id: 'msg', kind: 'message', tokens: 7, label: 'ההודעה שלך' }

const STEPS: { blocks: Block[]; caption: string }[] = [
  { blocks: [], caption: 'זה ה-Context Window: מרחב סופי. כל מה שהמודל רואה צריך להיכנס לכאן.' },
  { blocks: [MSG], caption: 'אתה שולח הודעה. היא נכנסת ל-Context.' },
  { blocks: [SYS, MSG], caption: 'אבל היא לא לבד. מערכת ה-AI יכולה להוסיף לפניה הוראות מערכת.' },
  { blocks: [SYS, HIST, MSG], caption: 'השיחה עד עכשיו: השאלות שלך, וגם התשובות של המודל.' },
  { blocks: [SYS, HIST, FILE, MSG], caption: 'קובץ שצורף. התוכן שלו תופס מקום באותו חלון.' },
  {
    blocks: [SYS, HIST, FILE, TOOL, MSG],
    caption: 'תוצאה של כלי, למשל חיפוש שהמערכת הריצה. גם היא נכנסת ל-Context ותופסת מקום.',
  },
  {
    blocks: [
      { ...SYS, dim: true },
      { ...HIST, dim: true },
      { ...FILE, dim: true },
      { ...TOOL, dim: true },
      { ...MSG, label: 'ההודעה הנוכחית', highlight: true },
    ],
    caption: 'וההודעה שלך? היא רק החלק האחרון.',
  },
  {
    blocks: [SYS, HIST, FILE, TOOL, MSG],
    caption: 'המודל לא מסתכל רק על ההודעה האחרונה. הוא עובד מכל ה-Context שהורכב עבור התשובה הזאת.',
  },
]

export function WhatModelSees() {
  const [step, setStep] = useState(0)
  const wide = useIsWide()
  const current = STEPS[step] ?? STEPS[0]!
  const reading = step === STEPS.length - 1
  const total = current.blocks.reduce((s, b) => s + b.tokens, 0)
  const bracket = step === 6 ? { from: total - MSG.tokens, to: total } : reading ? { from: 0, to: total } : undefined

  return (
    <div className="cw-s1">
      <div className="cw-s1-stage" data-reading={reading || undefined}>
        <ContextColumn className="cw-h-lg" blocks={current.blocks} label="CONTEXT WINDOW" bracket={bracket} />
        <TokenStream kinds={kindsByShare(current.blocks, 14)} run={reading} vertical={!wide} />
        <ModelBox input={current.blocks} />
      </div>
      <Caption id={step}>{current.caption}</Caption>
      <StepControls step={step} count={STEPS.length} onStep={setStep} />
      <p className="cw-footnote">איור סכמטי. מה נכנס ל-Context, באיזה סדר ובאיזה גודל — משתנה בין מערכות.</p>
    </div>
  )
}
