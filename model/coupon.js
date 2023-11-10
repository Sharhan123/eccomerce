const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponcode: {
    type: String,
    required: true,
  },

  discountamount: {
    type: Number,
  },

  activationdate: {
    type: Date,
    required: true,
  },
  expirydate: {
    type: Date,
    required: true,
  },
  criteriaamount: {
    type: Number,
    required: true,
  },
  usedusers: {
    type: Array,
    ref: "user",
    default: [],
  },
  userslimit: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("coupon", couponSchema);