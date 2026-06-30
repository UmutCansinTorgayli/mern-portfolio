import { useState } from 'react'

function Login({ onLoginSuccess, onCancel, onGoToRegister }) {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/giris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, sifre })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.mesaj || 'Giriş yapılamadı!')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.rol)

      onLoginSuccess(data.rol)
    } catch (err) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="form-container">
      <h2 style={{ marginBottom: '25px', textAlign: 'center', fontWeight: '600' }}>Giriş Yap</h2>

      {hata && <div className="alert alert-danger">{hata}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>E-posta Adresi</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-control"
            placeholder="admin@portfolio.com"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label>Şifre</label>
          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            required
            className="form-control"
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          disabled={yukleniyor}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '1rem', marginBottom: '12px' }}
        >
          {yukleniyor ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      <button
        onClick={onCancel}
        className="btn btn-secondary"
        style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
      >
        İptal Et / Geri Dön
      </button>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Hesabınız yok mu?{' '}
        <button
          type="button"
          onClick={onGoToRegister}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontWeight: '600' }}
        >
          Kayıt Olun
        </button>
      </p>
    </div>
  )
}

export default Login
