const mongoose=require('mongoose')

const bschema= new mongoose.Schema(
    {
        matter:{
            type:String,
            required:true
        },
        ImagePath:{
            type:Array,
            required:true
        },
        catagory:{
            type:String,
            
        }
})

module.exports=mongoose.model('banner',bschema);