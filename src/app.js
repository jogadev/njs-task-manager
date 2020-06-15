const express = require('express')
require('./db/mongoose')
const userRoutes = require('./routes/user')
const taskRoutes = require('./routes/task')
const mongoose = require('mongoose')

const app = express()
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


module.exports = app;