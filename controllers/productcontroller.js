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
const wishmodel = require('../model/whishlist')



const getproductdetials = async function (req, res) {
  const id = req.params.pid;
  const otherproducts = await products.find({})
  const product = await products.findOne({ _id: id }).populate('Category')


  if (req.cookies.user) {
    const wishlist = await wishmodel.findOne({Userid:req.cookies.user.id})
    const cart = await cartModel.findOne({ Userid: req.cookies.user.id });

    res.render('user/product', { product, cookie: req.cookies.user, otherproducts, cart ,wishlist})
  } else {
    res.render('user/product', { product, cookie: req.cookies.user, otherproducts, cart: "" ,wishlist:""})
  }
}




module.exports = {
  getproductdetials
}