const express = require('express')
const User = require('../models/user')

const route = new express.Router()
const authenticate = require('./middleware/authentication')

route.post('/users', async (req,res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateToken()
        res.status(201).send({user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

route.get('/users/me', authenticate, (req, res) => {
    res.send(req.user)
})

route.post('/users/logout', authenticate, async (req, res) => {
    try {
        const user = req.user
        user.tokens = user.tokens.filter(tok => {
            return tok.token != req.token
        })
        await user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

route.post('/users/logout/all', authenticate, async (req, res) => {
    try {
        const user = req.user;
        user.tokens = []
        await user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

route.post('/users/login', async (req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateToken()
        res.send({user, token})
    } catch (error) {
        console.log('ERROR=>', error);
        res.status(400).send()
    }
    
})


route.get('/users', async (req, res) => {
    try {
        const usersList = await User.find({})
        res.status(200).send(usersList)
    } catch (error) {
        res.status(505).send(error)
    }
})

route.get('/users/:id', async (req, res) => {
    try{
        const foundUser = await User.findById(req.params.id)
        if(foundUser)
            res.send(foundUser)
        else
            res.status(404).send()
    }catch(error){
        res.status(500).send()
    }
})


route.patch('/users/me',authenticate ,async (req,res) => {
    const allowedKeys = ['name', 'age', 'email', 'password']
    const updates = Object.keys(req.body)
    const validOperation = updates.every(item => allowedKeys.includes(item))    
    if(!validOperation)
        return res.status(400).send({
            'message': 'Invalid updates',
            'allowedKeys': allowedKeys
        })

    try {
        const targetUser = req.user
        updates.forEach(updateKey => {targetUser[updateKey] = req.body[updateKey]})
        
        const operation = await targetUser.save()
        res.send(operation)

    } catch (error) {
        res.status(500).send()
    }
            
})

route.delete('/users/:id', async (req, res) => {
    try {
        const operation = await User.findByIdAndDelete(req.params.id)
        if(operation)
            res.send(operation)
        else
            res.status(404).send()
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = route