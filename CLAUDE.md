# ROEE AI LAB — project rules

## What this is
- Both a real product and Roee's hands-on AI engineering learning environment.
- Roee is a beginner programmer who uses AI tools and Claude Code.
- ChatGPT owns the curriculum, lesson objectives and educational content.
  Do not invent lessons or technical claims. Claude is the engineering partner
  that implements the experiences.

## How to work
- Explain important new technical concepts and architectural decisions in
  plain language when they first appear. Do not over-explain routine details.
- Do not build features that were not requested.
- Optimize for token efficiency: inspect only the files needed for the task;
  don't repeat established project context.
- Use Skills and subagents only when they materially improve quality,
  specialization, parallelism or verification — not automatically. Keep
  subagent tasks tightly scoped. Prefer reusable Skills for workflows we
  genuinely repeat.
- Verify before declaring work complete: at minimum `npm run build`
  (type check + production build); check UI changes in a browser.
- Keep the architecture simple until a real requirement justifies more.

## Design rules
- Hebrew/RTL by default (`<html lang="he" dir="rtl">`). Use CSS logical
  properties (`inline-start`, `block-end`), never left/right. Wrap Latin
  fragments in `.ltr` when bidi ordering needs it.
- Light, sharp, instrument-like. Restrained but rich color that carries
  meaning (concepts, states, flows, interactive elements) — not decoration.
- No purple, no pill buttons, no generic AI/SaaS aesthetics, no fake content
  or fabricated data. Empty states say honestly that nothing exists yet.
- Educational animation must teach or clarify something; no decorative
  motion. Respect reduced-motion (Motion's `MotionConfig` is set to "user").
- All colors, type and spacing come from `src/design/tokens.css`. Components
  use role tokens (`--interactive`, `--highlight`, `--correct`…); a lesson
  maps its concepts to hues explicitly and keeps them consistent.

## Stack & structure
Vite + React + TypeScript + plain CSS + Motion (`motion/react`) + MDX.
Routing: react-router. Hosting: Vercel (later). No backend, database or auth yet.

- `src/app/` — shell, pages, routes (`/`, `/lessons/:slug`).
- `src/design/` — `tokens.css`, `base.css`.
- `src/lessons/<slug>/` — `meta.ts` + `lesson.mdx` + lesson-local `.tsx`.
  Auto-discovered by `src/lessons/registry.ts`; folders starting with `_` are
  hidden. Start from `_template/`.
- `src/kit/` — shared lesson components, moved here only once a second
  lesson needs them.
