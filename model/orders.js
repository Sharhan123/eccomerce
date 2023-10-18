const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const OrdersSchema = new Schema({
  Userid: { type: Schema.Types.ObjectId },
  Username: { type: String },
  Shippingcost: { type: Number },
  Items: [{
     Paymet: { type: String, required: true, enum: [ 'cod', 'pod' ] },
     Productid: { type: Schema.Types.ObjectId, required: true },
     Productimg:{ type: String, required: true},
     Productname: { type: String, required: true},
     Price: { type: Number, required: true},
     Quantity: { type: Number, required: true},
  }],
  Deliveryaddress: {
    cname: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    streetaddress: { type: String },
    landmark: { type: String },
    pincode: { type: String },
  },
  Status: { type: String, required: true, default: 'active' },
  Totalamount: { type: Number, required: true },
  Orderdate: { type: Date, required: true },
});

const Orders = mongoose.model('Orders', OrdersSchema);

module.exports = Orders;