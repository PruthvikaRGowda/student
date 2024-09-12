const mongoose=require("mongoose")

mongoose.set('strictQuery', false);

const DB_URL = 'mongodb://127.0.0.1:27017/E-learning'; 
mongoose.connect(DB_URL)
.then(()=>{
    console.log('mongoose connected');
})
.catch((e)=>{
    console.log('failed');
})

const logInSchema=new mongoose.Schema({
    email:{
        type:String,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    empid:{
        
        type:Number,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }

    
})

const LogInCollection=new mongoose.model('LogInCollection',logInSchema)

module.exports=LogInCollection