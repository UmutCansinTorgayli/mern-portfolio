// 1. Kütüphaneler
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')

// Route dosyaları
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const projectRoutes = require('./routes/project')

// 2. Sunucu oluştur
const app = express()

// 3. Middleware'ler
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    Object.defineProperty(req, 'query', {
        value: { ...req.query },
        writable: true,
        configurable: true,
        enumerable: true
    })
    next()
})
app.use(mongoSanitize())
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { mesaj: 'Cok fazla istek!' }
}))

// 4. Rotalar
app.get('/', (req, res) => res.json({ message: 'Server is running!' }))
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/projects', projectRoutes)
// 5. Veritabanı + Sunucu
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB baglandi!')
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`)
        })
    })
    .catch((err) => console.log('MongoDB hatasi:', err))
