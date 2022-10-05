/* ---------------------- Modulos ----------------------*/
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const knex = require('knex')
const { Server: HttpServer } = require('http');
const { Server: IOServer } = require('socket.io');

/* ---------------------- Instancia de servidor ----------------------*/

const knexSqlite = knex({
    client: 'sqlite3',
    connection: {
        filename: __dirname+"./DB/mydb.sqlite"
    }
})
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

/* ---------------------- Middlewares ---------------------- */
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Motor de plantillas
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: 'hbs'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


/*---------------------- Base de datos ----------------------*/
const DB_PRODUCTOS = [
]

/* ---------------------- Rutas ----------------------*/
app.get('/', (req, res) => {
    // res.sendFile(path.join(__dirname, './public', 'index.html'));
    res.render('vista', {DB_PRODUCTOS});
});

app.get('/cargados', (req, res)=>{
    res.render('cargados', {DB_PRODUCTOS});
});

app.post('/productos', (req, res)=>{
    DB_PRODUCTOS.push(req.body);
    console.log(DB_PRODUCTOS);
    res.redirect('/cargados');
});

async function createTable() {
    const exists = await knexSqlite.schema.hasTable('mensaje');
    if (!exists) {
        await knexSqlite.schema.createTable('mensaje', table =>{
            table.string('from');
            table.string('text');
        })
    }
}

createTable();
/* ---------------------- Servidor ----------------------*/
const PORT = 3006;
const server = httpServer.listen(PORT, ()=>{
    console.log(`Servidor escuchando en el puerto ${server.address().port}`)
})

server.on('error', err => console.log(`error en server ${err}`));

/* ---------------------- WebSocket ----------------------*/
io.on('connection', async socket=>{
    const msgs = await knexSqlite.from('mensaje').select('from', 'text');
    console.log(`Nuevo cliente conectado! ${socket.id}`);
    socket.emit('mensajes', msgs);

    socket.on('nuevoMensaje', async msg => {
        await knexSqlite('mensaje').insert({from: socket.id, text: msg})
        const msgs = await knexSqlite.from('mensaje').select('from', 'text')
        // DB_MENSAJES.push(mensaje);
        io.sockets.emit('mensajes', msgs);
    });
})
