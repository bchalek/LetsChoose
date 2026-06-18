import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import CreateList from './pages/CreateList'
import ListPage from './pages/ListPage'
import AdminPage from './pages/AdminPage'
import { ToastProvider } from './components/Toast'

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
        Lets<span>Choose</span>
      </Link>
      <Link to="/create" className="btn btn-primary btn-sm">+ Nowa lista</Link>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateList />} />
        <Route path="/list/:listId" element={<ListPage />} />
        <Route path="/list/:listId/admin" element={<AdminPage />} />
        <Route path="*" element={
          <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
            <h2>404 — Strona nie istnieje</h2>
            <Link to="/" className="btn btn-secondary mt-4" style={{ display: 'inline-flex' }}>← Strona główna</Link>
          </div>
        } />
      </Routes>
      <ToastProvider />
    </BrowserRouter>
  )
}
