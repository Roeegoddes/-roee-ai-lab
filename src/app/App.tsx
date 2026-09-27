import { BrowserRouter, Route, Routes } from 'react-router'
import { MotionConfig } from 'motion/react'
import { Layout } from './Layout'
import { HomePage } from './HomePage'
import { LessonPage } from './LessonPage'
import { NotFoundPage } from './NotFoundPage'

export function App() {
  return (
    // reducedMotion="user": respect the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="lessons/:slug" element={<LessonPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
