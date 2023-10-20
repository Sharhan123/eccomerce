
const Razorpay = require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_0adB9GE35CFKPI',
  key_secret: 'BEp7pBeltrCNbnx7DzPaLIoN',
});
instance.payments.all({
  from: '2023-08-01',
  to: '2023-08-20'
}).then((response) => {
  // handle success
}).catch((error) => {
  // handle error
})

module.exports = {
    generateRazorpay: async (oid, amount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: amount*100,  // amount in the smallest currency unit
                currency: "USD",
                receipt: oid
              };
              instance.orders.create(options, function(err, order) {
                console.log("New Order : "+order);
                resolve(order);
              });
        })
    },
}