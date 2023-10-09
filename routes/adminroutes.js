var express = require("express");
var router = express.Router();
const auth= require('../middlewares/adminauth')
const multer= require('../middlewares/multer');
const admincontroller = require("../controllers/admincontroller")

router.get('/', admincontroller.getadmin)
router.post('/adminlogin',admincontroller.postadmin)
router.get('/dashboard',auth.islogin,admincontroller.getdashboard)


router.get('/products',auth.islogin,admincontroller.getproducts)
router.post('/addproduct',multer.upload.array("images", 8),admincontroller.addproduct)
router.get('/deleteproduct/:pid',admincontroller.deleteproduct)
router.post('/edit/:productid',admincontroller.editproduct) 
router.get('/delproductimg/:imgSrc/:pid',admincontroller.delproductimg)

router.get('/users',auth.islogin,admincontroller.getuser)
router.get('/deleteuser/:uid',admincontroller.deleteuser)
router.get('/blockuser/:email',admincontroller.blockuser)
router.get('/unblockuser/:email',admincontroller.unblockuser)
 
 
router.get('/cata',auth.islogin,admincontroller.getcatagory)
router.post('/addcatagory',multer.upload.array("images", 8),admincontroller.addcatagory)
router.get('/delete/:catagory',admincontroller.deletecatagory)
router.get('/block/:catagory',admincontroller.blockcatagory)
router.get('/unblock/:catagory',admincontroller.unblockcatagory)


router.get('/orders',admincontroller.getorder)
router.get('/changeorderstatus/:orderid/:status',admincontroller.changeorder)
router.get('/vieworder', admincontroller.vieworder)
router.get('/deleteorder/:orderid',admincontroller.deleteorder)
    


router.get('/banner',admincontroller.getbanner)
router.post('/addbanner',multer.upload.array("images", 8),admincontroller.addbanner)
router.get('/deletebanner/:id',admincontroller.deletebanner)



module.exports = router;