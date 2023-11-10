const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;

const wishschema = new Schema({
  Products:{type:Array ,required:true},
  Userid: { type: Schema.Types.ObjectId, required: true, unique: true },
});

const Carts = mongoose.model("wishlist", wishschema);

module.exports = Carts;