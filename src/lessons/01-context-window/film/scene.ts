/*
  Scene geometry: where every persistent object sits at each beat.
  The world is a fixed coordinate space (wide 1600×900, portrait 900×1500);
  the camera frames it. All windows are 600×600 and hold 100 token slots.
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
const RELEVANT_PAGES = [1, 4, 6]
export const isRelevant = (j: number) => RELEVANT_PAGES.includes(Math.floor(j / 5))

export interface Token { id: string; src: Src; j: number }
export const TOKENS: Token[] = ORDER.flatMap((src) => Array.from({ length: SIZES[src] }, (_, j) => ({ id: `${src}-${j}`, src, j })))

export const TS = 52 // token size
const CELL = 58
const PAD = 13

export function geo(P: boolean) {
  const W = P ? 900 : 1600
  const H = P ? 1500 : 900
  return {
    P, W, H,
    F0: P ? { x: 150, y: 430, w: 600, h: 600 } : { x: 760, y: 150, w: 600, h: 600 },
    FC: P ? { x: 150, y: 150, w: 600, h: 600 } : { x: 880, y: 150, w: 600, h: 600 },
    FN: P ? { x: 150, y: 860, w: 600, h: 600 } : { x: 120, y: 150, w: 600, h: 600 },
    F9: P ? { x: 150, y: 400, w: 600, h: 600 } : { x: 640, y: 250, w: 600, h: 600 },
    FF: P ? { x: 150, y: 720, w: 600, h: 600 } : { x: 500, y: 330, w: 600, h: 600 },
    model: P ? { x: 450, y: 1330 } : { x: 250, y: 450 },
    model9: P ? { x: 220, y: 1280 } : { x: 250, y: 500 },
    legendY: P ? 1060 : 800,
    doc: P ? { x: 330, y: 60, w: 240, h: 300 } : { x: 1395, y: 150, w: 175, h: 300 },
    drawer: P ? { x: 440, y: 1200, w: 420, h: 230 } : { x: 1270, y: 560, w: 310, h: 220 },
    band: P ? { x: 40, y: 40, w: 820, h: 150 } : { x: 60, y: 16, w: 1480, h: 104 },
    minis: P
      ? [{ x: 150, y: -970, w: 600, h: 600 }, { x: 150, y: -270, w: 600, h: 600 }]
      : [{ x: 2120, y: 150, w: 600, h: 600 }, { x: 1440, y: 150, w: 600, h: 600 }],
  }
}
export type Geo = ReturnType<typeof geo>

/** Slot i of a window: fills bottom-up, right-to-left. Slots ≥ 100 sit above the rim. */
export function slot(i: number, F: Rect): Pt {
  const col = i % 10
  const row = Math.floor(i / 10)
  return { x: F.x + PAD + (9 - col) * CELL, y: F.y + PAD + (9 - row) * CELL }
}

/** A token drawn at visual size `size` with its top-left at (x, y). */
const small = (x: number, y: number, size: number) => ({ x: x - (TS - size) / 2, y: y - (TS - size) / 2, s: size / TS })

export function pageRect(k: number, g: Geo): Rect {
  return g.P ? { x: 22 + k * 108, y: 70, w: 96, h: 300 } : { x: 1395, y: 140 + k * 72, w: 175, h: 58 }
}
function pagePos(j: number, g: Geo) {
  const r = pageRect(Math.floor(j / 5), g)
  const p = j % 5
  return g.P ? small(r.x + 33, r.y + 14 + p * 56, 30) : small(r.x + 8 + p * 33, r.y + 14, 30)
}

// ---------- cards (the information before it becomes tokens) ----------
export const CARD = { w: 440, h: 78 }
export function stack(k: number, g: Geo): Pt {
  return { x: g.F0.x + g.F0.w / 2, y: g.F0.y + 80 + k * 108 }
}
const ARRIVE: Partial<Record<Src, number>> = { sys: B.cardSys, hist: B.cardHist, file: B.cardFile, tool: B.cardTool }
const STACK_INDEX: Record<Src, number> = { sys: 0, hist: 1, file: 2, tool: 3, msg: 4, doc: 5 }

export function cardState(src: Src, b: number, g: Geo): Pt & { o: number; s: number } {
  const at = stack(STACK_INDEX[src], g)
  if (src === 'msg') {
    if (b === B.intro) return { x: g.W / 2, y: g.H / 2, o: 1, s: 1.15 }
    if (b === B.toModel) return { ...(g.P ? { x: 450, y: 1110 } : { x: 590, y: 450 }), o: 1, s: 1 }
    return { ...at, o: b < B.tokens ? 1 : 0, s: b < B.tokens ? 1 : 0.9 }
  }
  const arrive = ARRIVE[src] ?? 0
  if (b < arrive) {
    const from = { sys: { x: at.x, y: -160 }, hist: { x: g.W + 320, y: at.y }, file: { x: g.W + 320, y: g.H + 120 }, tool: { x: at.x, y: g.H + 200 } }[src as 'sys']
    return { ...from, o: 0, s: 1 }
  }
  return { ...at, o: b < B.tokens ? 1 : 0, s: b < B.tokens ? 1 : 0.9 }
}

export function docCard(b: number, g: Geo): Rect & { o: number; empty: boolean } {
  const off = g.P ? { ...g.doc, y: -420 } : { ...g.doc, x: 1900 }
  if (b < B.doc) return { ...off, o: 0, empty: false }
  if (b < B.overflow) return { ...g.doc, o: 1, empty: false }
  if (b < B.retrieve) return { ...g.doc, o: 1, empty: true }
  return { ...g.doc, o: 0, empty: true }
}

// ---------- which tokens are inside the main window at each beat ----------
const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const pick = (src: Src, keep?: (j: number) => boolean) => range(SIZES[src]).filter((j) => !keep || keep(j)).map((j) => `${src}-${j}`)
const five = (hist = pick('hist')) => [...pick('sys'), ...hist, ...pick('file'), ...pick('tool'), ...pick('msg')]
const CLEAN = () => [...pick('sys'), ...pick('msg'), ...pick('doc', isRelevant)]

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

export function mainFrame(b: number, g: Geo): Rect {
  if (b < B.split) return g.F0
  if (b < B.ctx) return g.FC
  if (b < B.final) return g.F9
  return g.FF
}

export interface TokState { x: number; y: number; s: number; o: number; cls: string; delay: number }

export function tokenState(tok: Token, b: number, g: Geo, index: Map<string, number>): TokState {
  const F = mainFrame(b, g)
  const i = index.get(tok.id)
  let delay = 0
  if (b === B.tokens) delay = STACK_INDEX[tok.src] * 0.45 + tok.j * 0.025
  else if (b === B.overflow && tok.src === 'doc') delay = tok.j * 0.045
  else if (i !== undefined) delay = Math.min(i, 100) * 0.004

  if (i !== undefined) {
    const p = slot(i, F)
    const cls = [
      tok.src,
      i >= 100 && 'over',
      b === B.compress && tok.src === 'hist' && 'dense',
      b === B.goal && 'hl',
    ].filter(Boolean).join(' ')
    return { ...p, s: 1, o: 1, cls, delay }
  }

  // Not inside the window at this beat.
  if (b < B.tokens || (tok.src === 'doc' && b < B.overflow)) {
    const c = tok.src === 'doc' ? docCard(b, g) : cardState(tok.src, b, g)
    const cx = tok.src === 'doc' ? c.x + 40 + (tok.j % 4) * 25 : c.x - 180 + ((tok.j * 47) % 360)
    const cy = tok.src === 'doc' ? c.y + 30 + Math.floor(tok.j / 4) * 24 : c.y - 20 + ((tok.j * 13) % 30)
    return { x: cx, y: cy, s: 0.4, o: 0, cls: tok.src, delay: 0 }
  }
  if (b === B.remove && tok.src === 'hist') {
    return { x: F.x - 160 - (tok.j % 3) * 46, y: F.y + 330 + Math.floor(tok.j / 3) * 40, s: 0.7, o: 0, cls: 'hist gone', delay: tok.j * 0.05 }
  }
  if (b === B.compress && tok.src === 'hist') {
    const into = index.get(`hist-${tok.j % 4}`) ?? 0
    return { ...slot(into, F), s: 0.6, o: 0, cls: 'hist dense', delay: 0.2 + tok.j * 0.03 }
  }
  if (tok.src === 'doc' && (b === B.retrieve || b === B.compare3)) {
    return { ...pagePos(tok.j, g), o: b === B.retrieve ? 1 : 0, cls: 'doc', delay: 0.3 + tok.j * 0.01 }
  }
  // Leaving after the strategies: fade where it was in the retrieve state.
  const retrieveIdx = ctxIds(B.retrieve).indexOf(tok.id)
  const was = retrieveIdx >= 0 ? { ...slot(retrieveIdx, g.F0), s: 1 } : tok.src === 'doc' ? pagePos(tok.j, g) : { ...slot(0, g.F0), s: 1 }
  if (b >= B.chatEnd && b < B.final && CLEAN().includes(tok.id)) {
    const k = CLEAN().indexOf(tok.id)
    const p = slot(k, g.F9)
    return { x: p.x, y: p.y + 320, s: 0.8, o: 0, cls: tok.src, delay: k * 0.03 }
  }
  return { ...was, o: 0, cls: tok.src, delay: 0 }
}

// ---------- the noisy window (scene 8) ----------
type NoisyKind = 'noise' | 'dup' | 'old' | 'conflict' | 'sys' | 'msg' | 'doc'
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
export const NOISY = NOISY_KINDS.map((kind, i) => ({ id: `n-${i}`, kind, i }))

export function noisyState(n: (typeof NOISY)[number], b: number, g: Geo): TokState {
  const p = slot(n.i, g.FN)
  const relevant = n.kind === 'sys' || n.kind === 'msg' || n.kind === 'doc'
  const cls = n.kind + (b === B.goal && relevant ? ' hl' : '')
  if (b < B.noise) return { x: p.x, y: p.y - (g.P ? 260 : 700), s: 1, o: 0, cls, delay: 0 }
  if (b > B.goal) return { ...p, s: 1, o: 0, cls, delay: 0 }
  return { ...p, s: 1, o: 1, cls, delay: b === B.noise ? n.i * 0.03 : 0 }
}

// ---------- the final "choose what goes in" pile (scene 10) ----------
const PILE: Src[] = ['hist', 'doc', 'file', 'tool', 'doc', 'sys', 'hist', 'file', 'msg', 'doc', 'tool', 'hist', 'file', 'doc']
const CHOSEN = [2, 8, 9]
export const PILE_TOKENS = PILE.map((src, i) => ({ id: `p-${i}`, src, i }))
export function pileState(p: (typeof PILE_TOKENS)[number], b: number, g: Geo): TokState {
  const base = g.P
    ? { x: 150 + ((p.i * 83) % 560), y: 1360 + ((p.i * 37) % 90) }
    : { x: 120 + ((p.i * 71) % 280), y: 520 + ((p.i * 53) % 330) }
  if (b < B.engineering) return { ...base, s: 0.9, o: 0, cls: p.src, delay: 0 }
  const chosen = CHOSEN.indexOf(p.i)
  if (chosen >= 0) return { ...slot(chosen, g.FF), s: 1, o: 1, cls: p.src, delay: 1.2 + chosen * 0.35 }
  return { ...base, s: 0.9, o: 0.35, cls: p.src, delay: p.i * 0.03 }
}

// ---------- camera ----------
export function camera(b: number, g: Geo): { cx: number; cy: number; s: number } {
  const c = { cx: g.W / 2, cy: g.H / 2 }
  if (b === B.intro) return { ...c, s: g.P ? 1.25 : 1.45 }
  if (b >= B.reveal && b <= B.assembled) return { ...c, s: 0.94 }
  if (b === B.compare3) return g.P ? { cx: 450, cy: 30, s: 0.68 } : { cx: 1740, cy: 450, s: 0.72 }
  if (b === B.weights) return g.P ? { cx: 360, cy: 1180, s: 1.35 } : { cx: 520, cy: 480, s: 1.3 }
  if (b >= B.final) return g.P ? { cx: 450, cy: 860, s: 0.8 } : { cx: 800, cy: 470, s: 0.82 }
  return { ...c, s: 1 }
}
