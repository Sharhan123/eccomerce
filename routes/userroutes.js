const express = require('express');
const router = express.Router();
const usercontroller=require('../controllers/usercontroller')
const auth= require('../middlewares/userauth')
const clear = require('../middlewares/header')
require('dotenv').config()

router.get('/',clear.clearheader,usercontroller.gethome)


router.get('/register',clear.clearheader,usercontroller.getsignup)
router.post('/sign',usercontroller.postsignup)


router.get('/verify',usercontroller.getverify)
router.post('/verify',usercontroller.postverify)
router.post('/resendVerification/:email',usercontroller.postresendverification)


router.get('/sin',usercontroller.getlogin)
router.post('/login',usercontroller.postlogin) 
router.get('/logout',usercontroller.getlogout)


router.get('/dash',usercontroller.getprofile)
router.post('/primaryaddress',usercontroller.postprimaryaddress)
router.post('/secondaryaddress',usercontroller.postsecondaryaddress)


router.post('/editprofile',usercontroller.editprofile)


router.get('/productdetials/:pid',usercontroller.getproductdetials)


router.get('/addtocarthome/:pid',usercontroller.addtocarthome)
router.get('/viewcart',usercontroller.getCart)
router.put('/updateQuantity/:id',usercontroller.updatecart)
router.get('/removefromcartcart/:pid',usercontroller.removecart)
router.get('/removeorderitem/:id/:oid', usercontroller.removeorder);
router.get('/removeorder/:id',usercontroller.cancelorder)

router.get('/checkout',usercontroller.checkout)
router.get("/checkoutitem/:pid", (req, res) => {
    res.redirect(`/checkout?pid=${req.params.pid}`);
  });

  router.get('/cartcheckout' ,auth.islogin,usercontroller.cartcheckout)
  router.post('/saveorder',usercontroller.saveorder)
  router.get('/placeorder',auth.islogin,usercontroller.placeorder)
  router.get('/vieworder',auth.islogin,usercontroller.vieworder)

  router.get('/shop',clear.clearheader,usercontroller.getshop)
  


  router.post('/verify-payment',usercontroller.verifyPayment)
module.exports = router; 