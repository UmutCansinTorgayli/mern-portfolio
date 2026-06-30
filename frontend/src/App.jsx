import { useState, useEffect } from 'react'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import Register from './components/Register'

function App() {
  const [projeler, setProjeler] = useState([])
  const [sayfa, setSayfa] = useState('anasayfa') // 'anasayfa', 'login', 'admin'
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [role, setRole] = useState(localStorage.getItem('role') || '')

  // Tema state'i (Varsayılan olarak 'dark' (karanlık) başlar)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  // Tema değiştirme fonksiyonu
  const toggleTheme = () => {
    const yeniTema = theme === 'light' ? 'dark' : 'light'
    setTheme(yeniTema)
    localStorage.setItem('theme', yeniTema)
  }

  // Projeleri getirme fonksiyonu
  const projeleriGetir = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects')
      const data = await response.json()
      setProjeler(data)
    } catch (error) {
      console.error('Veri çekme hatası:', error)
    }
  }

  useEffect(() => {
    projeleriGetir()
  }, [])

  // Giriş başarılı olunca çalışacak fonksiyon
  const handleLoginSuccess = (rol) => {
    const kayitliToken = localStorage.getItem('token')
    setToken(kayitliToken)
    setRole(rol)
    if (rol === 'admin') {
      setSayfa('admin')
    } else {
      setSayfa('anasayfa')
    }
    projeleriGetir()
  }


  // Çıkış yapınca çalışacak fonksiyon
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken('')
    setRole('')
    setSayfa('anasayfa')
  }

  // Sayfa yönlendirme mantığı (State-tabanlı routing)
  if (sayfa === 'login') {
    return (
      <div className={`app-wrapper ${theme}`}>
        <Login
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setSayfa('anasayfa')}
          onGoToRegister={() => setSayfa('register')}
        />
      </div>
    )
  }

  if (sayfa === 'register') {
    return (
      <div className={`app-wrapper ${theme}`}>
        <Register
          onRegisterSuccess={() => setSayfa('login')} // Kayıt başarılıysa giriş ekranına at
          onCancel={() => setSayfa('login')} // İptal ederse giriş ekranına geri dön
        />
      </div>
    )
  }

  if (sayfa === 'admin') {
    // Güvenlik: Eğer token yoksa admin sayfasına erişimi engelle, anasayfaya at
    if (!token) {
      setSayfa('anasayfa')
      return null
    }
    return (
      <div className={`app-wrapper ${theme}`}>
        <AdminPanel
          onLogout={handleLogout}
          onBackToHome={() => {
            setSayfa('anasayfa')
            projeleriGetir() // Anasayfaya dönerken listeyi güncelle
          }}
        />
      </div>
    )
  }

  // Varsayılan sayfa: Anasayfa (Showcase)
  return (
    <div className={`app-wrapper ${theme}`}>
      <div className="container">

        {/* Üst Kısım / Navigasyon */}
        <header className="header">
          <h1>Benim Projelerim </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            {/* Tema Değiştirme Butonu */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Karanlık moda geç' : 'Aydınlık moda geç'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {token ? (
              <>
                {role === 'admin' && (
                  <button
                    onClick={() => setSayfa('admin')}
                    className="btn btn-primary"
                  >
                    Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="btn btn-danger"
                >
                  Çıkış
                </button>
              </>
            ) : (
              <button
                onClick={() => setSayfa('login')}
                className="btn btn-primary"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </header>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px' }}>
          Merhaba! Ben Umut. Geliştirdiğim full-stack projeleri aşağıda inceleyebilirsiniz:
        </p>

        {/* Projelerin Listelenmesi (CSS Grid) */}
        {projeler.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>
            Yükleniyor veya henüz hiç proje eklenmedi...
          </p>
        ) : (
          <div className="projects-grid">
            {projeler.map((proje) => (
              <div key={proje._id} className="project-card">
                <h3>{proje.ad}</h3>

                {/* Teknolojiler (Etiketler) */}
                {proje.teknolojiler && proje.teknolojiler.length > 0 && (
                  <div className="tech-tags">
                    {proje.teknolojiler.join(', ')}
                  </div>
                )}

                <p>{proje.aciklama}</p>

                {/* Proje Linkleri */}
                <div className="project-links" style={{ display: 'flex', gap: '15px' }}>
                  {proje.github && (
                    <a href={proje.github} target="_blank" rel="noreferrer">
                      GitHub 🔗
                    </a>
                  )}
                  {proje.link && (
                    <a href={proje.link} target="_blank" rel="noreferrer" style={{ color: '#ec4899' }}>
                      Canlı Demo 🔗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
