import { useState } from 'react'

function Register({ onRegisterSuccess, onCancel }) {
    const [ad, setAd] = useState('')
    const [email, setEmail] = useState('')
    const [sifre, setSifre] = useState('')
    const [adminSecret, setAdminSecret] = useState('')
    const [hata, setHata] = useState('')
    const [mesaj, setMesaj] = useState('')
    const [yukleniyor, setYukleniyor] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setHata('')
        setYukleniyor(true)
        try {
            const response = await fetch('http://localhost:5000/api/auth/kayit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ad, email, sifre, adminSecret })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.mesaj || 'Kayıt başarısız!')
            }
            setMesaj('Kayıt başarılı! Giriş yapılıyor...');
            setTimeout(() => onRegisterSuccess(), 2000)
        } catch (err) {
            setHata(err.message)
        } finally {
            setYukleniyor(false)
        }
    }

    return (
        <div className="form-container">
            <h2 style={{ marginBottom: '25px', textAlign: 'center', fontWeight: '600' }}>Yeni Kayıt</h2>

            {hata && <div className="alert alert-danger">{hata}</div>}
            {mesaj && <div className="alert alert-success">{mesaj}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Ad Soyad</label>
                    <input
                        type="text"
                        value={ad}
                        onChange={(e) => setAd(e.target.value)}
                        required
                        className="form-control"
                        placeholder="Umut Cansın"
                    />
                </div>

                <div className="form-group">
                    <label>E-posta Adresi</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-control"
                        placeholder="cansinumutt0654@gmail.com"
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
                <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label>Yönetici Gizli Kodu</label>
                    <input
                        type="password"
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        required
                        className="form-control"
                        placeholder="Yönetici anahtarını girin"
                    />
                </div>

                <button
                    type="submit"
                    disabled={yukleniyor}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', marginBottom: '12px' }}
                >
                    {yukleniyor ? 'Kaydediliyor...' : 'Kayıt Ol'}
                </button>
            </form>

            <button
                onClick={onCancel}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            >
                İptal Et / Geri Dön
            </button>
        </div>
    )
}

export default Register
