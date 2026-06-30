const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    ad: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    sifre: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    dogrulanmis: { type: Boolean, default: false },
    dogrulamaToken: { type: String }
})

module.exports = mongoose.model('User', userSchema)