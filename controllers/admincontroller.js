var express = require("express");
var router = express.Router();
var catagories = require('../model/catagory')
var Usercopy = require("../model/schema");
const multer = require("multer");
const Product = require("../model/product");
const adata = require("../model/admin");
const fs = require("fs");
const path = require("path");
const catagory = require("../model/catagory");
const coupons = require('../model/coupon')
const Orders = require("../model/orders");
const Banner = require("../model/banner");
const { Console } = require("console");
const coupon = require("../model/coupon");

const getadmin = async function (req, res) {
    res.render("admn/login", { error: "" });
  }

  const postadmin = async function (req, res) {
    const data = await adata.findOne({ email: req.body.email })
    if (req.body.password === data.password) {
      res.cookie("admin", req.body.email, { maxAge: 3600000, httpOnly: true });
      res.redirect('/getadmin/dash')
    } else {
      res.render('admn/login', { error: "email address or password is incorrect" });
    }
  }


  const getdashboard = async function (req, res) {

    try {
  
  
      let pro = await Product.find().sort({soldcount:-1}).limit(8).populate('Category')
      let data = await Orders.find({ Status: 'delivered' })
      let count = await Orders.countDocuments({ Status: 'delivered' })
      let acount = await Orders.countDocuments({ Status: 'active' })
      let ccount = await Orders.countDocuments({ Status: 'Cancelled' })
      let user = await Usercopy.countDocuments()
      let ordercount = await Orders.countDocuments()
      let cod = await Orders.countDocuments({
        Items: {
          $elemMatch: {
            Payment:'cod' 
            
          }
        }
      })
      let pod = await Orders.countDocuments({
        Items: {
          $elemMatch: {
            Payment:'pod' 
            
          }
        }
      })
      let wallet = await Orders.countDocuments({
        Items: {
          $elemMatch: {
            Payment:'wallet' 
            
          }
        }
      })


      let previousTotal ; // Replace with your actual previous total revenue


      let total =0
        data.forEach((item)=>{
       total += item.Totalamount
      })
      
      let percentage = ((total - previousTotal) / previousTotal) * 100;
      previousTotal=total;

      console.log(`Percentage Increase: ${percentage.toFixed(2)}%`);      console.log(total);
      
      
     
  
      res.render('admn/dash', {  cod, pod, wallet, count, total, acount, ccount, user, pro ,percentage,ordercount})
    } catch (err) {
      console.log(err)
    }
  
  }


const logout = async function (req,res,){
res.clearCookie('admin')
res.redirect('/')

}



  const getproducts = async function (req, res) {
    try{
      const category= await catagory.find({})
    if(category.length > 0){

    
      const product = await Product.find({}).populate('Category')
      
    const catagry = await catagory.find({})
    res.render("admn/products", { product, pid: product._id, catagory: catagry })
    }else{
      res.redirect('/getadmin/cata?error=add category first to add product')
    }
  } catch(err){
    console.log("error");
    console.log(err);
  } 
}


  const addproduct = async function (req, res) {
    
  
    try {

      

      
      const uploadedImages = req.files;
    const imagePaths = [];
      for (const image of uploadedImages) {
        // Move the uploaded image to the "uploads" folder
        const imagePath = `/uploads/${image.originalname}`;
        imagePaths.push(imagePath);
  
      }

      const categoryid = await catagory.findOne({catagory:req.body.category})
  
      // Create a new product entry with the image paths
      const newProduct = new Product({
        Description: req.body.desc,
        Productname: req.body.pname,
        Spec: req.body.specs,
        Category: categoryid,
        Price: req.body.price,
        Discount: req.body.discount,
        Shipingcost: req.body.scost,
        Stoke: req.body.stoke,
        Imagepath: imagePaths,
        Created: Date.now(),
      });
  
      await newProduct.save().then((data) => {
        res.redirect("/getadmin/products");
      });
    } catch (err) {
      // Handle error
      console.error(err);
      // You can send an error response or render an error page as needed
      res.status(500).send("Internal Server Error");
    }
  }



  const delproductimg = async function (req, res) {
    const imagePath = req.params.imgSrc;
    const productid = req.params.pid;
    try {
      await Product.findOneAndUpdate({ _id: productid }, {
        $pull: { Imagepath: imagePath },
      });
      const filePath = path.join(__dirname, "../public", imagePath);
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Error removing image path:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }


  const editproduct = async function (req, res) {
    console.log(req.body);
    const uploadedImages = req.files;
    console.log(uploadedImages);
    const productId = req.params.productid;
    const theproduct = await Product.findOne({ _id: productId });
    const imagePaths = theproduct.Imagepath;
    for (const image of uploadedImages) {
      const imagePath = `/uploads/${image.originalname}`;
      imagePaths.push(imagePath);
    }
    console.log(uploadedImages);
  
    const editedData = {
      Description: req.body.desc,
      Productname: req.body.pname,
      Spec: req.body.specs,
      Price: req.body.price,
      Discount: req.body.discount,
      Shipingcost: req.body.scost,
      Stoke: req.body.stoke,
      Imagepath: imagePaths,
    };
  
    try {
      await Product.findOneAndUpdate({ _id: productId }, {
        $set: editedData,
      });
      res.redirect("/getadmin/products");
    } catch (err) {
      console.log("Error on updating the data : " + err);
    }
  
  }


  const deleteproduct = async function (req, res) {
    const productId = req.params.pid;
  
    try {
      // Find the product by its ID
      const product = await Product.findOne({ _id: productId });
  
      // Retrieve the image paths associated with the product
      const imagePaths = product.Imagepath;
  
      // Delete the product from the database
      await Product.findOneAndRemove({ _id: productId });
  
      // Delete the associated image files from the "uploads" folder
      imagePaths.forEach((imagePath) => {
        const filePath = path.join(__dirname, "../public", imagePath);
  
        // Use fs.unlinkSync to remove the file
        fs.unlinkSync(filePath);
      });
  
      res.redirect("/getadmin/products"); // Redirect to the product listing page
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }


  const getcatagory = async function (req, res) {
    let error
    if(req.query.error){
       error= req.query.error
    
    const category = await catagory.find({});
    res.render('admn/category', { category,error })
  }else{
    const category = await catagory.find({});
    res.render('admn/category', { category,error:"" })

  }
}


  const blockcatagory = async function (req, res) {
    await catagory.updateOne({ catagory: req.params.catagory }, { $set: { Blocked: true } })
    res.redirect('/getadmin/cata')
  }

  const unblockcatagory = async function (req, res) {
    await catagory.updateOne({ catagory: req.params.catagory }, { $set: { Blocked: false } })
    res.redirect('/getadmin/cata')
  }


  const deletecatagory = async function (req, res) {
    const userId = req.params.catagory;
    try {
  
      await catagory.findOneAndRemove({ catagory: userId });
      res.redirect("/getadmin/cata");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  
  }

  const addcatagory = async function (req, res) {

    const input = req.body.catagory;
  
    const regexPattern = new RegExp(input, 'i');
  
    const existingCategory = await catagory.findOne({ catagory: { $regex: regexPattern } });
  
    if (existingCategory) {
      res.redirect('/getadmin/cata?error="This catagory already exists"')
    } else {
  
  
  
      const uploadedImages = req.files;
      const imagePaths = [];
  
  
      for (const image of uploadedImages) {
        // Move the uploaded image to the "uploads" folder
        const imagePath = `/uploads/${image.originalname}`;
        imagePaths.push(imagePath);
  
      }
  
  
      const newcat = new catagory({
        catagory: req.body.catagory,
        ImagePath: imagePaths,
        Blocked: false
      })
      await newcat.save()
      res.redirect('/getadmin/cata')
    }
  }


  const getorder = async function (req, res, next) {

    const order = await Orders.find({})
    if (order) {
  
      res.render('admn/orders', { order })
    } else {
      res.render('admn/orders', { order: "" })
    }
  }

  const changeorder = async (req, res, next) => {
    await Orders.findByIdAndUpdate(req.params.orderid, { $set: { Status: req.params.status } })
    res.redirect('/getadmin/orders')
  }
  
  
  
  const vieworder = async (req, res, next) => {
    try {
      const order = await Orders.findById(req.query.oid);
      res.render("admn/vieworder", {  order });
    } catch (error) {
      res.status(400).json({ message: "Order not found" });
    }
  }
  
  
  const deleteorder = async function (req, res) {
    await Orders.findByIdAndRemove(req.params.orderid)
    res.redirect('/getadmin/orders')
  
  }


  const getuser = async function (req, res) {
    const user = await Usercopy.find({});
    res.render('admn/users', { user })
  }
  
  
  
  const blockuser = async function (req, res) {
    await Usercopy.updateOne({ _id: req.params.email }, { $set: { Blocked: true } })
    res.redirect('/getadmin/users')
  }
  
  const unblockuser = async function (req, res) {
    await Usercopy.updateOne({ _id: req.params.email }, { $set: { Blocked: false } })
    res.redirect('/getadmin/users')
  }





  const getbanner = async function (req, res, next) {
    const banners = await Banner.find({})
    const ctgry = await catagory.find({})
  
    if (banners) {
      res.render('admn/banners', { banners, ctgry, error: "" })
    } else {
      res.render('admn/banners', { error: "No banner found" })
    }
  }
  
  
  const addbanner = async function (req, res, next) {
  
  
    const uploadedImages = req.files;
    const imagePaths = [];
  
  
    for (const image of uploadedImages) {
      // Move the uploaded image to the "uploads" folder
      const imagePath = `/uploads/${image.originalname}`;
      imagePaths.push(imagePath);
  
    }
    const newcat = new Banner({
      matter: req.body.matter,
      ImagePath: imagePaths,
      catagory: req.body.catagory
    })
    await newcat.save()
    res.redirect('/getadmin/banner')
  
  
  }


  const getcoupon= async (req, res) => {
    try{

      let error=""
      const coupon= await coupons.find({})
      if(req.query.error){
        
        error=req.query.error
        
      }
      console.log(error);
      res.render('admn/coupon',{coupon ,error})
    }catch(err){
      console.log(err);
    }

   
  }


  const addcoupon = async (req, res) => {
try{


    const {code,adate,edate,amount,discount,limit}=req.body
    const exist = await coupon.find({couponcode:code})
    if(exist){
      res.redirect('/getadmin/coupon?error=coupon already exist')
    }else{
      const newcat = new coupon({
      couponcode:code,
      activationdate:adate,
      expirydate:edate,
      criteriaamount:amount,
      discountamount:discount,
      userslimit:limit

    })
    await newcat.save()
    
    res.redirect('/getadmin/coupon')
    }
    
  } catch (err){
    console.log(err);
  }
  }



  const deletecoupon = async function(req,res){
    try{

      const id= req.params.id

      if(id){
        await coupon.findOneAndRemove({_id:id})
      }
      res.redirect('/getadmin/coupon')

    } catch(err){
      console.log(err);
    }
  }


  const editcoupon = async function(req,res){
    try{

      const id = req.params.id

      const {code,adate,edate,camount,damount,limit}= req.body

      const data={
        couponcode:code,
        activationdate:adate,
        expirydate:edate,
        discountamount:damount,
        criteriaamount:camount,
        userslimit:limit
      }
await coupon.updateOne({_id:id},{$set:data})
res.redirect('/getadmin/coupon')

    } catch(err){
      console.log(err);

    }
  }

  module.exports={
    getadmin,
    postadmin,
    getdashboard,
    getproducts,
    addproduct,
    delproductimg,
    editproduct,
    deleteproduct,
    getcatagory,
    blockcatagory,
    unblockcatagory,
    deletecatagory,
    addcatagory,
    getorder,
    vieworder,
    deleteorder,
    changeorder,
    getuser,
    blockuser,
    unblockuser,
    getbanner,
    addbanner,
    logout,
    getcoupon,
    addcoupon,
    deletecoupon,
    editcoupon 
  }