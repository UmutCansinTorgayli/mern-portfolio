const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization

    if (!token) {
        return res.status(401).json({ mesaj: 'Token yok, giris yapman lazim!' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.kullanici = decoded
        next()
    } catch (err) {
        return res.status(401).json({ mesaj: 'Token gecersiz!' })
    }
}

module.exports = authMiddleware
