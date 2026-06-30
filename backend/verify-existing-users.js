require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

async function dogrulamaYap() {
    await mongoose.connect(process.env.MONGODB_URI)
    const sonuc = await User.updateMany(
        { dogrulanmis: { $ne: true } },
        { $set: { dogrulanmis: true } }
    )
    console.log(`${sonuc.modifiedCount} kullanici dogrulanmis olarak isaretlen.`)
    await mongoose.disconnect()
}

dogrulamaYap()
