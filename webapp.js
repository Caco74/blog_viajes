const express = require('express')
const aplicacion = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')
const fileUpload = require('express-fileupload')

const routeMiddleware = require('./routes/middleware')
const routePublics = require('./routes/publics')
const routePrivates = require('./routes/privates')

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))
aplicacion.set("view engine", "ejs")
aplicacion.use(session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }));
aplicacion.use(flash())
aplicacion.use(express.static('public'))
aplicacion.use(fileUpload())

aplicacion.use(routeMiddleware)
aplicacion.use(routePublics)
aplicacion.use('/admin', routePrivates)

aplicacion.listen(8080, function () {
  console.log("Servidor iniciado")
})
