const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const rateLimit = require('express-rate-limit')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const User = require('../models/User')

const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 5,
    message: { mesaj: 'Cok fazla giris denemesi! 3 dakika bekle.' }
})

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

    const { ad, email, sifre, adminSecret } = req.body

    // Yönetici kodu doğrulaması
    if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
        return res.status(403).json({ mesaj: 'Geçersiz Yönetici Kodu! Yetkisiz kullanıcı kaydı yapılamaz.' })
    }

    try {
        const hashedSifre = await bcrypt.hash(sifre, 10)
        const dogrulamaToken = crypto.randomBytes(32).toString('hex')

        const yeniKullanici = new User({
            ad,
            email,
            sifre: hashedSifre,
            rol: 'admin',
            dogrulanmis: false,
            dogrulamaToken
        })
        await yeniKullanici.save()

        // Doğrulama e-postası gönder
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        const dogrulamaLinki = `http://localhost:5000/api/auth/dogrula/${dogrulamaToken}`

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Hesabınızı Doğrulayın',
            html: `<p>Merhaba ${ad},</p>
                   <p>Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:</p>
                   <a href="${dogrulamaLinki}">${dogrulamaLinki}</a>`
        })

        res.json({ mesaj: 'Kayıt başarılı! E-posta adresinize doğrulama linki gönderildi.' })
    } catch (err) {
        res.status(500).json({ mesaj: 'Sunucu hatasi!', hata: err.message })
    }
})

// E-posta doğrulama linki
router.get('/dogrula/:token', async (req, res) => {
    try {
        const kullanici = await User.findOne({ dogrulamaToken: req.params.token })
        if (!kullanici) {
            return res.status(400).json({ mesaj: 'Geçersiz veya süresi dolmuş doğrulama linki.' })
        }
        kullanici.dogrulanmis = true
        kullanici.dogrulamaToken = undefined
        await kullanici.save()
        res.send('<h2>✅ E-posta doğrulandı! Artık giriş yapabilirsiniz.</h2>')
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
    // E-posta doğrulanmamışsa giriş engelle
    if (!kullanici.dogrulanmis) {
        return res.status(403).json({ mesaj: 'E-posta adresiniz henüz doğrulanmadı. Lütfen gelen kutunuzu kontrol edin.' })
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
