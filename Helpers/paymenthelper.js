
const Razorpay = require('razorpay')
var instance = new Razorpay({
  key_id: process.env.RAZORKEY,
  key_secret: process.env.RAZORSECRET,
});


module.exports = {
    generateRazorpay: async (oid, amount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: (amount*100),  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+oid
              };
              instance.orders.create(options, function(err, order) {
                console.log("New Order : "+order);
                resolve(order);
              });
        })
    },
}