const express = require('express');
const router = express.Router();
const usercontroller=require('../controllers/usercontroller')
const auth= require('../middlewares/userauth')
require('dotenv').config()

router.get('/',usercontroller.gethome)


router.get('/register',usercontroller.getsignup)
router.post('/sign',usercontroller.postsignup)


router.get('/verify',usercontroller.getverify)
router.post('/verify',usercontroller.postverify)
router.post('/resendVerification/:email',usercontroller.postresendverification)


router.get('/sin',usercontroller.getlogin)
router.post('/login',usercontroller.postlogin)
router.get('/logout',usercontroller.getlogout)


router.get('/dash',auth.islogin,usercontroller.getprofile)
router.post('/primaryaddress',usercontroller.postprimaryaddress)
router.post('/secondaryaddress',usercontroller.postsecondaryaddress)


router.post('/editprofile',usercontroller.editprofile)


module.exports = router;