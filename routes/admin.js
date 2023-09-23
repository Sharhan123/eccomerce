var express = require("express");
var router = express.Router();
var catagories= require('../model/catagory')
var Usercopy = require("../model/schema");
const multer = require("multer");
const Product = require("../model/productmodel");
const adata= require("../model/admin");
const fs = require("fs");
const path = require("path");
const catagory = require("../model/catagory");



let uniqueIdentifier = Date.now(); // Declare the variable in the outer scope

const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    const filename = `${uniqueIdentifier}_${file.originalname}`;
    cb(null, filename); // Use the unique file name
  },
});

const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  const userData = await Usercopy.find({});
  res.render("admin/login",{error:""});
});

router.post('/adminlogin',async function(req, res){
 
  
const data=await adata.findOne({email: req.body.email})
  if(req.body.password===data.password) {
    res.cookie("admin",req.body.email, { maxAge: 3600000, httpOnly: true });
  res.render('admin/dashboard')
  }else{
    res.render('admin/login',{error:"email address or password is incorrect"});
  }
})

router.get('/dashboard', async function(req, res)  {
if(req.cookies.admin){
  res.render('admin/dashboard')
}else{
  res.render('admin/login')
}
})


router.get('/logout', function(req, res) {
  res.clearCookie("admin");
  res.redirect("/admin/login");
});
router.get("/products", async (req, res) => {
  uniqueIdentifier = Date.now();
  const product = await Product.find({});
  const catagry= await catagory.find({})
  res.render("admin/products", { product, pid: product._id ,catagory: catagry});
});

router.post("/addproduct", upload.array("images", 8), async (req, res) => {
  const uploadedImages = req.files;
  const imagePaths = [];

  try {
    for (const image of uploadedImages) {
      // Move the uploaded image to the "uploads" folder
      const imagePath = `/uploads/${uniqueIdentifier}_${image.originalname}`;
      imagePaths.push(imagePath);
    }

    // Create a new product entry with the image paths
    const newProduct = new Product({
      Description: req.body.desc, 
      Productname: req.body.pname,
      Spec: req.body.specs,
      Category: req.body.category,
      Price: req.body.price,
      Discount: req.body.discount,
      Shipingcost: req.body.scost,
      Stoke: req.body.stoke,
      Imagepath: imagePaths,
      Dateadded: Date.now(),
    });

    await newProduct.save().then((data) => {
      res.redirect("/admin/products");
    });
  } catch (err) {
    // Handle error
    console.error(err);
    // You can send an error response or render an error page as needed
    res.status(500).send("Internal Server Error");
  }
});
router.get("/deleteproduct/:pid", async (req, res) => {
  const productId = req.params.pid;

  try {
    // Find the product by its ID
    const product = await Product.findById(productId);

    // Retrieve the image paths associated with the product
    const imagePaths = product.Imagepath;

    // Delete the product from the database
    await Product.findByIdAndRemove(productId);

    // Delete the associated image files from the "uploads" folder
    imagePaths.forEach((imagePath) => {
      const filePath = path.join(__dirname, "../public", imagePath);

      // Use fs.unlinkSync to remove the file
      fs.unlinkSync(filePath);
    });

    res.redirect("/admin/products"); // Redirect to the product listing page
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/deleteuser/:uid", async (req, res) => {
  const userId = req.params.uid;
  try {
    const user = await Usercopy.findById(userId);
    await Usercopy.findByIdAndRemove(userId);
    res.redirect("/admin/users"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/users', async (req, res) => {
  const users = await Usercopy.find({});
  res.render('admin/users', {users})
})

router.get('/blockuser/:email', async(req, res) => {
  await Usercopy.updateOne({ email: req.params.email }, {$set:{ Blocked: true }})
  res.redirect('/admin/users')
})

router.get('/unblockuser/:email', async(req, res) => {
  await Usercopy.updateOne({ email: req.params.email }, {$set:{ Blocked: false }})
  res.redirect('/admin/users')
})


router.get('/cata',async function(req,res){
  const users = await catagory.find({});
  res.render('admin/catagories',{users})
})

router.post('/addcatagory',async function(req,res){
const newcat= new catagory({
catagory:req.body.catagory,
Blocked:false
})
await newcat.save()
res.redirect('/admin/cata')
})

router.get('/block/:catagory', async(req, res) => {
  await catagory.updateOne({ catagory: req.params.catagory }, {$set:{ Blocked: true }})
  res.redirect('/admin/cata')
})

router.get('/unblock/:catagory', async(req, res) => {
  await catagory.updateOne({ catagory: req.params.catagory }, {$set:{ Blocked: false }})
  res.redirect('/admin/cata')
})

router.get("/delete/:catagory", async (req, res) => {
  const userId = req.params.catagory;
  try {
    
    await catagory.findOneAndRemove({catagory:userId});
    res.redirect("/admin/cata"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
 