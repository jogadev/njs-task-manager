const jwt = require('jsonwebtoken')
const User = require('../../db/models/user')

const auth = async function(req, res, next){
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token,'supersecret')
        const user = await User.findOne({"_id": decoded._id, 'tokens.token': token})
        if(!user)
            throw new Error('Unathorized or not found')
        req.token = token
        req.user = user
        next()
    } catch (error) {
        console.log(error);
        
        return res.status(401).send({"message":"Please authenticate"})
    }
}

module.exports = auth