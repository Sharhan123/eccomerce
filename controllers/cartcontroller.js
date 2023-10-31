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
const helper = require('../helpers/paymenthelper')
const Razorpay = require('razorpay');
const crypto = require('crypto');


const getCart = async function (req, res) {
  if (req.cookies.user) {
    let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    const err = req.query.error
    res.render('user/cart', { cart: cart ? cart.Products : null, error: err })
  } else {
    res.redirect('/sin?error=you have to login to use cart');
  }
}

const updatecart = async function (req, res) {
  let productId = req.params.id;
  console.log(productId);
  const newQuantity = req.body.quantity;
  try {
    const cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }
    const product = cart.Products.find((p) => p._id == productId)
    console.log(product);
    product.Quantity = newQuantity
    console.log("Product saved");
    await cart.save();
    res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    console.log("Product NOT saved : " + error.message);
    res.status(500).json({ error: "Error updating quantity" });
  }
}

const removecart = async function (req, res) {
  try {
    const productId = req.params.pid;
    let cart = await cartModel.findOne({ Userid: req.cookies.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }


    const productIndex = cart.Products.findIndex(
      (item) => item.Productid.toString() === productId
    );

    cart.Products.splice(productIndex, 1);
    await cart.save();
    res.redirect('/viewcart')
  } catch (error) {
    console.log("Error deleting product from cart:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}


const addtocarthome = async function (req, res) {
  console.log("hello");
  if (req.cookies.user) {
    try {
      const product = await products.findById(req.params.pid);
      let cart = await cartModel.findOne({ Userid: req.cookies.user.id });

      if (cart) {
        const existingProduct = cart.Products.find(
          (item) => item.Productid.toString() === product._id.toString()
        );

        if (existingProduct) {
          existingProduct.Quantity += 1;
        } else {
          cart.Products.push({
            Productid: product._id,
            Productname: product.Productname,
            Productimg: product.Imagepath[0],
            Price: product.Price - product.Discount,
            Quantity: 1,
          });
          await cart.save();
        }

        await cartModel.updateOne(
          { Userid: req.cookies.user.id, "Products.Productid": product._id },
          { $set: { "Products.$": existingProduct } }
        );
      } else {
        const newcart = new cartModel({
          Userid: req.cookies.user.id,
          Products: [
            {
              Productid: product._id,
              Productname: product.Productname,
              Productimg: product.Imagepath[0],
              Price: product.Price - product.Discount,
              Quantity: 1,
            },
          ],
        });

        await newcart.save();
      }

      res.redirect("/");

    } catch (error) {
      console.log("Cart saving error: ", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  } else {
    res.redirect('/sin?error=you have to login to use cart');
  }
}

const cartcheckout = async function (req, res) {
  const user = await userdatacopy.findById(req.cookies.user.id);
  const address = await useraddresscopy.findOne({ Userid: user._id });
  const cart = await cartModel.findOne({ Userid: user._id });
  console.log(cart);
  if (cart.Products[0]) {

    if(address){

      res.render("user/checkout", {
        product: null,
        user: user,
        address: address,
        cart: cart.Products,
  
      })
    }else{
      res.redirect('/dash?address="you have no address"')
    }


  } else {
    res.redirect('/viewcart?error:you have no products')

  }
}

module.exports = {
  getCart,
  updatecart,
  removecart,
  addtocarthome,
  cartcheckout
}                   