const express = require('express')
const User = require('../models/user')
const multer = require('multer')
const route = new express.Router()
const authenticate = require('./middleware/authentication')
const fs = require('fs');
const path = require('path')
const sharp = require('sharp') 

const upload = multer({
    limits:{
        fileSize: 3145728   // 3 MB 
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)){
            cb(new Error('Only png, jpg and jpeg are supported'));
        }
        
        req.targetFile = "avatars/"+Math.random().toString(36).substr(2, 5) + Date.now() + '.' + file.originalname.split('.')[1]
        cb(undefined, true)
    }
})

async function saveFile(target, buffer){
    fs.writeFile(target, buffer, err => {
        if(err)
            res = err;
    });
    
}

function errorHandler(error, req, res, next){
    res.status(400).send({error: error.message})
}

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

route.get('/users/me', authenticate, async (req, res) => {
    tasks = await req.user.populate('tasks').execPopulate()
    const user = req.user.toJSON()
    user.tasks = req.user.tasks    
    res.send(user)
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

route.delete('/users/me',authenticate , async (req, res) => {
    try {
        const operation = await req.user.remove()
        if(operation)
            res.send(operation)
    } catch (error) {
        res.status(500).send(error)
    }
})

route.post('/users/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    try{
        const image = sharp(req.file.buffer);
        const newBuffer = await image.resize(350, 350, {
            fit: "inside"
        }).toBuffer()
        await saveFile(req.targetFile, newBuffer)
        req.user.avatar = newBuffer;
        req.user.avatarPath = req.targetFile;
        await req.user.save();
    }catch(err){
        res.status(500).send();
    }
    res.send('Avatar set ' + req.targetFile);
}, errorHandler)


route.get('/users/:id/avatar', async (req, res) => {
    req.user = await User.findById(req.params.id);
    if(!req.user.avatar){
        //send placeholder
        const placeholder = path.join(__dirname,"../../../assets/placeholder.jpg")
        return res.sendFile(placeholder);
    }
    res.set('Content-Type', 'image/jpg');
    res.send(req.user.avatar)
    
})


module.exports = route