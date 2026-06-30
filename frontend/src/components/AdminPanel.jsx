import { useState, useEffect } from 'react'

function AdminPanel({ onLogout, onBackToHome }) {
  const [projeler, setProjeler] = useState([])
  const [ad, setAd] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [link, setLink] = useState('')
  const [github, setGithub] = useState('')
  const [resim, setResim] = useState('')
  const [teknolojilerInput, setTeknolojilerInput] = useState('')

  const [hata, setHata] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  // GitHub Importer States
  const [aktifSekme, setAktifSekme] = useState('manuel') // 'manuel' veya 'github'
  const [githubUser, setGithubUser] = useState('UmutCansinTorgayli')
  const [githubRepos, setGithubRepos] = useState([])
  const [secilenRepos, setSecilenRepos] = useState([])
  const [githubHata, setGithubHata] = useState('')
  const [githubYukleniyor, setGithubYukleniyor] = useState(false)
  const [importState, setImportState] = useState('idle') // 'idle', 'importing', 'done'

  const token = localStorage.getItem('token')

  // Projeleri getirme fonksiyonu
  const projeleriGetir = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects')
      const data = await res.json()
      setProjeler(data)
    } catch (err) {
      console.error('Projeler getirilemedi:', err)
    }
  }

  useEffect(() => {
    projeleriGetir()
  }, [])

  // Proje Ekleme
  const handleEkle = async (e) => {
    e.preventDefault()
    setHata('')
    setMesaj('')
    setYukleniyor(true)

    // Virgülle ayrılan teknolojileri diziye dönüştür
    const teknolojiler = teknolojilerInput
      ? teknolojilerInput.split(',').map(item => item.trim()).filter(item => item !== '')
      : []

    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ ad, aciklama, link, github, resim, teknolojiler })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.mesaj || 'Proje eklenirken hata oluştu!')
      }

      setMesaj('Proje başarıyla eklendi! 🎉')
      // Formu sıfırla
      setAd('')
      setAciklama('')
      setLink('')
      setGithub('')
      setResim('')
      setTeknolojilerInput('')

      // Listeyi yenile
      projeleriGetir()
    } catch (err) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  // Proje Silme
  const handleSil = async (id) => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.mesaj || 'Silme işlemi başarısız!')
      }

      alert('Proje silindi!')
      projeleriGetir()
    } catch (err) {
      alert(err.message)
    }
  }

  // GitHub Repolarını Getir
  const githubReposGetir = async () => {
    setGithubHata('')
    setGithubRepos([])
    setSecilenRepos([])
    setGithubYukleniyor(true)
    try {
      const res = await fetch(`https://api.github.com/users/${githubUser}/repos?per_page=100`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Kullanıcı bulunamadı!')
        }
        throw new Error('GitHub verileri çekilemedi!')
      }
      const data = await res.json()
      // Sadece fork olmayan public repoları listele, güncelliğe göre sırala
      const siraliRepos = data
        .filter(repo => !repo.fork)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      setGithubRepos(siraliRepos)
    } catch (err) {
      setGithubHata(err.message)
    } finally {
      setGithubYukleniyor(false)
    }
  }

  // GitHub Repolarını İçe Aktar
  const handleGithubImport = async () => {
    if (secilenRepos.length === 0) {
      alert('Lütfen en az bir proje seçin!')
      return
    }

    setImportState('importing')
    setHata('')
    setMesaj('')
    
    let basariliSayisi = 0
    let hataSayisi = 0

    for (const repoId of secilenRepos) {
      const repo = githubRepos.find(r => r.id === repoId)
      if (!repo) continue

      try {
        const res = await fetch('http://localhost:5000/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            ad: repo.name,
            aciklama: repo.description || 'GitHub repository',
            github: repo.html_url,
            teknolojiler: repo.language ? [repo.language] : [],
            link: repo.homepage || '',
            resim: ''
          })
        })

        if (!res.ok) {
          throw new Error('İçe aktarma hatası')
        }
        basariliSayisi++
      } catch (err) {
        hataSayisi++
      }
    }

    setImportState('done')
    if (hataSayisi === 0) {
      setMesaj(`${basariliSayisi} proje başarıyla içe aktarıldı! 🎉`)
    } else {
      setHata(`${basariliSayisi} proje aktarıldı, ${hataSayisi} projede hata oluştu.`);
    }

    setSecilenRepos([])
    projeleriGetir() // Listeyi yenile
  }

  // Seçim yönetimi yardımcıları
  const handleCheckboxChange = (repoId) => {
    if (secilenRepos.includes(repoId)) {
      setSecilenRepos(secilenRepos.filter(id => id !== repoId))
    } else {
      setSecilenRepos([...secilenRepos, repoId])
    }
  }

  const hepsiniSecToggle = () => {
    if (secilenRepos.length === githubRepos.length) {
      setSecilenRepos([])
    } else {
      setSecilenRepos(githubRepos.map(r => r.id))
    }
  }

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '20px', marginBottom: '30px' }}>
        <h2 style={{ fontWeight: '700' }}>Yönetici Paneli 🛠️</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onBackToHome} className="btn btn-secondary">Anasayfaya Git</button>
          <button onClick={onLogout} className="btn btn-danger">Çıkış Yap</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* PROJE YÖNETİM PANELİ (SEKMELİ) */}
        <div style={{ background: 'var(--container-bg)', border: '1px solid var(--card-border)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
          {/* Sekme Butonları */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
            <button 
              onClick={() => setAktifSekme('manuel')} 
              type="button"
              style={{
                background: aktifSekme === 'manuel' ? 'var(--primary)' : 'transparent',
                color: aktifSekme === 'manuel' ? 'white' : 'var(--text-color)',
                border: aktifSekme === 'manuel' ? 'none' : '1px solid var(--input-border)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Manuel Proje Ekle
            </button>
            <button 
              onClick={() => setAktifSekme('github')} 
              type="button"
              style={{
                background: aktifSekme === 'github' ? 'var(--primary)' : 'transparent',
                color: aktifSekme === 'github' ? 'white' : 'var(--text-color)',
                border: aktifSekme === 'github' ? 'none' : '1px solid var(--input-border)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              GitHub'dan Aktar 🔗
            </button>
          </div>

          {hata && <div className="alert alert-danger">{hata}</div>}
          {mesaj && <div className="alert alert-success">{mesaj}</div>}

          {aktifSekme === 'manuel' ? (
            <form onSubmit={handleEkle}>
              <div className="form-group">
                <label>Proje Adı*</label>
                <input type="text" value={ad} onChange={(e) => setAd(e.target.value)} required className="form-control" placeholder="E-Ticaret Projesi" />
              </div>

              <div className="form-group">
                <label>Açıklama*</label>
                <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} required rows="3" className="form-control" placeholder="Proje detayları..." style={{ resize: 'vertical' }}></textarea>
              </div>

              <div className="form-group">
                <label>Canlı Demo Linki</label>
                <input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="form-control" placeholder="https://example.com" />
              </div>

              <div className="form-group">
                <label>GitHub Depo Linki</label>
                <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} className="form-control" placeholder="https://github.com/username/repo" />
              </div>

              <div className="form-group">
                <label>Teknolojiler (Virgülle ayırın)</label>
                <input type="text" value={teknolojilerInput} onChange={(e) => setTeknolojilerInput(e.target.value)} placeholder="React, Node.js, MongoDB" className="form-control" />
              </div>

              <button type="submit" disabled={yukleniyor} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                {yukleniyor ? 'Ekleniyor...' : 'Proje Ekle'}
              </button>
            </form>
          ) : (
            <div>
              <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>GitHub Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={githubUser} 
                    onChange={(e) => setGithubUser(e.target.value)} 
                    className="form-control" 
                    placeholder="GitHub kullanıcı adı girin" 
                  />
                </div>
                <button 
                  onClick={githubReposGetir} 
                  disabled={githubYukleniyor} 
                  className="btn btn-primary" 
                  style={{ height: '46px', padding: '0 20px' }}
                >
                  {githubYukleniyor ? 'Getiriliyor...' : 'Getir'}
                </button>
              </div>

              {githubHata && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{githubHata}</div>}

              {githubRepos.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Toplam Repo: <strong>{githubRepos.length}</strong> | Seçilen: <strong>{secilenRepos.length}</strong>
                    </span>
                    <button 
                      type="button"
                      onClick={hepsiniSecToggle} 
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}
                    >
                      {secilenRepos.length === githubRepos.length ? 'Tüm Seçimleri Kaldır' : 'Tümünü Seç'}
                    </button>
                  </div>

                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--card-border)', 
                    borderRadius: '10px', 
                    padding: '8px',
                    backgroundColor: 'var(--bg-color)',
                    marginBottom: '20px'
                  }}>
                    {githubRepos.map(repo => (
                      <div 
                        key={repo.id} 
                        onClick={() => handleCheckboxChange(repo.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '10px', 
                          padding: '10px', 
                          borderBottom: '1px solid var(--card-border)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          marginBottom: '4px',
                          backgroundColor: secilenRepos.includes(repo.id) ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={secilenRepos.includes(repo.id)}
                          onChange={() => {}} // parent click manages state
                          style={{ marginTop: '4px', cursor: 'pointer' }}
                        />
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
                            <strong style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {repo.name}
                            </strong>
                            {repo.language && (
                              <span style={{ 
                                fontSize: '0.75rem', 
                                background: 'rgba(99, 102, 241, 0.15)', 
                                color: 'var(--primary)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}>
                                {repo.language}
                              </span>
                            )}
                          </div>
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-muted)', 
                            margin: '3px 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {repo.description || 'Açıklama girilmemiş.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleGithubImport} 
                    disabled={importState === 'importing' || secilenRepos.length === 0} 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  >
                    {importState === 'importing' ? 'İçe Aktarılıyor...' : `Seçilenleri İçe Aktar (${secilenRepos.length})`}
                  </button>
                </div>
              ) : (
                !githubYukleniyor && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '40px 0', fontSize: '0.9rem' }}>
                    Kullanıcı adını yazıp <strong>Getir</strong> butonuna basarak repoları listeleyebilirsiniz.
                  </p>
                )
              )}
            </div>
          )}
        </div>

        {/* MEVCUT PROJELERİN LİSTESİ VE SİLME SEÇENEĞİ */}
        <div style={{ background: 'var(--container-bg)', border: '1px solid var(--card-border)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Mevcut Projeler ({projeler.length})</h3>
          
          {projeler.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Henüz hiç proje eklenmemiş.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projeler.map(proje => (
                <div key={proje._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--card-border)', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-color)' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{proje.ad}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {proje.teknolojiler && proje.teknolojiler.length > 0 ? proje.teknolojiler.join(', ') : 'Teknoloji yok'}
                    </span>
                  </div>
                  <button onClick={() => handleSil(proje._id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Sil</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default AdminPanel
