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
        },
        Wallet:{
            type:Number,
            default:0,
        },
        WalletHistory:[
            {
                Date:{
                    type:Date,

                },
                Amount:{
                    type:Number,
                },
                Description:{
                    type:String,
                },
                Status:{
                    type:String,
                    enum: [ 'Debited', 'Credited'  ] 
                }
            }
        ]
            
    
})

module.exports=mongoose.model('user',uschema);

