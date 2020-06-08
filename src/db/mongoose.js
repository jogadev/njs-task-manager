const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).catch(error => {
    console.log("Unable to connect", error);
    
})
