const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')

app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(session({ secret: "token-secreto", resave: true, saveUninitialized: true}))
app.use(flash())

const datos = ['Bienvenido a la HOME de la WEB']

let pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'caco87',
    password: '1884',
    database: 'blog_viajes'
})

app.get('/', (req, res) => {
    res.render('index')
})

app.listen(8080, (req, res) => {
    console.log(`Server OK!`);
})



