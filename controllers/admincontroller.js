var express = require("express");
var router = express.Router();
var catagories= require('../model/catagory')
var Usercopy = require("../model/schema");
const multer = require("multer");
const Product = require("../model/product");
const adata= require("../model/admin");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp")
const catagory = require("../model/catagory");


let uniqueIdentifier= Date.now();

const Orders = require("../model/orders");
const Banner = require("../model/banner");
const { Console } = require("console");




const getadmin= async function(req,res){
    res.render("admin/login",{error:""});
}

const postadmin= async function(req,res){
    const data=await adata.findOne({email: req.body.email})
    if(req.body.password===data.password) {
      res.cookie("admin",req.body.email, { maxAge: 3600000, httpOnly: true });
    res.redirect('/admin/dashboard')
    }else{
      res.render('admin/login',{error:"email address or password is incorrect"});
    }
}

const getdashboard=  async function(req, res){

  try{


    let pro = await Product.find().limit(3)
    let data = await Orders.find({Status:'delivered'})
    let count = await Orders.countDocuments({Status:'delivered'}) 
    let acount = await Orders.countDocuments({Status:'active'})
    let ccount = await Orders.countDocuments({Status:'Cancelled'})  
    let user = await Usercopy.countDocuments()
    // Filter delivered orders
    let totalyear= 0
data.forEach((data)=>{
  
  totalyear += data.Totalamount
})
   
console.log(totalyear);

// Calculate monthly income
const monthlyIncome = {};
data.forEach(order => {
  const date = new Date(order.Orderdate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Month is zero-based, so add 1
  const key = `${year}-${month}`;
  
  if (!monthlyIncome[key]) {
    monthlyIncome[key] = 0;
  }

  monthlyIncome[key] += order.Totalamount;
});

// Calculate yearly income
const yearlyIncome = {};
data.forEach(order => {
  const year = new Date(order.Orderdate).getFullYear();
  
  if (!yearlyIncome[year]) {
    yearlyIncome[year] = 0;
  }

  yearlyIncome[year] += order.Totalamount;
});

console.log("Monthly Income:", monthlyIncome);
console.log("Yearly Income:", yearlyIncome);

    res.render('admin/dashboard',{monthlyIncome,yearlyIncome,count,totalyear,acount,ccount,user,pro})
  }catch(err){
    Console.log(err)
  }

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

  const input= req.body.catagory;

  const regexPattern = new RegExp(input, 'i');

  const existingCategory = await catagory.findOne({ catagory: { $regex: regexPattern } });

  if(existingCategory){
    res.redirect('/admin/cata')
  }else{

  

  const uploadedImages = req.files;
  const imagePaths = [];
  
  
    for (const image of uploadedImages) {
      // Move the uploaded image to the "uploads" folder
      const imagePath = `/uploads/${image.originalname}`;
      imagePaths.push(imagePath);
      
    }

    
    const newcat= new catagory({
        catagory:req.body.catagory,
        ImagePath:imagePaths,
        Blocked:false
        })
        await newcat.save()
        res.redirect('/admin/cata')
      }
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

const getorder= async function(req, res, next){

  const order= await Orders.find({})
  if(order){

    res.render('admin/orders' ,{order})
  }else{
    res.render('admin/orders',{error:"Order not found"})
  }
}


const getbanner = async function(req, res, next){
  const banners = await Banner.find({})
  const ctgry = await catagory.find({})

  if(banners){
    res.render('admin/banner',{banners,ctgry,error:""})
  }else{
    res.render('admin/banner',{error:"No banner found"})
  }
} 


const addbanner = async function(req, res, next){
  

  const uploadedImages = req.files;
  const imagePaths = [];
  
  
    for (const image of uploadedImages) {
      // Move the uploaded image to the "uploads" folder
      const imagePath = `/uploads/${image.originalname}`;
      imagePaths.push(imagePath);
      
    }
    const newcat= new Banner({
      matter:req.body.matter,
      ImagePath:imagePaths,
      catagory:req.body.catagory
      })
      await newcat.save()
      res.redirect('/admin/banner')


}


const deletebanner = async function(req, res) {
  try {
    const id= req.params.id
    
    await Banner.findByIdAndRemove(id);
    res.redirect("/admin/banner"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}


const changeorder =async (req, res, next) => {
  await Orders.findByIdAndUpdate(req.params.orderid, { $set: {Status: req.params.status} })
  res.redirect('/admin/orders')
}



const vieworder= async (req, res, next) => {
  try {
    const order = await Orders.findById(req.query.oid);
    res.render("admin/vieworder", { order: order });
  } catch (error) {
    res.status(400).json({ message: "Order not found" });
  }
}


const deleteorder= async function (req, res) {
  await Orders.findByIdAndDelete(req.params.orderid)
  res.redirect('/admin/orders')

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
    logout,
    getorder,
    getbanner,
    addbanner,
    deletebanner,
    changeorder,
    vieworder,
    deleteorder
  }