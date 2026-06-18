import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="page">
      <div className="home-hero">
        <h1>Wybierajcie <span>razem</span></h1>
        <p>
          Stwórz listę propozycji, udostępnij znajomym i zdecydujcie wspólnie — prezent, film, wakacje, cokolwiek.
        </p>
        <Link to="/create" className="btn btn-primary btn-lg">
          Utwórz nową listę →
        </Link>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">🔗</div>
          <h3>Linki, zdjęcia, opisy</h3>
          <p>Dodawaj propozycje w dowolnym formacie — linki, tekst lub obrazki.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🗳️</div>
          <h3>Trzy tryby głosowania</h3>
          <p>Lajki, Top N lub ranking drag&drop — wybierz co pasuje do okazji.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Wyniki na żywo</h3>
          <p>Głosy i komentarze pojawiają się w czasie rzeczywistym — bez odświeżania.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Kontrola dostępu</h3>
          <p>Publiczna lista lub chroniona hasłem. Ty decydujesz kto może dodawać.</p>
        </div>
      </div>
    </div>
  )
}
