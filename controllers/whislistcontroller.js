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
const wishlist = require('../model/whishlist')

const addtowish= async function(req, res, next) {
try{
    const id= req.query.id;
    const exist= await wishlist.findOne({Userid:req.cookies.user.id})
    const exists = await wishlist.findOne({Userid:req.cookies.user.id,Products:id}).exec()
    console.log(id);
    if(exists){
        res.redirect('/?error=The product you are trying to add wishlist , already exist')
    }
    else if(exist){
       
                
            
        exist.Products.push(id)
        await exist.save()

    }else{
        const newcart = new wishlist({
            Userid: req.cookies.user.id,
            Products:[]
          });

          newcart.Products.push()
          await newcart.save();
          
    }
    res.redirect('/')

} catch(err) {
console.log(err);
}
}

const getwish= async (req, res, next) => {
try{

const product = await wishlist.findOne({Userid:req.cookies.user.id})
if(product){

    const productids= product.Products
    console.log(productids);
    const wish = await products.find({_id:{$in:productids}}).populate('Category')
    console.log(wish);
    res.render('user/wishlist',{wish})
}else{
    res.redirect('/?error=you have no wishlist add a product for wishlist')
}

} catch(err) {
console.log(err);
}
}

const remove = async (req, res,)=>{
    try{

        const id= req.params.id
    
        if(id){
            await wishlist.updateOne({Userid:req.cookies.user.id},{$pull:{Products:id}})
            res.redirect('/wishlist')
        }else{
        res.redirect('/')
        }

    } catch(err) {
        console.log(err);
    }
}


const update = async (req, res)=>{
    try{

        await wishlist.updateOne({Userid:req.cookies.user.id},{Products:[]})
        
        res.redirect('/wishlist')
    } catch(err){
        console.log(err);
    }
}

module.exports = {
    addtowish,
    getwish,
    remove,
    update
  }                   