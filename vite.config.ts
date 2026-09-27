import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

export default defineConfig({
  plugins: [
    // MDX must compile before the React plugin sees the output.
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(mdx|tsx|ts)$/ }),
  ],
})
