const express = require('express');
const router = express.Router();
const userdatacopy = require('../model/schema')
const bycrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const useraddresscopy = require('../model/address')
const products = require('../model/product');
const cartModel = require('../model/cart');
const Orders = require('../model/orders');
const catagory = require('../model/catagory')

const getproductdetials = async function (req, res) {
  const id = req.params.pid;
  const otherproducts = await products.find({})
  const product = await products.findOne({ _id: id })


  if (req.cookies.user) {

    const cart = await cartModel.findOne({ Userid: req.cookies.user.id });

    res.render('user/product', { product, cookie: req.cookies.user, otherproducts, cart })
  } else {
    res.render('user/product', { product, cookie: req.cookies.user, otherproducts, cart: "" })
  }
}

const addproduct = async function (req, res) {
  const uploadedImages = req.files;
  const imagePaths = [];

  try {
    for (const image of uploadedImages) {
      // Move the uploaded image to the "uploads" folder
      const imagePath = `/uploads/${image.originalname}`;
      imagePaths.push(imagePath);

    }


    // Create a new product entry with the image paths
    const newProduct = new products({
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


module.exports = {
  getproductdetials
}