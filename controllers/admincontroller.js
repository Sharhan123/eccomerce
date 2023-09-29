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
const sharp= require("sharp")
let uniqueIdentifier= Date.now();
const getadmin= async function(req,res){
    res.render("admin/login",{error:""});
}

const postadmin= async function(req,res){
    const data=await adata.findOne({email: req.body.email})
    if(req.body.password===data.password) {
      res.cookie("admin",req.body.email, { maxAge: 3600000, httpOnly: true });
    res.render('admin/dashboard')
    }else{
      res.render('admin/login',{error:"email address or password is incorrect"});
    }
}

const getdashboard=function(req, res){
    res.render('admin/dashboard')
}

const getproducts= async function(req, res){
    const product = await Product.find({});
    const catagry= await catagory.find({})
    res.render("admin/products", { product, pid: product._id ,catagory: catagry})
}


const addproduct= async function(req, res){
    const uploadedImages = req.files;
    const imagePaths = [];
    
    try {
      for (const image of uploadedImages) {
        // Move the uploaded image to the "uploads" folder
        const imagePath = `/uploads/${image.originalname}`;
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
}


const deleteproduct= async function(req, res) {
    const productId = req.params.pid;

    try {
      // Find the product by its ID
      const product = await Product.findOne({_id:productId});
  
      // Retrieve the image paths associated with the product
      const imagePaths = product.Imagepath;
  
      // Delete the product from the database
      await Product.findOneAndRemove({_id:productId});
  
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
}

const getuser= async function(req, res) {
    const users = await Usercopy.find({});
    res.render('admin/users', {users})
}

const deleteuser= async function(req, res) {
    const userId = req.params.uid;
    try {
      
      await Usercopy.findByIdAndRemove(userId);
      res.redirect("/admin/users"); 
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
}

const blockuser= async function(req, res) {
    await Usercopy.updateOne({ email: req.params.email }, {$set:{ Blocked: true }})
  res.redirect('/admin/users')
}

const unblockuser= async function(req, res) {
    await Usercopy.updateOne({ email: req.params.email }, {$set:{ Blocked: false }})
    res.redirect('/admin/users')
}

const getcatagory= async function(req, res){
    const users = await catagory.find({});
  res.render('admin/catagories',{users})
}

const addcatagory= async function(req, res){
    const newcat= new catagory({
        catagory:req.body.catagory,
        Blocked:false
        })
        await newcat.save()
        res.redirect('/admin/cata')
}

const blockcatagory= async function(req, res){
    await catagory.updateOne({ catagory: req.params.catagory }, {$set:{ Blocked: true }})
    res.redirect('/admin/cata')
}

const unblockcatagory=async function(req,res){
    await catagory.updateOne({ catagory: req.params.catagory }, {$set:{ Blocked: false }})
  res.redirect('/admin/cata')
}

const deletecatagory= async function(req, res) {
    const userId = req.params.catagory;
  try {
    
    await catagory.findOneAndRemove({catagory:userId});
    res.redirect("/admin/cata"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }

}

const delproductimg= async function(req, res) {
  const imagePath = req.params.imgSrc;
  const productid = req.params.pid;
  try {
    await Product.findOneAndUpdate({_id:productid}, {
      $pull: { Imagepath: imagePath },
    });
    const filePath = path.join(__dirname, "../public", imagePath);
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error removing image path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}







const editproduct= async function(req, res) { 
  console.log(req.body);
  const uploadedImages = req.files;
  console.log(uploadedImages);
    const productId = req.params.productid;
    const theproduct = await Product.findOne({_id:productId});
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
      Category: req.body.category,
      Price: req.body.price, 
      Discount: req.body.discount,
      Shipingcost: req.body.scost,
      Stoke: req.body.stoke,
      Imagepath: imagePaths,
    };

    try {
      await Product.findOneAndUpdate({_id:productId}, {
        $set: editedData,
      });
      res.redirect("/admin/products");
    } catch (err) {
      console.log("Error on updating the data : " + err); 
    }
  
}


const logout= async function(req, res){
    res.clearCookie("admin");
  res.redirect("/admin/login");
}

module.exports = {
    getadmin,
    postadmin,
    getdashboard,
    getproducts,
    addproduct,
    deleteproduct,
    getuser,
    deleteuser,
    blockuser,
    unblockuser,
    getcatagory,
    addcatagory,
    blockcatagory,
    unblockcatagory,
    deletecatagory,
    editproduct,
    delproductimg,
    logout
}