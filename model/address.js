const mongoose=require('mongoose')

const {Schema, ObjectId }= mongoose
const aschema = new Schema({
    Userid: { type: ObjectId, required: true },
    PrimaryAddress: {
      Name :{ type: String, required: true},
       City: { type: String, required: true },
       Country: { type: String, required: true },
       Landmark: { type: String, required: true },
       Pincode: { type: String, required: true },
       States: { type: String, required: true },
       Phone: { type: String, required: true}
    },
    SecondaryAddress: {
      Name :{ type: String},
       City: { type: String },
       Country: { type: String },
       Landmark: { type: String },
       Pincode: { type: String },
       States: { type: String },
       Phone: { type: String},
    },
  });


module.exports=mongoose.model('useraddress',aschema);


  