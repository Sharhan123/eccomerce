var express = require("express");
var router = express.Router();
const auth= require('../middlewares/adminauth')
const multer= require('../middlewares/multer');
const admincontroller = require("../controllers/admincontroller")

router.get('/', admincontroller.getadmin)
router.post('/adminlogin',admincontroller.postadmin)
router.get('/logout',admincontroller.logout)

router.get('/dash',auth.islogin,admincontroller.getdashboard)


router.get('/products',auth.islogin,admincontroller.getproducts)
router.post('/addproduct',multer.upload.array("images", 8),admincontroller.addproduct)
router.post('/edit/:productid',multer.upload.array("images", 8),admincontroller.editproduct) 
router.get('/delproductimg/:imgSrc/:pid',auth.islogin,admincontroller.delproductimg)
router.get('/deleteproduct/:pid',auth.islogin,admincontroller.deleteproduct)

router.get('/cata',auth.islogin,admincontroller.getcatagory)
router.get('/block/:catagory',auth.islogin,admincontroller.blockcatagory)
router.get('/unblock/:catagory',auth.islogin,admincontroller.unblockcatagory)
router.get('/delete/:catagory',auth.islogin,admincontroller.deletecatagory)
router.post('/addcatagory',multer.upload.array("images", 8),admincontroller.addcatagory)




router.get('/orders',auth.islogin,admincontroller.getorder)
router.get('/changeorderstatus/:orderid/:status',auth.islogin,admincontroller.changeorder)
router.get('/vieworder',auth.islogin, admincontroller.vieworder)
router.get('/deleteorder/:orderid',auth.islogin,admincontroller.deleteorder)



router.get('/users',auth.islogin,admincontroller.getuser)
router.get('/blockuser/:email',auth.islogin,admincontroller.blockuser)
router.get('/unblockuser/:email',auth.islogin,admincontroller.unblockuser)


router.get('/banner',auth.islogin,admincontroller.getbanner)
router.post('/addbanner',multer.upload.array("images", 1),admincontroller.addbanner)
module.exports=router;