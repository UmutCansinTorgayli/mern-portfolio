const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')

// Profil
router.get('/profil', authMiddleware, (req, res) => {
    res.json({ mesaj: 'Hosgeldin!', kullanici: req.kullanici })
})

module.exports = router
