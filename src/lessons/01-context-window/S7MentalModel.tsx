import { motion } from 'motion/react'
import { useExhibit } from './Exhibit'
import { useT } from './shared'

const CHAIN = [
  { name: 'Tokens', line: 'היחידות שבהן נמדד ה-Context.' },
  { name: 'Context', line: 'כל מה שהמודל רואה עבור התשובה הזאת.' },
  { name: 'Tools / Files', line: 'גם הם נכנסים ל-Context — ותופסים מקום.' },
  { name: 'Context Engineering', line: 'לבחור מה נכנס: המידע הנכון, לא המקסימלי.', future: true },
]

export function MentalModel() {
  const t = useT()
  const { goTo } = useExhibit()
  return (
    <div className="cw-s7">
      <motion.div
        className="cw-formula"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t({ duration: 0.4 })}
      >
        <span className="cw-formula-term num">CONTEXT WINDOW</span>
        <span className="cw-formula-eq num">=</span>
        <span className="cw-formula-def">מרחב העבודה המוגבל של המודל, עבור התשובה הנוכחית.</span>
      </motion.div>

      <ol className="cw-chain">
        {CHAIN.map((node, i) => (
          <motion.li
            key={node.name}
            className="cw-chain-node"
            data-future={node.future || undefined}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t({ duration: 0.35, delay: 0.5 + i * 0.45 })}
          >
            {i > 0 && (
              <motion.span
                className="cw-chain-link"
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={t({ duration: 0.3, delay: 0.35 + i * 0.45 })}
              />
            )}
            <span className="cw-chain-name num">{node.name}</span>
            <span className="cw-chain-line">{node.line}</span>
            {node.future && <span className="cw-chain-tag">שיעור עתידי</span>}
          </motion.li>
        ))}
      </ol>

      <div className="cw-row">
        <button type="button" className="cw-btn" onClick={() => goTo(0)}>
          ↺ לחזור להתחלה
        </button>
      </div>
    </div>
  )
}
