const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;

const ProductsSchema = new Schema({
  Description: { type: String, required: true },
  Productname: { type: String, required: true },
  Spec: { type: String, required: true },
  Created: { type: Date, required: true },
  Category: { type: Schema.Types.ObjectId, ref: 'catagory',required: true },
  Price: { type: Number, required: true },
  Discount: { type: Number },
  Shipingcost: { type: Number },
  Stoke: { type: Number, required: true },
  Imagepath: [{ type: String, required: true }],
  soldcount:{type:Number,default:0}
});

const Products = mongoose.model("Products", ProductsSchema);

module.exports = Products;

