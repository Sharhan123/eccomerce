const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;
const admin = new Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
  });

  const adata = mongoose.model("admins", admin);

module.exports = adata;