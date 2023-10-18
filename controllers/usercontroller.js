const express = require('express');
const router = express.Router();
const userdatacopy = require('../model/schema')
const bycrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const useraddresscopy = require('../model/address')
const products = require('../model/productmodel');
const { findOne } = require('../model/catagory');
const cartModel = require('../model/cart');
const Orders = require('../model/orders');
const catagory =require('../model/catagory')
require('dotenv').config()

var transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: "sharhanmohammed03@gmail.com",
    pass: process.env.SECRET_KEY,
  },
})


const gethome = async function (req, res) {
  const product = await products.find({})
  const cata = await catagory.find({})
  
  if (req.cookies.user) {
    let cart = await cartModel.findOne({ Userid: req.cookies.user.id});

  res.render('user/home', { cookie: req.cookies.user, product ,cart: cart ? cart.Products : null, cata});
  }else{
    res.render('user/home', { cookie: req.cookies.user, product ,cata});
  }
}



const getsignup = async function (req, res) {
  res.render('user/signup', { error: "" })
}



const postsignup = async function (req, res) {
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    userdatacopy.findOne({ email: req.body.email }).then(async (data) => {
      console.log(data);
      if (data) {

        res.render('user/signup', { error: "!!User is already exists!!" })
      } else {
        if (req.body.cpswd === req.body.pswd) {

          const bpassword = await bycrypt.hash(req.body.pswd, 10)
          var newUser = new userdatacopy({
            username: req.body.uname,
            email: req.body.email,
            password: bpassword,
            verify: verificationCode,
            Blocked: false
          })
          newUser.save().then((data) => {
            console.log("data saved");
            const cdata = {
              id: data._id,
              name: data.username,
              email: data.email,

            };
            res.cookie("user", cdata, { maxAge: 3600000, httpOnly: true });
            const mailOptions = {
              from: "sharhanmohammed03@gmail.com",
              to: data.email,
              subject: "Account Verification",
              text: `Your verification code is: ${verificationCode}`,
            }
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log("Error sending email: " + error);
              } else {
                console.log("Email sent: " + info.response);
              }
            })
            res.redirect('/verify')
          }).catch((error) => {
            console.log("ERROR ON SAVING DATA " + error);
          });


        } else {
          res.render('user/signup', { error: "!!Password not match!!" })
        }
      }

    })


  } catch (error) {
    res.send(error)
  }

}

const getverify = async function (req, res) {
  res.render('user/ottp', { error: "", cookies: req.cookies.user })
  console.log(process.env.SECRET_KEY);
}

const postverify = async function (req, res) {
  const verificationCode = req.body.code;
  const userEmail = req.cookies.user.email;
  const user = await userdatacopy.findOne({ email: userEmail, verify: verificationCode });
  if (user) {
    await userdatacopy.updateOne({ email: userEmail }, { $set: { verify: 1 } });
    res.redirect('/')
  } else {
    res.render('user/ottp', { error: "Invalid verification code. Please try again.", cookies: req.cookies.user });
  }
}

const postresendverification = async function (req, res) {
  const userEmail = req.params.email;
  // Generate a new verification code
  const newVerificationCode = Math.floor(100000 + Math.random() * 900000);
  // Update user's verification code in the database
  await userdatacopy.updateOne(
    { email: userEmail },
    { $set: { verify: newVerificationCode } }
  );
  // Send verification email with the new code
  const mailOptions = {
    from: "sharhanmohammed03@gmail.com",
    to: userEmail,
    subject: "New Verification Code",
    text: `Your new verification code is: ${newVerificationCode}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email: " + error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  res.redirect("/verify");
}



const getlogin = async function (req, res) {
  if(!req.cookies.user){
  const err = req.query.error;
  res.render('user/signin', { error: err })
}else{
  res.redirect('/')
}
}



const postlogin = async function (req, res) {
  userdatacopy.findOne({ email: req.body.semail }).then((data) => {
    console.log(data);
    if (!data) {

      res.render('user/signin', { error: "invalid email or User name" })
    } else if (data.Blocked === true) {
      res.render('user/signin', { error: "Soryy , admin had blocked this user" })
    }
    else {
      const cdata = {
        id: data._id,
        name: data.username,
        email: data.email,

      };
      bycrypt.compare(req.body.spassword, data.password, (err, isMatch) => {
        if (err) {
          // Handle error
          return res.status(500).send('Error comparing passwords');
        }

        if (isMatch) {
          // Passwords match, redirect to the root URL
          res.cookie('user', cdata, { maxAge: 24 * 60 * 60 * 1000 , httpOnly: true });
          res.redirect('/');
        } else {
          // Passwords do not match, handle accordingly
          res.render('user/signin', { error: "password is incorrect" })
        }
      });
    }
  })
}



const getlogout = async function (req, res) {
  res.clearCookie('user');
  res.redirect('/');
}



const getprofile = async function (req, res) {

  
  
  
  





  if(req.cookies.user){
    userid= req.cookies.user.id
  const orders = await Orders.find({Userid:userid})
  const address = await useraddresscopy.findOne({ Userid: req.cookies.user.id });
  const pdata = await userdatacopy.findOne({ email: req.cookies.user.email }).then((data) => {
    return {
      name: data.username,
      email: data.email,
      dob: data.dob,
      gender: data.gender,
    }
  })
    res.render('user/profile', { cookies: pdata, address: address ,error:req.query.error ,orders})
  }else{
    res.render('user/profile', { cookies: "", address:"" ,error:req.query.error  , orders:""})
  }
}



const postprimaryaddress = async function (req, res) {
  const id = req.cookies.user.id;

  const address = {
    Userid: id,
    PrimaryAddress: {
      Name:req.body.name,
      Country: req.body.country,
      States: req.body.state,
      City: req.body.city,
      Landmark: req.body.landmark,
      Pincode: req.body.pincode,
      Phone: req.body.phone
    }
  }
  const data = await useraddresscopy.findOne({ Userid: id })

  if (data) {
    await useraddresscopy.updateOne({ Userid: id }, { $set: address })
    res.redirect('/dash')
  } else {
    const add = new useraddresscopy(address)
    await add.save()
    res.redirect('/dash')
  }
}



const postsecondaryaddress = async function (req, res) {
  const id = req.cookies.user.id;
  const saddress = {
    SecondaryAddress: {
      Name:req.body.name,
      Country: req.body.country,
      States: req.body.state,
      City: req.body.city,
      Landmark: req.body.landmark,
      Pincode: req.body.pincode,
      Phone: req.body.phone
    }
  }
  const data = await useraddresscopy.findOne({ Userid: id })
  console.log(data)
  if (data) {
    await useraddresscopy.updateOne({ Userid: id }, { $set: saddress })
    res.redirect('/dash')
  } else {
    const add = new useraddresscopy(saddress)
    await add.save()
  }
}


const editprofile = async function (req, res) {
  try {
    const data = await userdatacopy.findOne({ email: req.cookies.user.email })

    if (req.body.currentpass && (await bycrypt.compare(req.body.currentpass, data.password))) {
      if (req.body.newpass) {
        const bpassword = await bycrypt.hash(req.body.newpass, 10)
        data.password = bpassword
      }
    } else {
      
    }
    data.username = req.body.name
    data.email = req.body.email
    data.dob = req.body.dob
    data.gender = req.body.gender
    await data.save()
    res.redirect('/dash')

  } catch (err) {
    res.send(err)
  }
}

const getproductdetials = async function (req, res) {
  const id = req.params.pid;
  const otherproducts= await products.find({})
  const product = await products.findOne({ _id: id })


  if(req.cookies.user){

    const cart = await cartModel.findOne({ Userid: req.cookies.user.id });
  
    res.render('user/product', { product, cookie: req.cookies.user , otherproducts, cart})
  }else{
    res.render('user/product', { product, cookie: req.cookies.user , otherproducts, cart:""})
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

const getCart =  async function (req, res){
  if(req.cookies.user){
    let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    const err=req.query.error
    res.render('user/cart', { cart: cart ? cart.Products : null  , error: err})
  }else{
    res.redirect('/sin?error=you have to login to use cart');
  }
}

const updatecart= async function (req, res){
  let productId = req.params.id;
  console.log(productId);
  const newQuantity = req.body.quantity;
  try {
    const cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }
    const product = cart.Products.find((p)=> p._id == productId )
    console.log(product);
    product.Quantity = newQuantity
    console.log("Product saved");
    await cart.save();
    res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    console.log("Product NOT saved : "+ error.message);
    res.status(500).json({ error: "Error updating quantity" });
  }
}

const removecart= async function (req,res){
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

const checkout= async function (req, res) {
  const pid = req.query.pid;
  if (pid) {
    const product = await products.findById(pid);
    const user = await userdatacopy.findById(req.cookies.user.id);
    const address = await useraddresscopy.findOne({ Userid: user._id });
    res.render("user/checkout", {
      product: product,
      user: user,
      address: address,
    });
  }

}


const cartcheckout= async function (req, res) {
  const user = await userdatacopy.findById(req.cookies.user.id);
  const address = await useraddresscopy.findOne({ Userid: user._id });
  const cart = await cartModel.findOne({ Userid: user._id });
  console.log(cart);
  if(cart.Products[0]){

    res.render("user/checkout", {
      product: null,
      user: user,
      address: address,
      cart: cart.Products,
      
  })
  }else{
  res.redirect('/viewcart?error:you have no products')  
  
}
}

const saveorder= async function (req, res) {
  try{
    let date = new Date()
    let payment= req.body.payment
    let userId
    if(req.cookies.user){
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
      orderItems = [{
        Paymet: payment,
        Productid: productDetails._id,
        Productname: productDetails.Productname,
        Price: productDetails.Price,
        Quantity: req.body.quantity
      }];

    }else if (Array.isArray(productId)){

    
    productDetails = await products.find({ _id: { $in: productId } });
      if (!productDetails) {
        return res.status(400).json({ message: 'Products not found for the given IDs' });
      }
      orderItems = productDetails.map((product,index) => {
        return {
          Paymet:payment,
          Productid: product._id,
          Productname: product.Productname,
          Productimg: product.Imagepath[0],
          Price: product.Price,
          Quantity: req.body.quantity[index],
        };
      });
    }else{
      
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


    

    
    const totalAmount = orderItems.reduce((total, item) => total + item.Price * item.Quantity, 0);

    const orderData = {
      Userid: user._id,
      Username: user.username,
      Shippingcost: 0,
      Status:'pending',
      Items: orderItems,
      Deliveryaddress: deliveryAddress,
      Totalamount: totalAmount,
      Orderdate: date,
    };

     await Orders.create(orderData);

    


    if(payment==='pod'){
      await Orders.updateOne({Orderdate:date},{$set:{Status:'pending'}})
    }else if(payment==='cod'){
      await Orders.updateOne({Orderdate:date},{$set:{Status:'active'}})
    }


    res.redirect('/placeorder?userId');
  } catch(err){
    console.error(err);
  }
}


const placeorder= async function(req, res, next){
   userid=req.cookies.user.id
  const name= req.cookies.user.id
  const address = await Orders.findOne({ Userid:name})
  const cart = await cartModel.findOne({ Userid: userid });

  cart.Products=[]

  await cart.save();

  res.render('user/placeorder',{address} )
}






const getshop = async function(req, res, next) {
  let search = req.query.search
  let name= req.query.name
  let categories = req.query.categories
  let catagry 
  let min= req.query.min || 0
  let max= req.query.max || 9999999999999999
  let price = req.query.price
  if (categories) {
    // If multiple categories are passed, split them into an array
    const categoryArray = categories.split(',');

    if (categoryArray.length === 1) {
      // If there is only one category, use it
      catagry = categoryArray[0];
    } else {
      // If there are multiple categories, filter by all of them
      catagry = { $in: categoryArray };
    }
  }
  if(name){

    if(price){
    const cata = await catagory.find({})
    const page = parseInt(req.query.page) || 1;
    const productsPerPage = 6;
    const count = await products.countDocuments({Category:name})
    const skip = (page - 1) * productsPerPage;
    const product= await products.find({Category:name,Price: {$gt:min,$lt:max}}).skip(skip).limit(productsPerPage).sort({Price:1})
    const totalpages = Math.ceil(count/productsPerPage)

      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name,
          search:"",
          price
        });
      }else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name,
          search:"",
          price
        });
      }
    }else{
      const cata = await catagory.find({})
    const page = parseInt(req.query.page) || 1;
    const productsPerPage = 6;
    const count = await products.countDocuments({Category:name})
    const skip = (page - 1) * productsPerPage;
    const product= await products.find({Category:name,Price: {$gt:min,$lt:max}}).skip(skip).limit(productsPerPage)
    const totalpages = Math.ceil(count/productsPerPage)

      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name,
          search:"",
          price:""
        });
      }else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name,
          search:"",
          price:""
        });
      }
    }
  
  }else if(catagry){
    

    console.log(catagry);

    if(price){

      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({Category:catagry})
      const skip = (page - 1) * productsPerPage;
      const product= await products.find({Category:catagry,Price: {$gt:min,$lt:max}}).skip(skip).limit(productsPerPage).sort({Price:1})
      const totalpages = Math.ceil(count/productsPerPage)
  
      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name:"",
          search:"",
          price,
          max
        });
      }else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name:"",
          search:"",
          price,
          max,
        });
      }

    }else{

    const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({Category:catagry})
      const skip = (page - 1) * productsPerPage;
      const product= await products.find({Category:catagry,Price: {$gt:min,$lt:max}}).skip(skip).limit(productsPerPage)
      const totalpages = Math.ceil(count/productsPerPage)
  
      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name:"",
          search:"",
          price:"",
          max
        });
      }else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name:"",
          search:"",
          price:"",
          max
        });
      }
    }
    }else if(search){
if(price){
  const regex = new RegExp(search, 'i')

    const cata = await catagory.find({})
    const page = parseInt(req.query.page) || 1;
   const productsPerPage = 6;
   const count = await products.countDocuments({
    $or: [
      { Productname: regex }, // Match product name
      { Category: regex },    // Match product category
    ]
  })
   // Calculate the number of products to skip based on the current page
   const skip = (page - 1) * productsPerPage;
 
   // Query the database to get the products for the current page
   const product = await products.find({
    $or: [
      { Productname: regex }, // Match product name
      { Category: regex },    // Match product category
    ],Price: {$gt:min,$lt:max}
  })
     .skip(skip)
     .limit(productsPerPage)
     .sort({Price:1});
     const totalpages = Math.ceil(count/productsPerPage)

     
   if (req.cookies.user) {
     let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
 
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       cart: cart ? cart.Products : null,
       currentPage: page,
       totalpages,
       cata,
       name:"",
       categories:"",
       search,
       price,
       max
     });
   } else {
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       currentPage: page,
       totalpages,
       cata,
       name: "",
       categories:"",
       search,
       price,
       max
     });
   }
}else{
      const regex = new RegExp(search, 'i')

    const cata = await catagory.find({})
    const page = parseInt(req.query.page) || 1;
   const productsPerPage = 6;
   const count = await products.countDocuments({
    $or: [
      { Productname: regex }, // Match product name
      { Category: regex },    // Match product category
    ]
  })
   // Calculate the number of products to skip based on the current page
   const skip = (page - 1) * productsPerPage;
 
   // Query the database to get the products for the current page
   const product = await products.find({
    $or: [
      { Productname: regex }, // Match product name
      { Category: regex },    // Match product category
    ],Price: {$gt:min,$lt:max}
  })
     .skip(skip)
     .limit(productsPerPage);
     const totalpages = Math.ceil(count/productsPerPage)

     
   if (req.cookies.user) {
     let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
 
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       cart: cart ? cart.Products : null,
       currentPage: page,
       totalpages,
       cata,
       name:"",
       categories:"",
       search,
       price:"",
       max
     });
   } else {
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       currentPage: page,
       totalpages,
       cata,
       name: "",
       categories:"",
       search,
       price:"",
       max
     });
   }
  }
  }else{
    if(price){
      const cata = await catagory.find({})
    const page = parseInt(req.query.page) || 1;
   const productsPerPage = 6;
   const count = await products.countDocuments({})
   // Calculate the number of products to skip based on the current page
   const skip = (page - 1) * productsPerPage;
 
   // Query the database to get the products for the current page
   const product = await products.find({Price: {$gt:min,$lt:max}})
     .skip(skip)
     .limit(productsPerPage)
     .sort({Price:1});
     const totalpages = Math.ceil(count/productsPerPage)
   if (req.cookies.user) {
     let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
 
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       cart: cart ? cart.Products : null,
       currentPage: page,
       totalpages,
       cata,
       name:"",
       categories:"",
       search:"",
       price,
       max
     });
   } else {
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       currentPage: page,
       totalpages,
       cata,
       name: "",
       categories:"",
       search:"",
       price,
       max
     });
   }
  
    }else{

    
    const cata = await catagory.find({})
    const page = parseInt(req.query.page) || 1;
   const productsPerPage = 6;
   const count = await products.countDocuments({})
   // Calculate the number of products to skip based on the current page
   const skip = (page - 1) * productsPerPage;
 
   // Query the database to get the products for the current page
   const product = await products.find({Price: {$gt:min,$lt:max}})
     .skip(skip)
     .limit(productsPerPage);
     const totalpages = Math.ceil(count/productsPerPage)
   if (req.cookies.user) {
     let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
 
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       cart: cart ? cart.Products : null,
       currentPage: page,
       totalpages,
       cata,
       name:"",
       categories:"",
       search:"",
       price:"",
       max
     });
   } else {
     res.render('user/shop', {
       cookie: req.cookies.user,
       product,
       currentPage: page,
       totalpages,
       cata,
       name: "",
       categories:"",
       search:"",
       price:"",
       max
     });
   }
  }
}
}










const removeorder = async function(req, res,){
  try {
    const orderId = req.params.id;
    const Ordersid = req.params.oid;
    console.log("orderid : " + orderId, "userid : " + Ordersid);

    // Find the order and update the Items array
    const order = await Orders.findById(Ordersid);

    // Filter out the item with the given _id
    const index = order.Items.findIndex((item) => item._id == orderId);
    order.Totalamount = order.Totalamount - order.Items[index].Price;

    order.Items = order.Items.filter(
      (item) => item._id.toString() !== orderId
    );

    if (order.Items.length < 1) {
      await Orders.findByIdAndRemove(Ordersid);
    }
    // Save the updated order
    await order.save();

    res.redirect('/dash')
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).send("Internal Server Error");
  }

}


const filtershop = async (req, res) =>{
  
 
    
    }




module.exports = {
  gethome,
  getsignup,
  postsignup,
  getverify,
  postverify,
  postresendverification,
  getlogin,
  postlogin,
  getlogout,
  getprofile,
  postprimaryaddress,
  postsecondaryaddress,
  editprofile,
  getproductdetials,
  addtocarthome,
  getCart,
  updatecart,
  removecart,
  checkout,
  cartcheckout,
  saveorder,
  placeorder,
  getshop,
  removeorder,
  filtershop
} 