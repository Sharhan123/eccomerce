const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;

const ProductsSchema = new Schema({
  Description: { type: String, required: true },
  Productname: { type: String, required: true },
  Spec: { type: String, required: true },
  Dateadded: { type: Date, required: true },
  Category: { type: String, required: true },
  Price: { type: Number, required: true },
  Discount: { type: Number },
  Shipingcost: { type: Number },
  Stoke: { type: String, required: true },
  Imagepath: [{ type: String, required: true }],
});

const Products = mongoose.model("Products", ProductsSchema);

module.exports = Products;

