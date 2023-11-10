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


const { errorMonitor } = require('nodemailer/lib/xoauth2');
const ban = require('../model/banner');
const { isValidObjectId } = require('mongoose');

var instance = new Razorpay({
    key_id: 'rzp_test_f0CUyOMdkz5Ems',
    key_secret: 'jVlliMIYj9LGEaoxylbCt0j1',
});


const getorder = async function(req, res, next) {
    try{

        const orders = await Orders.find({Userid:req.cookies.user.id,Status:{$in:['delivered','active']}}).sort({Orderdate:-1})

        if(orders){

            if(req.query.cancel){
                const cancelid = req.query.cancel
                res.render('user/orders',{orders,cancelid})    
            }else{

                res.render('user/orders',{orders,cancelid:""})
            }

        }
    }catch(err){
        console.log(err);
    }
}

const getcancel = async function(req, res, next) {
    try{
        const orders = await Orders.find({Userid:req.cookies.user.id,Status:{$in:['Cancelled','Returned']}}).sort({Orderdate:-1})
        if(orders){
            res.render('user/cancelledorders',{orders})  
        }else{
            res.render('user/cancelledorders',{orders:""})
        }

    } catch(err){
        console.log(err);
    }
}



const saveorder = async function (req, res) {
    try {
        console.log("coupon"+req.query.code);
        let total 
        console.log(req.body);
        let orderid
        let date = new Date()
        let payment = req.body.payment
        let userId
        const coupon = req.query.code
        if (req.cookies.user) {
            userId = req.cookies.user.id;
        }
        const user = await userdatacopy.findById(userId);

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const productId = req.body.productId;
        let productDetails;
        let orderItems;
        if (typeof productId === 'string') {
            productDetails = await products.findById(productId);
            if (!productDetails) {
                return res.status(400).json({ message: 'Product not found for ID: ' + productId });
            }
            total = productDetails.Price - productDetails.Discount
            
                orderItems = [{
                    Payment: payment,
                    Productid: productDetails._id,
                    Productname: productDetails.Productname,
                    Productimg: productDetails.Imagepath[0],
                    Price: total,
                    Quantity: req.body.quantity
                }];
            
            

        } else if (Array.isArray(productId)) {


            productDetails = await products.find({ _id: { $in: productId } });
            if (!productDetails) {
                return res.status(400).json({ message: 'Products not found for the given IDs' });
            }
            orderItems = productDetails.map((product, index) => {
                total= product.Price - product.Discount
                return {

                    

                    Payment: payment,
                    Productid: product._id,
                    Productname: product.Productname,
                    Productimg: product.Imagepath[0],
                    Price: total,
                    Quantity: req.body.quantity[index],
                };
            
            });
        } else {

            return res.status(400).json({ message: 'Invalid product ID(s) provided' });

        }

        const deliveryAddress = {
            cname: req.body.uname,
            country: req.body.country,
            state: req.body.state,
            city: req.body.city,
            pincode: req.body.pincode,
            streetaddress: req.body.streetaddress1[0],
            landmark: req.body.streetaddress1[1],
        };





        let totalAmount = orderItems.reduce((total, item) => total + item.Price * item.Quantity, 0);

        if(coupon!=0){
            const couponcode= await Coupon.findOne({couponcode:coupon})
                if(couponcode){
                    await Coupon.updateOne({couponcode:coupon},{$inc:{userslimit:-1}})
                await Coupon.updateOne({couponcode:coupon},{$push:{usedusers:req.cookies.user.id}})
                totalAmount= totalAmount-couponcode.discountamount 
        }
    }

        const orderData = {
            Userid: user._id,
            Username: user.username,
            Shippingcost: 0,
            Status: 'pending',
            Items: orderItems,
            Deliveryaddress: deliveryAddress,
            Totalamount: totalAmount,
            Orderdate: date,
        };

        await Orders.create(orderData).then((data) => {
            console.log("saved" + data);
        });

        orderid = await Orders.findOne({ Orderdate: date })




        if (payment === 'pod') {
            console.log("Entered");
            await Orders.updateOne({ Orderdate: date }, { $set: { Status: 'active' } })
            helper.generateRazorpay(orderid._id, totalAmount).then((response) => {
                console.log(response);
                res.json(response);
            })



        } else if (payment === 'cod') {
            const product = await Orders.findOne({ _id: orderid._id })
            await Orders.updateOne({ Orderdate: date }, { $set: { Status: 'active' } })
            for (let i = 0; i < product.Items.length; i++) {
                const pro = product.Items[i].Productid;
                const count = product.Items[i].Quantity;
                await products.updateOne(
                    { _id: pro },
                    { $inc: { Stoke: -count } }
                );
            }
            res.json({ codsuccess: true })
        } else if (payment === 'wallet') {
            const userdata = await userdatacopy.findOne({ _id: req.cookies.user.id })

            if (userdata.Wallet >= totalAmount) {
                await userdatacopy.updateOne({ _id: req.cookies.user.id }, { $inc: { Wallet: -totalAmount } })
                const product = await Orders.findOne({ _id: orderid._id })
                await Orders.updateOne({ Orderdate: date }, { $set: { Status: 'active' } })
                for (let i = 0; i < product.Items.length; i++) {
                    const pro = product.Items[i].Productid;
                    const count = product.Items[i].Quantity;
                    await products.updateOne(
                        { _id: pro },
                        { $inc: { Stoke: -count } }
                    );
                }

                const newWalletHistory = {
                    Date: Date.now(),
                    Amount: totalAmount,
                    Description: "Debited for a purchase",
                    Status: 'Debited'
                };

                await userdatacopy.findOneAndUpdate(
                    { _id: req.cookies.user.id },
                    { $push: { WalletHistory: newWalletHistory } }
                );
                res.json({ codsuccess: true })
            } else {
                res.redirect('/checkout?balance="inssufficient balance')
            }

        }



    } catch (err) {
        console.error(err);
    }
}


const placeorder = async function (req, res, next) {
    userid = req.cookies.user.id
    let array = []
    const name = req.cookies.user.id

    const address = await Orders.findOne({ Userid: name })
    const cart = await cartModel.findOne({ Userid: userid });
    cart.Products.forEach(element => {
        array.push(element.Productid)
    });

    await products.updateMany({ _id: { $in: array } }, { $inc: { soldcount: +1 } })
    cart.Products = []

    await cart.save();

    res.render('user/placeorder', { address })
}




const verifyPayment = async (req, res) => {
    try {
        console.log();
        const cartData = await cartModel.findOne({ Userid: req.cookies.user.id });
        const product = cartData.Products;
        const details = req.body;

        const hmac = crypto.createHmac("sha256", 'jVlliMIYj9LGEaoxylbCt0j1');
        console.log(details['order[receipt]']);

        hmac.update(
            details['payment[razorpay_order_id]'] +
            "|" +
            details['payment[razorpay_payment_id]']
        );

        const hmacValue = hmac.digest("hex");

        if (hmacValue === details['payment[razorpay_signature]']) {
            for (let i = 0; i < product.length; i++) {
                const pro = product[i].Productid;
                const count = product[i].Quantity;
                await products.updateOne(
                    { _id: pro },
                    { $inc: { Stoke: -count } }
                );
            }

            await Orders.updateOne(
                { _id: details['order[receipt]'] },
                { $set: { Status: 'active' } }
            );

            await Orders.findByIdAndUpdate(
                { _id: details['order[receipt]'] },
                {
                    $set: { paymentId: details['payment[razorpay_payment_id]'] }
                });

            const orderid = details['order[receipt]'];

            res.json({ codsuccess: true, orderid });
        } else {
            await Orders.findByIdAndRemove({ _id: details['order[receipt]'] });
            res.json({ success: false });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const vieworder = async function (req, res, next) {
    try {
        let id = req.query.id

        const order = await Orders.findOne({ _id: id });

        res.render('user/vieworder', { order: order })




    } catch (err) {
        console.log(err);
    }
}


const cancelorder = async function (req, res, next) {
    try {

        let order = req.query.id
        await Orders.findOneAndUpdate({ _id: order }, { $set: { Status: 'Cancelled' } })
        const product = await Orders.findOne({ _id: order })

        let productid = []
        for (let i = 0; i < product.Items.length; i++) {
            const pro = product.Items[i].Productid;
            const quantity = product.Items[i].Quantity
            productid.push({ id: pro, quantity: quantity });
        }
        console.log(productid);
        productid.map(async (item) => {
            await products.updateOne({ _id: item.id }, { $inc: { Stoke: +item.quantity } })
        })

        res.redirect('/getorder')
    } catch (err) {
        console.log(err);
    }
}

const cancelpod = async function (req, res) {

    const orderid = req.body.id
    const reason = req.body.desc

    console.log(req.body);

    const product = await Orders.findOne({ _id: orderid })
    console.log(product);
    const total = await Orders.findOne({ _id: orderid })
    await Orders.findOneAndUpdate({ _id: orderid }, { $set: { Status: 'Cancelled' } })
    if (total) {

        await userdatacopy.updateOne({ _id: req.cookies.user.id }, { $inc: { Wallet: +total.Totalamount } })
    }

    let productid = []
    for (let i = 0; i < product.Items.length; i++) {
        const pro = product.Items[i].Productid;
        const quantity = product.Items[i].Quantity
        productid.push({ id: pro, quantity: quantity });
    }
    console.log(productid);
    productid.map(async (item) => {
        await products.updateOne({ _id: item.id }, { $inc: { Stoke: +item.quantity } })
    })
    const newWalletHistory = {
        Date: Date.now(),
        Amount: total.Totalamount,
        Description: reason,
        Status: 'Credited'
    };

    await userdatacopy.findOneAndUpdate(
        { _id: req.cookies.user.id },
        { $push: { WalletHistory: newWalletHistory } }
    );

    res.redirect('/getorder?cancel="order cancelled"')




}


const viewwallet = async function (req, res) {
    try {

        const userdata = await userdatacopy.findOne({ _id: req.cookies.user.id })
        res.render('user/viewwallet', { userdata })
    } catch (err) {
        console.log(err);
    }

}


const returnorder = async function (req, res) {
    const orderid = req.body.id
    const reason = req.body.desc

    console.log(req.body);

    const product = await Orders.findOne({ _id: orderid })
    console.log(product);
    const total = await Orders.findOne({ _id: orderid })
    await Orders.findOneAndUpdate({ _id: orderid }, { $set: { Status: 'Returned' } })
    if (total) {

        await userdatacopy.updateOne({ _id: req.cookies.user.id }, { $inc: { Wallet: +total.Totalamount } })
    }

    let productid = []
    for (let i = 0; i < product.Items.length; i++) {
        const pro = product.Items[i].Productid;
        const quantity = product.Items[i].Quantity
        productid.push({ id: pro, quantity: quantity });
    }
    console.log(productid);
    productid.map(async (item) => {
        await products.updateOne({ _id: item.id }, { $inc: { Stoke: +item.quantity } })
    })
    const newWalletHistory = {
        Date: Date.now(),
        Amount: total.Totalamount,
        Description: reason,
        Status: 'Credited'
    };

    await userdatacopy.findOneAndUpdate(
        { _id: req.cookies.user.id },
        { $push: { WalletHistory: newWalletHistory } }
    );

    res.redirect('/getorder?cancel="order cancelled"')




}




module.exports = {
    saveorder,
    placeorder,
    verifyPayment,
    vieworder,
    cancelorder,
    cancelpod,
    viewwallet,
    returnorder,
    getorder,
    getcancel
}