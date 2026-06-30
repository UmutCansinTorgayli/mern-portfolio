const express = require('express')
const router = express.Router()
const Project = require('../models/Project')
const authMiddleware = require('../middleware/auth')
const { body, validationResult } = require('express-validator')
const adminMiddleware = require('../middleware/admin')

// Tüm projeleri getir
router.get('/', async (req, res) => {
    try {
        const projeler = await Project.find().sort({ createdAt: -1 })
        res.json(projeler)
    } catch (err) {
        res.status(500).json({ mesaj: 'Proje getirilemedi' })
    }
})
// Tek proje getir
router.get('/:id', async (req, res) => {
    try {
        const proje = await Project.findById(req.params.id)
        if (!proje) return res.status(404).json({ mesaj: 'Proje bulunamadi!' })
        res.json(proje)
    } catch (err) {
        res.status(500).json({ mesaj: 'Hata' })
    }
})
// Proje ekle
router.post('/', authMiddleware, adminMiddleware, [
    body('ad').notEmpty().withMessage('Proje adi gerekli!'),
    body('aciklama').notEmpty().withMessage('Aciklama gerekli!')
], async (req, res) => {
    const hatalar = validationResult(req)
    if (!hatalar.isEmpty()) return res.status(400).json({ hatalar: hatalar.array() })
    const { ad, aciklama, link, github, resim, teknolojiler } = req.body
    try {
        const yeniProje = new Project({ ad, aciklama, link, github, resim, teknolojiler })
        await yeniProje.save()
        res.json({ mesaj: 'Proje eklendi!' })
    } catch (err) {
        res.status(500).json({ mesaj: 'Proje eklenemedi' })
    }
})
// Proje güncelle
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { ad, aciklama, link, github, resim, teknolojiler } = req.body
    try {
        let proje = await Project.findById(req.params.id)
        if (!proje) return res.status(404).json({ mesaj: 'Proje bulunamadi!' })
        proje.ad = ad || proje.ad
        proje.aciklama = aciklama || proje.aciklama
        proje.link = link || proje.link
        proje.github = github || proje.github
        proje.resim = resim || proje.resim
        proje.teknolojiler = teknolojiler || proje.teknolojiler
        await proje.save()
        res.json({ mesaj: 'Proje güncellendi!' })
    } catch (err) {
        res.status(500).json({ mesaj: 'Proje güncellenemedi' })
    }
})
// Proje sil
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        let proje = await Project.findById(req.params.id)
        if (!proje) return res.status(404).json({ mesaj: 'Proje bulunamadi!' })
        await Project.deleteOne({ _id: req.params.id })
        res.json({ mesaj: 'Proje silindi!' })
    } catch (err) {
        res.status(500).json({ mesaj: 'Proje silinemedi' })
    }
})
module.exports = router