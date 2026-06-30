const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const rateLimit = require('express-rate-limit')
const User = require('../models/User')

const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 5,
    message: { mesaj: 'Cok fazla giris denemesi! 15 dakika bekle.' }
})

// Kayıt
// Kayıt
router.post('/kayit', [
    body('ad').notEmpty().withMessage('Ad bos olamaz'),
    body('email').isEmail().normalizeEmail().withMessage('Gecerli email gir'),
    body('sifre').isLength({ min: 6 }).withMessage('Sifre en az 6 karakter')
], async (req, res) => {
    const hatalar = validationResult(req)
    if (!hatalar.isEmpty()) {
        return res.status(400).json({ hatalar: hatalar.array() })
    }

    // Gelen istekten adminSecret (Yönetici Kodu) alanını alıyoruz
    const { ad, email, sifre, adminSecret } = req.body

    // Kod doğrulaması yapıyoruz
    if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
        return res.status(403).json({ mesaj: 'Geçersiz Yönetici Kodu! Yetkisiz kullanıcı kaydı yapılamaz.' })
    }

    try {
        const hashedSifre = await bcrypt.hash(sifre, 10)
        // Yönetici kodu doğru olduğuna göre, bu kullanıcıyı doğrudan 'admin' rolüyle kaydediyoruz
        const yeniKullanici = new User({ ad, email, sifre: hashedSifre, rol: 'admin' })
        await yeniKullanici.save()
        res.json({ mesaj: 'Kullanici olusturuldu!' })
    } catch (err) {
        res.status(500).json({ mesaj: 'Sunucu hatasi!', hata: err.message })
    }
})


// Giriş
router.post('/giris', loginLimiter, async (req, res) => {
    const { email, sifre } = req.body
    const kullanici = await User.findOne({ email })
    if (!kullanici) {
        return res.status(404).json({ mesaj: 'Kullanici bulunamadi!' })
    }
    const dogruMu = await bcrypt.compare(sifre, kullanici.sifre)
    if (!dogruMu) {
        return res.status(401).json({ mesaj: 'Sifre yanlis!' })
    }
    const token = jwt.sign(
        { id: kullanici._id, ad: kullanici.ad, rol: kullanici.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    )
    res.json({ mesaj: 'Giris basarili!', token, rol: kullanici.rol })
})

module.exports = router
