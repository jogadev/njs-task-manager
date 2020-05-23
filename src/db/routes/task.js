const express = require('express')
const Task = require('../models/task')
const authenticate = require('./middleware/authentication')
const router = new express.Router()
const {ObjectId} = require('mongodb')

router.post('/tasks', authenticate, async (req, res) => {
    const task  = new Task({...req.body, "owner":req.user._id})
    try {        
        const savedTask = await task.save()
        res.status(201).send(savedTask)
    } catch (error) {                
        res.status(400).send()
    }
})

router.get('/tasks', async (req, res) => {
    try {
        const allTasks = await Task.find({})
        res.send(allTasks)
    } catch (error) {
        res.status(500).send()
    }
})


router.get('/tasks/:id', async (req, res) => {
    try {
        const foundTask = await Task.findById(req.params.id)
        if(foundTask)
            res.send(foundTask)
        else
            res.status(404).send()
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', async (req, res) => {
    const allowedKeys = ['description', 'completed']
    const updates = Object.keys(req.body)
    const validOperation = updates.every(item => allowedKeys.includes(item))
    
    if(!validOperation)
        res.status(400).send({
            'message': 'Invalid updates',
            'allowedKeys': allowedKeys
        })

    try {
        const operation = await Task.findByIdAndUpdate(req.params.id, req.body, {"new": true, runValidators: true})
        if(!operation)
            return res.status(404).send()
            
            
        res.send(operation)
    } catch (error) {
        console.log(error);
        
        res.status(500).send(error)
    }
})

router.delete('/tasks/:id', async (req, res) => {
    try {
        const operation = await Task.findByIdAndDelete(req.params.id)
        if(operation)
            res.send(operation)
        else
            res.status(404).send()
    } catch (error) {
        res.status(500).send()
    }
})


module.exports = router