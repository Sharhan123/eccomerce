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
const Coupon = require('../model/coupon')



const applycoupon = async (req, res) => {
    try {
        
        
      const code = req.body.code;
      console.log(code);
      const amount =  Number(req.body.amount)
      const userExist = await Coupon.findOne({
        couponcode: code,
        usedusers: { $in: [req.cookies.user.id] },
      });
      
      if (userExist) {
        res.json({ user: true });
      } else {
        const couponData = await Coupon.findOne({ couponcode: code });
        
        if (couponData) {
          if (couponData.userslimit <= 0) {
            res.json({ limit: true });
          } else {
            if (couponData.status == false) {
              res.json({ status: true });
            } else {
              if (couponData.expirydate <= new Date()) {
                res.json({ date: true });
              }else if(couponData.activationdate >= new Date()){
                res.json({ active : true})
              }else {
                if (couponData.criteriaamount >= amount) {
                  res.json({ cartAmount: true });
                } else {
                
                    
                    const disAmount = couponData.discountamount;
                    const disTotal = Math.round(amount - disAmount);
                    console.log("amount"+amount,disAmount);
                                  
                    return res.json({ amountOkey: true, disAmount, disTotal });
                 
                }
              }
            }
          }
        } else {
            
          res.json({ invalid: true });
        }
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };



  const deletecoupon = async (req,res)=>{
    try {
        console.log("start");
        const code = req.body.code;
        const couponData = await Coupon.findOne({ couponcode: code });
        const amount = Number(req.body.amount);
        const disAmount = couponData.discountamount;
        const disTotal = Math.round(amount + disAmount);
        
          res.json({success:true, disTotal})
        
      } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
      }
  }

const getcoupon = async function(req, res){
  try{
    let currentDate= Date.now()
    let data = []
   const couponsdata= await  Coupon.find({
      activationdate: { $lt: currentDate },
      expirydate: { $gt: currentDate },
      status: true,
      userslimit: { $gt: 0 }
    })

    await Promise.all(
      couponsdata.map(async (item) => {
        const couponused = await Coupon.findOne({
          $and: [{ couponcode: item.couponcode }, { usedusers: { $in: [req.cookies.user.id] } }]
        });
        if (couponused) {
          data.push({
            couponcode: item.couponcode,
            expirydate: item.expirydate,
            discountamount: item.discountamount,
            criteriaamount: item.criteriaamount,
            used: "Used"
          });
        } else {
          data.push({
            couponcode: item.couponcode,
            expirydate: item.expirydate,
            discountamount: item.discountamount,
            criteriaamount: item.criteriaamount,
            used: "Not Used"
          });
        }
      })
    );



    console.log("data"+data);
    res.render('user/coupons',{data})
  } catch(err){
console.log("error"+err);
  }
}


  module.exports = {
    applycoupon,
    deletecoupon,
    getcoupon
  }