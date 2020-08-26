const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const path = require('path')
const nodemailer = require('nodemailer')
const { Router } = require('express')

// Objeto que envía el correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'devfranco87@gmail.com',
    pass: '1884franco'
  }
})

function enviarCorreoBienvenida(email, nombre) {
  const opciones = {
    from: 'devfranco87@gmail.com',
    to: email,
    subject: 'Bienvenido al blog de viajes',
    text: `Hola ${nombre}`
  }
  transporter.sendMail(opciones, (error, info) => {

  })
}

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
        publicaciones.id id, titulo, resumen, fecha_hora, pseudonimo, votos, avatar 
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
                // Si existe un archivo cargado, y si existe un archivo subido que se llame avatar ejecutamos la lógica de abajo
                if (peticion.files && peticion.files.avatar) {
                  const archivoAvatar = peticion.files.avatar
                  const id = filas.insertId
                  const nombreArchivo = `${id}${path.extname(archivoAvatar.name)}`

                  archivoAvatar.mv(`./public/avatars/${nombreArchivo}`, (error) => {
                    const consultaAvatar = `
                                  UPDATE 
                                  autores 
                                  SET avatar = ${connection.escape(nombreArchivo)} 
                                  WHERE id = ${connection.escape(id)}
                                  `
                  connection.query(consultaAvatar, (error, filas, campos) => {
                    enviarCorreoBienvenida(email, pseudonimo)
                    peticion.flash('mensaje', 'Usuario registrado con avatar.')
                    respuesta.redirect('/registro')
                  })
                  })

                } else {
                  enviarCorreoBienvenida(email, pseudonimo)
                  peticion.flash('mensaje', 'Usuario registrado.')
                  respuesta.redirect('/registro')
                }
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

  router.get('/publicacion/:id', (req, res) => {
    pool.getConnection((err, connection) => {
      const consulta = `SELECT * FROM publicaciones WHERE 
        id = ${connection.escape(req.params.id)} 
        `
      connection.query(consulta, (error, filas, campos) => {
        if(filas.length > 0) {
          res.render('publicacion', {publicacion: filas[0]})
        } else {
          console.log(error);
          res.redirect('/')
        }
      })
      connection.release()
    })
  })

  router.get('/autores', (req, res) => {
    pool.getConnection((err, connection) => {
      const consulta = ` 
                  SELECT autores.id id, pseudonimo, avatar, publicaciones.id publicacion_id, titulo 
                  FROM autores 
                  INNER JOIN 
                  publicaciones 
                  ON 
                  autores.id = publicaciones.autor_id 
                  ORDER BY autores.id DESC, publicaciones.fecha_hora DESC
                  `
      connection.query(consulta, (error, filas, campos) => {
        autores = []
        ultimoAutorId = undefined
        filas.forEach(registro => {
          if (registro.id != ultimoAutorId) {
            ultimoAutorId = registro.id
            autores.push({
              id: registro.id,
              pseudonimo: registro.pseudonimo,
              avatar: registro.avatar,
              publicaciones: []
            })
          }
          autores[autores.length-1].publicaciones.push({
            id: registro.publicacion_id,
            titulo: registro.titulo
          })
        });
        res.render('autores', {autores: autores})
      })
      connection.release()
    })
  })

  router.get('/publicacion/:id/votar', (req, res) => {
    pool.getConnection((err, connection) => {
      const consulta = `
            SELECT *
            FROM publicaciones
            WHERE id = ${connection.escape(req.params.id)}
            `
      connection.query(consulta, (error, filas, campos) => {
        if (filas.length > 0) {
          const consultaVoto = `
                UPDATE publicaciones
                SET
                votos = votos + 1
                WHERE id = ${connection.escape(req.params.id)}
                `
                connection.query(consultaVoto, (error, filas, campos) => {
                  res.redirect(`/publicacion/${req.params.id}`)
                })
        } else {
          req.flash('mensaje', 'Publicación Inválida')
          res.redirect('/')
        }
      })
      connection.release()
    })
  })

  module.exports = router