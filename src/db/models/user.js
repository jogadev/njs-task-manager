const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        required: true,
        validate(value) {
            if (value < 0)
                throw new Error('Age must be a positive integer')
            if (value % 1 != 0)
                throw new Error('Age must not contain decimals')
        }
    },
    email: {
        type: String,
        required: true,
        validate(val) {
            if (!isEmail(val))
                throw new Error("Invalid email")
        },
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        validate(val) {
            if (val.toLowerCase().includes('password'))
                throw new Error('Your password should not contain the world "password" you idiot')
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
},{
    timestamps:true
})

//setup middleware
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next()
})

// remove all related tasks on user removal
userSchema.pre('remove', async function(next){
    await Task.deleteMany({"owner": this._id})    
    next()
})

userSchema.methods.generateToken = async function () {
    const token = jwt.sign({ _id: this._id }, 'supersecret')
    this.tokens = this.tokens.concat({ token })
    await this.save()
    return token
}

userSchema.methods.toJSON = function(){
    const userObject = this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.__v

    return userObject
}

userSchema.virtual('tasks',{
    'ref': 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.statics.findByCredentials = async function (email, password) {
    const targetUser = await User.findOne({ email })

    if (!targetUser)
        throw new Error("Invalid credentials")

    const hashedPass = targetUser.password
    const isMatch = await bcrypt.compare(password, hashedPass)
    if (isMatch)
        return targetUser
    else
        throw new Error('Invalid credentials')
}
const User = mongoose.model('User', userSchema)

module.exports = User