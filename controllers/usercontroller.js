const express = require('express');
const router = express.Router();
const userdatacopy = require('../model/schema')
const bycrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const useraddresscopy = require('../model/address')
const products = require('../model/productmodel');
const { findOne } = require('../model/catagory');
const cartModel = require('../model/cart');
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
  
  if (req.cookies.user) {
    let cart = await cartModel.findOne({ Userid: req.cookies.user.id});

  res.render('user/home', { cookie: req.cookies.user, product ,cart: cart ? cart.Products : null,});
  }else{
    res.render('user/home', { cookie: req.cookies.user, product });
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
  res.render('user/ottp', { error: "", cookie: req.cookies.user })
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
  const err = req.query.error;
  res.render('user/signin', { error: err })
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
          res.cookie('user', cdata, { maxAge: 3600000, httpOnly: true });
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
  const address = await useraddresscopy.findOne({ Userid: req.cookies.user.id });
  const pdata = await userdatacopy.findOne({ email: req.cookies.user.email }).then((data) => {
    return {
      name: data.username,
      email: data.email,
      dob: data.dob,
      gender: data.gender,
    }
  })
  res.render('user/profile', { cookies: pdata, address: address })
}



const postprimaryaddress = async function (req, res) {
  const id = req.cookies.user.id;

  const address = {
    Userid: id,
    PrimaryAddress: {
      Country: req.body.country,
      States: req.body.state,
      City: req.body.city,
      Landmark: req.body.landmark,
      Pincode: req.body.pincode,
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
      Country: req.body.country,
      States: req.body.state,
      City: req.body.city,
      Landmark: req.body.landmark,
      Pincode: req.body.pincode,
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
  const product = await products.findOne({ _id: id })

  res.render('user/product', { product, cookie: req.cookies.user })
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
    res.render('user/cart', { cart: cart ? cart.Products : null })
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
  removecart
} 