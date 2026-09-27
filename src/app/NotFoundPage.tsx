import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section>
      <h1>הדף לא נמצא</h1>
      <p><Link to="/">חזרה לדף הבית</Link></p>
    </section>
  )
}
