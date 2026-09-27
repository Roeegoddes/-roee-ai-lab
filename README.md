# ROEE AI LAB

My hands-on AI engineering learning lab — an interactive Hebrew (RTL) learning
environment built one lesson at a time.

## Run it

Requires Node.js 20+.

```bash
npm install        # once, installs dependencies
npm run dev        # starts the site at http://localhost:5173 (updates live on save)
```

## Other commands

| Command | What it does |
|---|---|
| `npm run typecheck` | Checks the TypeScript code for errors without running it |
| `npm run build` | Type-checks, then builds the publishable site into `dist/` |
| `npm run preview` | Serves the built `dist/` locally, to check the real output |

## Where things live

```
src/
├── app/        site frame: layout, pages, routing
├── design/     tokens.css (colors, type, spacing) and base.css
├── kit/        shared lesson building blocks (added only when reused)
└── lessons/    one folder per lesson; _template/ is the hidden starting point
```

## Adding a lesson

1. Copy `src/lessons/_template/` to `src/lessons/<slug>/` (e.g. `01-example`).
2. Set the title and order in `meta.ts` (from the curriculum).
3. Put the lesson text in `lesson.mdx`.
4. Build interactive parts as `.tsx` files in the same folder and place them in the MDX.

The lesson appears on the home page automatically at `/lessons/<slug>`.

## Stack

Vite · React · TypeScript · plain CSS · Motion · MDX. Hosting (Vercel) comes later.
