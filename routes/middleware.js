const express = require('express')
const router = express.Router()
const mysql = require('mysql')

const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'caco_blog',
    password: '1884',
    database: 'blog_viajes'
})

router.use('/admin/', (req, res, next) => {
    if (!req.session.usuario) {
        req.flash('mensaje', 'Debe iniciar sesión')
        res.redirect('/iniciar_sesion')
    } else {
        console.log('Middleware admin');
        next()
    }
})

router.use('/admin/publicaciones', (req, res, next) => {
    if (!req.session.usuario) {
        req.flash('mensaje', 'Debe iniciar sesión')
        res.redirect('/iniciar_sesion')
    } else {
        console.log('Middleware publicaciones');
        next()
    }
})

module.exports = router