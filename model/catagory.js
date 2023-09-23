const mongoose=require('mongoose')

const cschema= new mongoose.Schema(
    {
        catagory:{
            type:String,
            required:true
        },
        Blocked:{
            type:Boolean,
            required:true
        }
})

module.exports=mongoose.model('catagory',cschema);