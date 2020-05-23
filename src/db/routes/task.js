const express = require('express')
const Task = require('../models/task')
const authenticate = require('./middleware/authentication')
const router = new express.Router()

router.post('/tasks', authenticate, async (req, res) => {
    const task = new Task({ ...req.body, "owner": req.user._id })
    try {
        const savedTask = await task.save()
        res.status(201).send(savedTask)
    } catch (error) {
        res.status(400).send()
    }
})

router.get('/tasks', authenticate, async (req, res) => {
    try {
        const allTasks = await Task.find({ "owner": req.user._id })
        res.send(allTasks)
    } catch (error) {
        res.status(500).send()
    }
})


router.get('/tasks/:id', authenticate, async (req, res) => {
    try {
        const _id = req.params.id
        const foundTask = await Task.findOne({ _id, "owner": req.user._id })
        if (foundTask)
            res.send(foundTask)
        else
            res.status(404).send()
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', authenticate, async (req, res) => {
    const allowedKeys = ['description', 'completed']
    const updates = Object.keys(req.body)
    const validOperation = updates.every(item => allowedKeys.includes(item))

    if (!validOperation)
        res.status(400).send({
            'message': 'Invalid updates',
            'allowedKeys': allowedKeys
        })

    try {
        // const operation = await Task.findByIdAndUpdate(req.params.id, req.body, {"new": true, runValidators: true})
        const owner = req.user._id
        const _id = req.params.id
        const targetTask = await Task.findOne({ _id, owner })
        updates.forEach(x => {
            targetTask[x] = req.body[x]
        })
        if (!targetTask)
            return res.status(404).send()
        await targetTask.save()

        res.send(targetTask)
    } catch (error) {
        console.log(error);

        res.status(500).send(error)
    }
})

router.delete('/tasks/:id', authenticate, async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        const targetTask = await Task.findOne({ _id, owner })
        if (!targetTask)
            res.status(404).send()
        await targetTask.remove()
        res.send(targetTask)
    } catch (error) {
        res.status(500).send()
    }
})


module.exports = router