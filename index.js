const express = require('express')
const http = require('http')
const cors = require('cors')
const morgan = require('morgan')
const bp = require('body-parser');
const cp = require('cookie-parser');
const initDB = require('./mongo');
const { ImgsDir } = require('./consts');



const PORT = 5000
//Creates The Express App Object
const app = express()

// Disable All CORS Request
app.use(cors())

// Connect to mongo
initDB()

// Serves static files in the public folder
app.use('/imgs',express.static(ImgsDir))


// Parse Requests
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cp());

// Asign Routes
require('./routes')(app);


// Create The Server Object using express app
const server = http.Server(app)
// Start the Server 
server.listen(PORT,()=>{console.log(`Server listening on port ${PORT}`)});

// Logging Middleware
app.use(morgan('dev'))


require('./connections')(server)

