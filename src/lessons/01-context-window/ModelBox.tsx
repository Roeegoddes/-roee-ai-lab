/*
  The model: a fixed grid of weights, plus an input strip showing what
  it receives. Weights only change when `trained` is set (stage 5).
*/
import { motion } from 'motion/react'
import { useT, type Kind } from './shared'

const CELLS = 48
const SHADES = ['#d8d4cb', '#b7b2a7', '#8e8a81', '#5f5c56', '#34343a']
const shade = (i: number, trained: boolean) => SHADES[((i * 7 + (i >> 3) * 3) % 5 + (trained && i % 3 === 0 ? 2 : 0)) % 5]

interface Props {
  input?: { kind: Kind; tokens: number }[]
  capacity?: number
  trained?: boolean
  weightsLabel?: string
}

export function ModelBox({ input, capacity = 100, trained = false, weightsLabel }: Props) {
  const t = useT()
  return (
    <div className="cw-model">
      <div className="cw-model-head">
        <span className="num">MODEL</span>
        <span>מודל</span>
      </div>
      <div className="cw-model-input" aria-label="מה נכנס למודל">
        {input?.map((b, i) => (
          <motion.span
            key={`${b.kind}-${i}`}
            className={`cw-k-${b.kind}`}
            initial={{ width: 0 }}
            animate={{ width: `${(b.tokens / capacity) * 100}%` }}
            transition={t({ duration: 0.4 })}
          />
        ))}
      </div>
      <div className="cw-model-grid" aria-hidden="true">
        {Array.from({ length: CELLS }, (_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ backgroundColor: shade(i, trained) }}
            transition={t({ duration: 0.5, delay: trained ? (i % 8) * 0.06 + (i >> 3) * 0.04 : 0 })}
          />
        ))}
      </div>
      {weightsLabel && <div className="cw-model-foot">{weightsLabel}</div>}
    </div>
  )
}
