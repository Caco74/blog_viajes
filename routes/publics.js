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

router.get('/', function (req, res) {
    pool.getConnection(function (err, connection) {
      let consulta
      let modificadorConsulta = ''
      let modificadorPagina = ''
      let pagina = 0
      const busqueda = ( req.query.busqueda) ? req.query.busqueda : ''
      if (busqueda != '') {
        modificadorConsulta = `
          WHERE 
          titulo LIKE '%${busqueda}%' OR 
          resumen LIKE '%${busqueda}%' OR
          contenido LIKE '%${busqueda}%'
        `
        modificadorPagina = ''
      } else {
        pagina = (req.query.pagina) ? parseInt(req.query.pagina) : 0
        if (pagina < 0) {
          pagina = 0
        }
        modificadorPagina = `
          LIMIT 5 OFFSET ${pagina*5}
        `
      }
      consulta = `
        SELECT 
        titulo, resumen, fecha_hora, pseudonimo, votos 
        FROM publicaciones 
        INNER JOIN autores 
        ON publicaciones.autor_id = autores.id ${modificadorConsulta} 
        ORDER BY fecha_hora DESC 
        ${modificadorPagina}
      `
      connection.query(consulta, function (error, filas, campos) {
        res.render('index', { publicaciones: filas, busqueda: busqueda, pagina: pagina })
      })
      connection.release()
    })
  })
  
  router.get('/registro', function (req, res) {
    res.render('registro', { mensaje: req.flash('mensaje') })
  })
  
  router.post('/procesar_registro', function (peticion, respuesta) {
    pool.getConnection(function (err, connection) {
  
      const email = peticion.body.email.toLowerCase().trim()
      const pseudonimo = peticion.body.pseudonimo.trim()
      const contrasena = peticion.body.contrasena
  
      const consultaEmail = `
        SELECT *
        FROM autores
        WHERE email = ${connection.escape(email)}
      `
  
      connection.query(consultaEmail, function (error, filas, campos) {
        if (filas.length > 0) {
          peticion.flash('mensaje', 'Email duplicado')
          respuesta.redirect('/registro')
        }
        else {
  
          const consultaPseudonimo = `
            SELECT *
            FROM autores
            WHERE pseudonimo = ${connection.escape(pseudonimo)}
          `
  
          connection.query(consultaPseudonimo, function (error, filas, campos) {
            if (filas.length > 0) {
              peticion.flash('mensaje', 'Pseudonimo duplicado')
              respuesta.redirect('/registro')
            }
            else {
  
              const consulta = `
                                  INSERT INTO
                                  autores
                                  (email, contrasena, pseudonimo)
                                  VALUES (
                                    ${connection.escape(email)},
                                    ${connection.escape(contrasena)},
                                    ${connection.escape(pseudonimo)}
                                  )
                                `
              connection.query(consulta, function (error, filas, campos) {
                peticion.flash('mensaje', 'Usuario registrado')
                respuesta.redirect('/registro')
              })
            }
          })
        }
      })
      connection.release()
    })
  })
  
  router.get('/iniciar_sesion', function(req, res) {
    res.render('iniciar_sesion', { mensaje: req.flash('mensaje')})
  })
  
  router.post('/procesar_sesion', function(req, res) {
    pool.getConnection(function (err, connection) {
  
      const consulta = `
        SELECT *
        FROM autores
        WHERE
        email = ${connection.escape(req.body.email)} AND
        contrasena = ${connection.escape(req.body.contrasena)}
      `
  
    
      connection.query(consulta, function(error, filas, campos) {
        if (filas.length > 0 ) {
          req.session.usuario = filas[0]
          res.redirect('/admin/index')
        } else {
          req.flash('mensaje', 'Datos Inválidos!')
          res.redirect('/iniciar_sesion')        
        }
      })
      connection.release()
    })
  })

  module.exports = router