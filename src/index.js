const express = require('express')
const jwt = require('jsonwebtoken')
require('./db/mongoose')
const userRoutes = require('./db/routes/user')
const taskRoutes = require('./db/routes/task')
const mongoose = require('mongoose')

const app = express()
const port = process.env.PROT || 3000
//Middleware

// Ping mongoose, ensure it's available
app.use((req, res, next) => {
    const mongooseConn = mongoose.connection.readyState
    if(mongooseConn == 0 || mongooseConn == 3){
        return res.status(500).send('Database unavailable. Try again later.')
    }
    next()
})


app.use(express.json())
app.use(userRoutes)
app.use(taskRoutes)


app.listen(port, () => {
    console.log('Server is running =>', port);
})
