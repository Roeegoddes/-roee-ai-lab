/*
  Exhibit: shows one stage at a time, with a rail to move between stages.
  The stage list is written in lesson.mdx as <Stage title="…"> children.
*/
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useT } from './shared'
import './lesson.css'

interface StageProps {
  title: string
  children: ReactNode
}

export function Stage({ children }: StageProps) {
  return <>{children}</>
}

interface ExhibitApi {
  index: number
  goTo: (index: number) => void
}

const ExhibitContext = createContext<ExhibitApi | null>(null)

export function useExhibit() {
  const api = useContext(ExhibitContext)
  if (!api) throw new Error('useExhibit must be used inside <Exhibit>')
  return api
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Exhibit({ children }: { children: ReactNode }) {
  const stages = Children.toArray(children).filter((c): c is ReactElement<StageProps> => isValidElement(c))
  const [index, setIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()
  const count = stages.length
  const current = stages[index]

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(count - 1, next)))
    const el = ref.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
  }

  if (!current) return null

  return (
    <ExhibitContext.Provider value={{ index, goTo }}>
      <div className="cw-exhibit" ref={ref}>
        <nav className="cw-rail" aria-label="שלבי השיעור">
          <ol>
            {stages.map((stage, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="cw-rail-step"
                  aria-current={i === index ? 'step' : undefined}
                  data-done={i < index || undefined}
                  onClick={() => goTo(i)}
                >
                  <span className="num">{pad(i + 1)}</span>
                  <span className="cw-rail-title">{stage.props.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <header className="cw-stage-head">
          <span className="num cw-stage-num">
            {pad(index + 1)} / {pad(count)}
          </span>
          <h2>{current.props.title}</h2>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={index}
            className="cw-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={t({ duration: 0.18 })}
          >
            {current}
          </motion.section>
        </AnimatePresence>

        <footer className="cw-exhibit-foot">
          <button type="button" className="cw-btn" onClick={() => goTo(index - 1)} disabled={index === 0}>
            → לשלב הקודם
          </button>
          {index < count - 1 && (
            <button type="button" className="cw-btn cw-btn-primary" onClick={() => goTo(index + 1)}>
              לשלב הבא ←
            </button>
          )}
        </footer>
      </div>
    </ExhibitContext.Provider>
  )
}
