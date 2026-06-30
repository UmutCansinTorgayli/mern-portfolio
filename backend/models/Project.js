const mongoose = require('mongoose')
const projectSchema = new mongoose.Schema({
    ad: {
        type: String,
        required: true
    },
    aciklama: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    github: {
        type: String
    },
    resim: {
        type: String
    },
    teknolojiler: {
        type: [String],
        default: []
    }
})
module.exports = mongoose.model('Project', projectSchema)
