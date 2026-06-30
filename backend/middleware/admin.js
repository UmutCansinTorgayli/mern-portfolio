const adminMiddleware = (req, res, next) => {
    if (req.kullanici && req.kullanici.rol === 'admin') {
        next()
    } else {
        return res.status(403).json({
            mesaj: 'Yetkisiz erişim! Bu işlemi yalnızca yönetici (admin) yapabilir.'
        })
    }
}

module.exports = adminMiddleware
