/*
  Small building blocks shared by this lesson's stages:
  item kinds (the color identity of each kind of context), step controls,
  synchronized captions and motion helpers.
*/
import { useSyncExternalStore, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react'

/** Every kind of context keeps one color and one code through the whole lesson. */
export type Kind = 'instructions' | 'history' | 'file' | 'tool' | 'message' | 'document' | 'noise'

export const KIND_CODE: Record<Kind, string> = {
  instructions: 'SYS',
  history: 'HIST',
  file: 'FILE',
  tool: 'TOOL',
  message: 'MSG',
  document: 'DOC',
  noise: '---',
}

/** Returns the given transition, or an instant one when the user prefers reduced motion. */
export function useT() {
  const reduce = useReducedMotion()
  return (t: Transition): Transition => (reduce ? { duration: 0 } : t)
}

const WIDE = '(min-width: 48rem)'
export function useIsWide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(WIDE)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(WIDE).matches,
  )
}

export function Caption({ id, children }: { id: string | number; children: ReactNode }) {
  const t = useT()
  return (
    <div className="cw-caption" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={t({ duration: 0.2 })}
        >
          {children}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

interface StepControlsProps {
  step: number
  count: number
  onStep: (step: number) => void
}

export function StepControls({ step, count, onStep }: StepControlsProps) {
  const last = step === count - 1
  return (
    <div className="cw-steps">
      <button type="button" className="cw-btn" onClick={() => onStep(step - 1)} disabled={step === 0}>
        → הקודם
      </button>
      <ol className="cw-steps-ticks" aria-label={`צעד ${step + 1} מתוך ${count}`}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} data-on={i <= step || undefined} />
        ))}
      </ol>
      {last ? (
        <button type="button" className="cw-btn" onClick={() => onStep(0)}>
          ↺ מההתחלה
        </button>
      ) : (
        <button type="button" className="cw-btn cw-btn-primary" onClick={() => onStep(step + 1)}>
          הבא ←
        </button>
      )}
    </div>
  )
}

/** Colored squares flowing from context into the model. Hidden under reduced motion. */
export function TokenStream({ kinds, run, vertical = false }: { kinds: Kind[]; run: boolean; vertical?: boolean }) {
  return (
    <div className={`cw-stream${vertical ? ' is-v' : ''}`} aria-hidden="true">
      <span className="cw-stream-line" />
      {run &&
        kinds.map((kind, i) => (
          <span
            key={i}
            className={`cw-stream-dot cw-k-${kind}`}
            style={{ animationDelay: `${(i * 2.4) / kinds.length}s` }}
          />
        ))}
    </div>
  )
}

/** Expands a list of sized items into a proportional list of kinds (for token streams). */
export function kindsByShare(items: { kind: Kind; tokens: number }[], dots: number): Kind[] {
  const total = items.reduce((s, b) => s + b.tokens, 0)
  if (total === 0) return []
  return items.flatMap((b) => Array<Kind>(Math.max(1, Math.round((b.tokens / total) * dots))).fill(b.kind))
}
