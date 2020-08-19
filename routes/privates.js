const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const { Router } = require('express')

const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'caco_blog',
    password: '1884',
    database: 'blog_viajes'
})

router.get('/index', function(req, res) {
    pool.getConnection(function(err, connection) {
      const consulta = `
        SELECT * 
        FROM publicaciones
        WHERE
        autor_id = ${connection.escape(req.session.usuario.id)}`
  
      connection.query(consulta, function(error, filas, campos) {
        res.render('admin/index', { usuario: req.session.usuario, mensaje: req.flash('mensaje'), publicaciones: filas})
      })
      connection.release()
    })
  })
  
  router.get('/procesar_cerrar_sesion', function(req, res) {
    req.session.destroy()
    res.redirect('/')
  })
  
  router.get('/agregar', function(req, res) {
    res.render('admin/agregar', { mensaje: req.flash('mensaje'), usuario: req.session.usuario})
  })
  
  
  router.post('/procesar_agregar', function(req, res) {
    pool.getConnection(function(err, connection) {
      const date = new Date()
      const fecha = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
      const consulta = `INSERT INTO publicaciones (titulo, resumen, contenido, autor_id, fecha_hora) VALUES (
        ${connection.escape(req.body.titulo)},
        ${connection.escape(req.body.resumen)},
        ${connection.escape(req.body.contenido)},
        ${connection.escape(req.session.usuario.id)},
        ${connection.escape(fecha)}
      )
      `
      connection.query(consulta, function(error, filas, campos) {
        req.flash('mensaje', 'Publicación agregada')
        res.redirect('/index')
      })
      connection.release()
    })
  })
  
  router.put('/edit/:id', (req, res) => {
    pool.getConnection((err, connection) => {
      const query = `SELECT * FROM publicaciones WHERE id=${connection.escape(req.params.id)}`
      connection.query(query, (error, filas, campos) => {
        if (filas.length > 0) {
          const queryUpdate = `UPDATE publicaciones SET 
            titulo=${connection.escape(req.body.titulo)}, 
            resumen=${connection.escape(req.body.resumen)}, 
            contenido${connection.escape(req.body.contenido)}
          `
          connection.query(queryUpdate, (error, filas, campos) => {
            const queryConsulta = `SELECT * FROM publicaciones WHERE id=${connection.escape(req.params.id)}`
            connection.query(queryConsulta, (error, filas, campos) => {
              res.json({ data: filas[0]})
            })
          })
        } else {
          res.status(400)
          res.send({ errors: ['No se encuentra esa publicación.']})
        }
      })
    })
  })

  module.exports = router