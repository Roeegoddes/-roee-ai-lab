/*
  The context window as a physical column: 0 at the top, capacity at the floor.
  Blocks take height proportional to their tokens and stack in order.
  Anything past capacity pushes through the floor and is hatched as overflow.
*/
import { useEffect, type CSSProperties } from 'react'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { KIND_CODE, useT, type Kind } from './shared'

export interface Block {
  id: string
  kind: Kind
  tokens: number
  label?: string
  /** Show the token size ("18K") on the block. */
  size?: boolean
  tag?: string
  variant?: 'dup' | 'old' | 'conflict' | 'noise'
  highlight?: boolean
  dim?: boolean
}

interface Props {
  blocks: Block[]
  capacity?: number
  ruler?: boolean
  /** Extra space under the floor for overflow, as a fraction of the column height. */
  headroom?: number
  /** Increment to play the collision shake. */
  shakeKey?: number
  label?: string
  className?: string
  /** Marks a span of the column (in tokens) as "what the model reads". */
  bracket?: { from: number; to: number }
}

const span = (b: { from: number; to: number }, capacity: number) => ({
  top: `${(b.from / capacity) * 100}%`,
  height: `${((b.to - b.from) / capacity) * 100}%`,
})

export const sumTokens = (blocks: { tokens: number }[]) => blocks.reduce((s, b) => s + b.tokens, 0)

export function ContextColumn({ blocks, capacity = 100, ruler = false, headroom = 0.08, shakeKey = 0, label, className, bracket }: Props) {
  const total = sumTokens(blocks)
  const over = Math.max(0, total - capacity)
  const t = useT()
  const reduce = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLDivElement>()

  useEffect(() => {
    if (shakeKey > 0 && !reduce) animate(scope.current, { x: [0, -8, 8, -5, 5, -2, 0] }, { duration: 0.45 })
  }, [shakeKey, reduce, animate, scope])

  return (
    <div
      className={`cw-col${className ? ` ${className}` : ''}`}
      style={{ '--headroom': headroom } as CSSProperties}
      data-over={over > 0 || undefined}
    >
      {label && <div className="cw-col-label num">{label}</div>}
      <div className="cw-col-body">
        {ruler && (
          <div className="cw-ruler num" aria-hidden="true">
            {[0, 20, 40, 60, 80, 100].map((p) => (
              <span key={p} style={{ insetBlockStart: `${p}%` }}>
                {Math.round((p / 100) * capacity)}K
              </span>
            ))}
          </div>
        )}
        <div ref={scope} className="cw-col-frame">
          {total < capacity * 0.8 && <span className="cw-col-free">מקום פנוי</span>}
          <div className="cw-col-stack">
            <AnimatePresence initial={false}>
              {blocks.map((b) => (
                <BlockView key={b.id} block={b} pct={(b.tokens / capacity) * 100} t={t} />
              ))}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {over > 0 && (
              <motion.div
                className="cw-col-over"
                style={{ height: `${(over / capacity) * 100}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t({ duration: 0.25, delay: 0.25 })}
              >
                <span className="cw-col-over-label num">
                  <bdi dir="ltr">+{over}K</bdi>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="cw-col-floor" />
          <AnimatePresence>
            {bracket && (
              <motion.div
                className="cw-col-bracket"
                aria-hidden="true"
                initial={{ opacity: 0, ...span(bracket, capacity) }}
                animate={{ opacity: 1, ...span(bracket, capacity) }}
                exit={{ opacity: 0 }}
                transition={t({ type: 'spring', stiffness: 120, damping: 20 })}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function BlockView({ block: b, pct, t }: { block: Block; pct: number; t: ReturnType<typeof useT> }) {
  const cls = ['cw-block', `cw-k-${b.kind}`, b.variant && `is-${b.variant}`].filter(Boolean).join(' ')
  return (
    <motion.div
      className={cls}
      data-hl={b.highlight || undefined}
      initial={{ height: '0%', opacity: 0, y: -28 }}
      animate={{ height: `${pct}%`, opacity: b.dim ? 0.3 : 1, y: 0 }}
      exit={{ height: '0%', opacity: 0 }}
      transition={t({ type: 'spring', stiffness: 210, damping: 28 })}
    >
      <div className="cw-block-in">
        <span className="cw-block-code num">{KIND_CODE[b.kind]}</span>
        {b.label && <span className="cw-block-label">{b.label}</span>}
        {b.tag && <span className="cw-block-tag">{b.tag}</span>}
        {b.size && <span className="cw-block-size num">{b.tokens}K</span>}
      </div>
    </motion.div>
  )
}

/** Big numeric readout of how full a window is. */
export function Readout({ total, capacity = 100 }: { total: number; capacity?: number }) {
  const state = total > capacity ? 'over' : total >= capacity * 0.9 ? 'full' : 'ok'
  return (
    <div className="cw-readout" data-state={state}>
      <div className="cw-readout-main num">
        <span className="cw-readout-total">{total}K</span>
        <span className="cw-readout-cap"> / {capacity}K</span>
      </div>
      <div className="cw-readout-sub">
        {total > capacity ? (
          <>חורג ב-<span className="num">{total - capacity}K</span></>
        ) : (
          <>פנוי: <span className="num">{capacity - total}K</span></>
        )}
      </div>
    </div>
  )
}
