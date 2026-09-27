import { Link, Outlet } from 'react-router'
import './layout.css'

export function Layout() {
  return (
    <div className="shell">
      <header className="shell-header">
        <Link to="/" className="shell-brand ltr">ROEE AI LAB</Link>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  )
}
