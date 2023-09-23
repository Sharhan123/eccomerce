const mongoose=require('mongoose')

const uschema= new mongoose.Schema(
    {
        username: {
            type: 'string',
            required:true,
        },
        email:{
            type:String,
            required:true,
        },
        password:{
            type:String,
            required:true,
        },
        gender:{
            type:String,
        },
        dob:{
            type:Date
        },
        verify:{
            type:Number,
            required:true,
        },
        Blocked:{
            type:Boolean,
            required:true,
        }
            
    
})

module.exports=mongoose.model('user',uschema);