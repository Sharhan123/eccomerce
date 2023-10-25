
const Razorpay = require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_f0CUyOMdkz5Ems',
  key_secret: 'jVlliMIYj9LGEaoxylbCt0j1',
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