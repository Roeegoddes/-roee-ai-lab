/*
  Scene geometry for the "lens and light" film.
  The model is a lens; the Context Window is the pool of light it casts.
  Only what lies inside the light is seen. Tokens are small chips of text
  that fill the light line by line, like a page.

  The world is a fixed coordinate space (wide 1600×900, portrait 900×1500);
  the camera frames it. Every pool is 600×420 and holds 10 lines × 10 chips.
*/
import { B } from './script'

export type Src = 'sys' | 'hist' | 'file' | 'tool' | 'msg' | 'doc'
export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

export const SIZES: Record<Src, number> = { sys: 7, hist: 18, file: 25, tool: 15, msg: 3, doc: 40 }
export const ORDER: Src[] = ['sys', 'hist', 'file', 'tool', 'msg', 'doc']
export const LABEL: Record<Src, string> = {
  sys: 'הוראות מערכת', hist: 'היסטוריית שיחה', file: 'קובץ', tool: 'תוצאת כלי', msg: 'ההודעה של רועי', doc: 'דוח שנתי',
}

// Illustrative text each source is made of; chips show consecutive fragments of it.
const TEXT: Record<Src, string> = {
  sys: 'ענה בעברית, בקצרה ובדיוק',
  hist: 'קודם שאלת על התקציב והצגתי טבלה מסכמת של הרבעון השלישי',
  file: 'const revenue = report.sections.filter(s => s.year === 2025)',
  tool: 'תוצאות חיפוש: דוח שנתי 2025 · הכנסות · עמוד 14',
  msg: 'מה כתוב בדוח',
  doc: 'ההכנסות השנתיות של החברה צמחו בשנים־עשר אחוזים לעומת השנה הקודמת, בעיקר בזכות שוק חדש',
}
export function frag(src: Src, j: number) {
  const t = TEXT[src].replace(/\s+/g, ' ')
  const n = src === 'file' ? 4 : 3
  const start = (j * n) % Math.max(1, t.length - n)
  return t.slice(start, start + n).trim() || '·'
}

const RELEVANT_PAGES = [1, 4, 6]
export const isRelevant = (j: number) => RELEVANT_PAGES.includes(Math.floor(j / 5))

export interface Token { id: string; src: Src; j: number }
export const TOKENS: Token[] = ORDER.flatMap((src) => Array.from({ length: SIZES[src] }, (_, j) => ({ id: `${src}-${j}`, src, j })))

export const CW = 52 // chip width
export const CH = 34 // chip height
const GX = 58
const GY = 40
const PAD = 10
export const POOL = { w: 600, h: 420 }

export function geo(P: boolean) {
  const pool = (x: number, y: number): Rect => ({ x, y, ...POOL })
  return P
    ? {
        P, W: 900, H: 1500,
        lens: { x: 450, y: 120 }, lensSplit: { x: 450, y: 830 }, lensFinal: { x: 450, y: 90 },
        F0: pool(150, 320), FC: pool(150, 270), FN: pool(150, 1000), F9: pool(150, 330), FF: pool(150, 230),
        stack0: { x: 450, y: 372 },
        intro: { x: 450, y: 760 }, toModel: { x: 450, y: 360 },
        doc: { x: 330, y: 1040, w: 240, h: 290 },
        drawer: { x: 470, y: 1160, w: 390, h: 220 },
        lane: { x: 40, y: 1120, w: 400, h: 330 },
        minis: [pool(150, -800), pool(150, -240)],
        ghosts: [{ x: 260, y: 920 }, { x: 640, y: 1010 }, { x: 300, y: 1100 }],
        pile: { x: 150, y: 800, w: 600, h: 140 },
      }
    : {
        P, W: 1600, H: 900,
        lens: { x: 800, y: 110 }, lensSplit: { x: 800, y: 110 }, lensFinal: { x: 800, y: 60 },
        F0: pool(500, 260), FC: pool(880, 260), FN: pool(120, 260), F9: pool(560, 270), FF: pool(500, 170),
        stack0: { x: 800, y: 312 },
        intro: { x: 800, y: 470 }, toModel: { x: 800, y: 300 },
        doc: { x: 1190, y: 270, w: 190, h: 260 },
        drawer: { x: 1240, y: 560, w: 320, h: 210 },
        lane: { x: 40, y: 60, w: 330, h: 780 },
        minis: [pool(1860, 260), pool(1180, 260)],
        ghosts: [{ x: 1290, y: 330 }, { x: 1305, y: 470 }, { x: 1285, y: 610 }],
        pile: { x: 130, y: 300, w: 300, h: 300 },
      }
}
export type Geo = ReturnType<typeof geo>

/** Chip i in a pool: lines top-down, chips right-to-left. Lines ≥ 10 spill below the edge. */
export function slot(i: number, F: Rect): Pt {
  const col = i % 10
  const row = Math.floor(i / 10)
  return { x: F.x + PAD + (9 - col) * GX, y: F.y + PAD + row * GY }
}

/** A chip drawn smaller than normal, keeping its visual top-left at (x, y). */
const small = (x: number, y: number, k: number) => ({ x: x - (CW * (1 - k)) / 2, y: y - (CH * (1 - k)) / 2, s: k })

export function pageRect(k: number, g: Geo): Rect {
  return g.P ? { x: 22 + k * 108, y: 1030, w: 96, h: 250 } : { x: 1180, y: 250 + k * 54, w: 210, h: 44 }
}
function pagePos(j: number, g: Geo) {
  const r = pageRect(Math.floor(j / 5), g)
  const p = j % 5
  return g.P ? small(r.x + 22, r.y + 18 + p * 46, 0.62) : small(r.x + 12 + p * 38, r.y + 6, 0.6)
}

// ---------- paper slips (information before it becomes tokens) ----------
export const SLIP = { w: 420, h: 62 }
const STACK_INDEX: Record<Src, number> = { sys: 0, hist: 1, file: 2, tool: 3, msg: 4, doc: 5 }
export function stack(k: number, g: Geo): Pt {
  return { x: g.stack0.x, y: g.stack0.y + k * 80 }
}
const ARRIVE: Partial<Record<Src, number>> = { sys: B.cardSys, hist: B.cardHist, file: B.cardFile, tool: B.cardTool }
const TILT: Record<Src, number> = { sys: -4, hist: 3, file: -2, tool: 4, msg: -1.5, doc: 0 }

export interface SlipState extends Pt { o: number; s: number; r: number }
export function slipState(src: Src, b: number, g: Geo): SlipState {
  const at = stack(STACK_INDEX[src], g)
  const gone = b >= B.tokens
  if (src === 'msg') {
    if (b === B.intro) return { ...g.intro, o: 1, s: 1.15, r: TILT.msg }
    if (b === B.toModel) return { ...g.toModel, o: 1, s: 1, r: 0 }
    return { ...at, o: gone ? 0 : 1, s: gone ? 0.85 : 1, r: 0 }
  }
  const arrive = ARRIVE[src] ?? 0
  if (b < arrive) {
    const from = {
      sys: { x: at.x - 260, y: -140 },
      hist: { x: g.W + 300, y: at.y - 60 },
      file: { x: g.W + 260, y: g.H + 120 },
      tool: { x: at.x + 200, y: g.H + 180 },
    }[src as 'sys']
    return { ...from, o: 0, s: 1, r: TILT[src] * 3 }
  }
  // Land tilted, settle straight once everything is assembled.
  const settled = b >= B.assembled
  return { ...at, o: gone ? 0 : 1, s: gone ? 0.85 : 1, r: settled ? 0 : TILT[src] }
}

export function docState(b: number, g: Geo): Rect & { o: number; empty: boolean; r: number } {
  const off = g.P ? { ...g.doc, y: g.H + 200 } : { ...g.doc, x: g.W + 200 }
  if (b < B.doc) return { ...off, o: 0, empty: false, r: 8 }
  if (b < B.overflow) return { ...g.doc, o: 1, empty: false, r: -3 }
  if (b < B.retrieve) return { ...g.doc, o: 1, empty: true, r: -3 }
  return { ...g.doc, o: 0, empty: true, r: 0 }
}

// ---------- which chips lie in the main pool of light at each beat ----------
const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const pick = (src: Src, keep?: (j: number) => boolean) => range(SIZES[src]).filter((j) => !keep || keep(j)).map((j) => `${src}-${j}`)
const five = (hist = pick('hist')) => [...pick('sys'), ...hist, ...pick('file'), ...pick('tool'), ...pick('msg')]
export const CLEAN = () => [...pick('sys'), ...pick('msg'), ...pick('doc', isRelevant)]

export function ctxIds(b: number): string[] {
  if (b < B.tokens) return []
  if (b < B.overflow) return five()
  if (b === B.remove) return [...five(pick('hist', (j) => j >= 12)), ...pick('doc')]
  if (b === B.compress) return [...five(pick('hist', (j) => j < 4)), ...pick('doc')]
  if (b === B.retrieve || b === B.compare3) return [...five(), ...pick('doc', isRelevant)]
  if (b < B.retrieve) return [...five(), ...pick('doc')]
  if (b < B.chatEnd) return CLEAN()
  return []
}

export function mainPool(b: number, g: Geo): Rect {
  if (b < B.split) return g.F0
  if (b < B.ctx) return g.FC
  if (b < B.final) return g.F9
  return g.FF
}
export function lensAt(b: number, g: Geo): Pt {
  if (b >= B.split && b <= B.goal) return g.lensSplit
  if (b >= B.final) return g.lensFinal
  if (b >= B.ctx) return { x: g.F9.x + g.F9.w / 2, y: g.lens.y }
  return g.lens
}

export interface ChipState { x: number; y: number; s: number; o: number; r: number; cls: string; delay: number }

const COMPRESSED = ['תק', 'ציר', 'השי', 'חה']

export function chipState(tok: Token, b: number, g: Geo, index: Map<string, number>): ChipState & { text: string } {
  const F = mainPool(b, g)
  const i = index.get(tok.id)
  const text = b === B.compress && tok.src === 'hist' && tok.j < 4 ? COMPRESSED[tok.j]! : frag(tok.src, tok.j)
  let delay = 0
  if (b === B.tokens) delay = STACK_INDEX[tok.src] * 0.5 + tok.j * 0.03
  else if (b === B.overflow && tok.src === 'doc') delay = tok.j * 0.05
  else if (i !== undefined) delay = Math.min(i, 100) * 0.005

  if (i !== undefined) {
    const p = slot(i, F)
    const spill = i >= 100
    const cls = [tok.src, spill && 'over', b === B.compress && tok.src === 'hist' && 'dense', b === B.goal && 'hl'].filter(Boolean).join(' ')
    return { ...p, s: 1, o: 1, r: spill ? ((i % 3) - 1) * 9 : 0, cls, delay, text }
  }

  // Before a chip exists it sits folded inside its slip (or the document), invisible.
  if (b < B.tokens || (tok.src === 'doc' && b < B.overflow)) {
    const c = tok.src === 'doc' ? docState(b, g) : slipState(tok.src, b, g)
    const x = tok.src === 'doc' ? c.x + 20 + (tok.j % 3) * 50 : c.x - 170 + ((tok.j * 47) % 340)
    const y = tok.src === 'doc' ? c.y + 40 + Math.floor(tok.j / 3) * 16 : c.y - 16
    return { x, y, s: 0.5, o: 0, r: 0, cls: tok.src, delay: 0, text }
  }
  if (b === B.remove && tok.src === 'hist') {
    // Old history slides out of the light into the shadow.
    return { x: F.x - 190 - (tok.j % 3) * 64, y: F.y + 60 + Math.floor(tok.j / 3) * 44, s: 0.9, o: 0.28, r: (tok.j % 2 ? 6 : -5), cls: 'hist gone', delay: tok.j * 0.05, text }
  }
  if (b === B.compress && tok.src === 'hist') {
    const into = index.get(`hist-${tok.j % 4}`) ?? 0
    return { ...slot(into, F), s: 0.5, o: 0, r: 0, cls: 'hist', delay: 0.2 + tok.j * 0.035, text }
  }
  if (tok.src === 'doc' && (b === B.retrieve || b === B.compare3)) {
    return { ...pagePos(tok.j, g), o: b === B.retrieve ? 1 : 0, r: 0, cls: 'doc', delay: 0.3 + tok.j * 0.012, text }
  }
  if (b >= B.chatEnd && b < B.final && CLEAN().includes(tok.id)) {
    // The conversation ends: its context dims out of the light.
    const k = CLEAN().indexOf(tok.id)
    const p = slot(k, g.F9)
    return { x: p.x, y: p.y + 60, s: 0.9, o: 0, r: 0, cls: tok.src, delay: k * 0.03, text }
  }
  const retrieveIdx = ctxIds(B.retrieve).indexOf(tok.id)
  const was = retrieveIdx >= 0 ? { ...slot(retrieveIdx, g.F0), s: 1 } : tok.src === 'doc' ? pagePos(tok.j, g) : { ...slot(0, g.F0), s: 1 }
  return { ...was, o: 0, r: 0, cls: tok.src, delay: 0, text }
}

// ---------- the noisy pool (scene 8) ----------
type NoisyKind = 'noise' | 'dup' | 'old' | 'conflict' | 'sys' | 'msg' | 'doc'
const NOISY_TEXT: Record<NoisyKind, string[]> = {
  noise: ['לא', 'קשו', 'ר', 'סתם', 'עוד', 'משה', 'ו'], dup: ['שוב', 'עות', 'ק'], old: ['2019', 'ישן'], conflict: ['אבל', 'הפו', 'ך'],
  sys: [], msg: [], doc: [],
}
const NOISY_KINDS: NoisyKind[] = (() => {
  const list: NoisyKind[] = [
    ...Array<NoisyKind>(40).fill('noise'), ...Array<NoisyKind>(10).fill('dup'), ...Array<NoisyKind>(8).fill('old'),
    ...Array<NoisyKind>(6).fill('conflict'), ...Array<NoisyKind>(7).fill('sys'), ...Array<NoisyKind>(3).fill('msg'), ...Array<NoisyKind>(15).fill('doc'),
  ]
  let seed = 7
  for (let i = list.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280
    const k = seed % (i + 1)
    ;[list[i], list[k]] = [list[k]!, list[i]!]
  }
  return list
})()
export const NOISY = NOISY_KINDS.map((kind, i) => {
  const t = NOISY_TEXT[kind]
  const text = t.length ? t[i % t.length]! : frag(kind as Src, i)
  return { id: `n-${i}`, kind, i, text }
})

export function noisyState(n: (typeof NOISY)[number], b: number, g: Geo): ChipState {
  const p = slot(n.i, g.FN)
  const relevant = n.kind === 'sys' || n.kind === 'msg' || n.kind === 'doc'
  const cls = n.kind + (b === B.goal && relevant ? ' hl' : '')
  if (b < B.noise) return { x: p.x + (g.P ? 0 : -220), y: p.y - (g.P ? 0 : 60), s: 0.8, o: 0, r: 0, cls, delay: 0 }
  if (b > B.goal) return { ...p, s: 1, o: 0, r: 0, cls, delay: 0 }
  return { ...p, s: 1, o: 1, r: 0, cls, delay: b === B.noise ? n.i * 0.03 : 0 }
}

// ---------- scene 10: a few chips chosen out of a pile ----------
const PILE: Src[] = ['hist', 'doc', 'file', 'tool', 'doc', 'sys', 'hist', 'file', 'msg', 'doc', 'tool', 'hist', 'file', 'doc']
const CHOSEN = [8, 9, 2]
export const PILE_CHIPS = PILE.map((src, i) => ({ id: `p-${i}`, src, i, text: frag(src, i + 3) }))
export function pileState(p: (typeof PILE_CHIPS)[number], b: number, g: Geo): ChipState {
  const a = g.pile
  const base = { x: a.x + ((p.i * 83) % (a.w - CW)), y: a.y + ((p.i * 47) % (a.h - CH)) }
  const r = ((p.i * 37) % 24) - 12
  if (b < B.engineering) return { ...base, s: 0.9, o: 0, r, cls: p.src, delay: 0 }
  const chosen = CHOSEN.indexOf(p.i)
  if (chosen >= 0) return { ...slot(chosen, g.FF), s: 1, o: 1, r: 0, cls: p.src, delay: 1.4 + chosen * 0.4 }
  return { ...base, s: 0.9, o: 0.4, r, cls: p.src, delay: p.i * 0.03 }
}

// ---------- camera ----------
export function camera(b: number, g: Geo): { cx: number; cy: number; s: number } {
  const c = { cx: g.W / 2, cy: g.H / 2 }
  if (b === B.intro) return { cx: g.intro.x, cy: g.intro.y, s: g.P ? 1.35 : 1.6 }
  if (b === B.toModel) return { ...c, cy: g.P ? 520 : 400, s: g.P ? 1.15 : 1.1 }
  if (b >= B.reveal && b <= B.assembled) return { ...c, s: 0.95 }
  // Pool scenes: frame the lens and its light tighter.
  if (b >= B.frame && b <= B.retrieve) return g.P ? { ...c, s: 1 } : { cx: 800, cy: 410, s: 1.18 }
  if (b === B.compare3) return g.P ? { cx: 450, cy: 10, s: 0.84 } : { cx: 1480, cy: 470, s: 0.78 }
  if (b === B.weights) return g.P ? { cx: 450, cy: 260, s: 1.45 } : { cx: 860, cy: 200, s: 1.55 }
  return { ...c, s: 1 }
}
