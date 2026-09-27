import { Link } from 'react-router'
import { lessons } from '../lessons/registry'
import './home.css'

export function HomePage() {
  return (
    <>
      <header className="home-intro">
        <h1>מעבדת AI</h1>
        <p>סביבת למידה אישית להנדסת AI מעשית.</p>
      </header>

      <section aria-labelledby="index-title">
        <h2 id="index-title" className="index-title">שיעורים</h2>
        <table className="index">
          <thead>
            <tr>
              <th scope="col" className="index-num">#</th>
              <th scope="col">שיעור</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={2} className="index-empty">
                  אין עדיין שיעורים. השיעור הראשון יופיע כאן לאחר שייבנה.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson.slug}>
                  <td className="index-num num">{String(lesson.order).padStart(2, '0')}</td>
                  <td><Link to={`/lessons/${lesson.slug}`}>{lesson.title}</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}
