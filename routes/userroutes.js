const express = require('express');
const router = express.Router();
const usercontroller=require('../controllers/usercontroller')
const productcontroller= require('../controllers/productcontroller')
const cartcontroller = require('../controllers/cartcontroller')
const auth= require('../middlewares/userauth')
const clear = require('../middlewares/header')
const ordercontroller = require('../controllers/ordercontroller')
const wishlistcontroller = require('../controllers/whislistcontroller')
const couponcontroller= require('../controllers/couponcontroller')
require('dotenv').config()


// Home page //
router.get('/',usercontroller.gethome)

// register routes
router.get('/register',auth.islogout,usercontroller.getsignup)
router.post('/sign',auth.islogout,usercontroller.postsignup)

// otp verification routes
router.get('/verify',usercontroller.getverify)
router.post('/verify',usercontroller.postverify)
router.post('/resendVerification/:email',usercontroller.postresendverification)

// login and logout routes 
router.get('/sin',auth.islogout,usercontroller.getlogin)
router.post('/login',auth.islogout,usercontroller.postlogin) 
router.get('/logout',usercontroller.getlogout)

// profile routes
router.get('/dash',usercontroller.getprofile)
router.post('/primaryaddress',auth.islogin,usercontroller.postprimaryaddress)
router.post('/secondaryaddress',auth.islogin,usercontroller.postsecondaryaddress)
router.post('/editprofile',auth.islogin,usercontroller.editprofile)


// products and shop routes
router.get('/productdetials/:pid',productcontroller.getproductdetials)
router.get('/shop',clear.clearheader,usercontroller.getshop)


// cart adding and crud operation routes
router.get('/addtocarthome/:pid',cartcontroller.addtocarthome)
router.get('/viewcart',auth.islogin,cartcontroller.getCart)
router.put('/updateQuantity/:id',auth.islogin,cartcontroller.updatecart)
router.get('/removefromcartcart/:pid',auth.islogin,cartcontroller.removecart)
router.get('/cartcheckout' ,auth.islogin,cartcontroller.cartcheckout)






router.get('/checkout',auth.islogin,usercontroller.checkout)
router.get("/checkoutitem/:pid", (req, res) => {
    res.redirect(`/checkout?pid=${req.params.pid}`);
  });



  // order managment routes
  router.get('/getorder',auth.islogin,ordercontroller.getorder)
  router.get('/getcancel',auth.islogin,ordercontroller.getcancel)
  router.post('/saveorder',auth.islogin,ordercontroller.saveorder)
  router.get('/placeorder',auth.islogin,ordercontroller.placeorder)
  router.get('/vieworder',auth.islogin,ordercontroller.vieworder)
  
  router.get('/removeorder',auth.islogin,ordercontroller.cancelorder)
  router.post('/removepod',auth.islogin,ordercontroller.cancelpod)
  router.get('/viewwallet',auth.islogin,ordercontroller.viewwallet)
  router.post('/return',auth.islogin,ordercontroller.returnorder)

  router.post('/verify-payment',ordercontroller.verifyPayment)


  router.get('/addwish',auth.islogin,wishlistcontroller.addtowish)
  router.get('/wishlist',auth.islogin,wishlistcontroller.getwish)
  router.get('/removefromwish/:id',auth.islogin,wishlistcontroller.remove)
  router.get('/updatewish',auth.islogin,wishlistcontroller.update)
  router.post('/applycoupon',auth.islogin,couponcontroller.applycoupon)
  router.post('/deleteAppliedCoupon',auth.islogin,couponcontroller.deletecoupon)
  router.get('/getcoupon',auth.islogin,couponcontroller.getcoupon)
module.exports = router; 