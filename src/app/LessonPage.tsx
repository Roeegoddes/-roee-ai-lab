import { Suspense, lazy, useMemo } from 'react'
import { useParams } from 'react-router'
import { getLesson } from '../lessons/registry'
import { NotFoundPage } from './NotFoundPage'
import './lesson.css'

export function LessonPage() {
  const { slug } = useParams()
  const lesson = slug ? getLesson(slug) : undefined
  // Load the lesson's content only when it is opened.
  const Content = useMemo(() => (lesson ? lazy(lesson.load) : null), [lesson])

  if (!lesson || !Content) return <NotFoundPage />

  return (
    <article className="lesson">
      <h1 className="lesson-title">{lesson.title}</h1>
      <Suspense fallback={<p className="lesson-loading">טוען…</p>}>
        <div className="lesson-body">
          <Content />
        </div>
      </Suspense>
    </article>
  )
}
