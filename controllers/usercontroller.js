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
const Razorpay = require('razorpay');

const wishlistmodel = require('../model/whishlist') 

const { errorMonitor } = require('nodemailer/lib/xoauth2');
const ban = require('../model/banner');

var instance = new Razorpay({
  key_id: process.env.RAZORKEY,
  key_secret: process.env.RAZORSECRET,
});


require('dotenv').config()





var transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.SECRET_KEY,
  },
})


const gethome = async function (req, res) {
  const product = await products.find({})
  const cata = await catagory.find({})
  const banner = await ban.find({})
  if (req.cookies.user) {

    let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
    let wishlist = await wishlistmodel.findOne({Userid: req.cookies.user.id})
    if(req.query.error){
     const error = req.query.error
    let wishlist = await wishlistmodel.findOne({Userid: req.cookies.user.id})
    res.render('user/home', { cookie: req.cookies.user, product, cart: cart ? cart.Products : null, cata, banner ,error ,wishlist});

    }else{
      res.render('user/home', { cookie: req.cookies.user, product, cart: cart ? cart.Products : null, cata, banner ,error:"", wishlist});

    }
  } else {
    res.render('user/home', { cookie: req.cookies.user, product, cata, banner ,error:"",wishlist:""});
  }
}



const getsignup = async function (req, res) {
  res.render('user/signup', { error: "" })
}



const postsignup = async function (req, res) {
  try {
    const Referalcode = Math.floor(100000 + Math.random() * 900000);
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    await userdatacopy.findOne({ email: req.body.email }).then(async (data) => {
      console.log(data);
      if (data) {

        res.render('user/signup', { error: "!!User is already exists!!" })
      } else {
        if (req.body.cpswd === req.body.pswd) {
          if(req.body.refcode){
             await userdatacopy.updateOne(
              { Referalcode: req.body.refcode },
              {
                $inc: { Wallet: +100 }, // Increment Wallet by 100
                $push: {
                  WalletHistory: {
                    Date: new Date(),
                    Amount: 100,
                    Description: 'Referral Bonus',
                    Status: 'Credited'
                  }
                }
              }
            );
          }
          const bpassword = await bycrypt.hash(req.body.pswd, 10)
          var newUser = new userdatacopy({
            username: req.body.uname,
            email: req.body.email,
            password: bpassword,
            verify: verificationCode,
            Blocked: false,
            Referalcode:Referalcode
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
  if (!req.cookies.user) {
    const err = req.query.error;
    res.render('user/signin', { error: err })
  } else {
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
          res.cookie('user', cdata, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
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
  try {
    if (req.cookies.user) {
      const userid = req.cookies.user.id;

      const orders = await Orders.find({
        Userid: userid,
        Status: { $in: ["active", "delivered", "shipped"] }
      });
      const cancel = await Orders.find({ Userid: userid, Status: { $in: ['Cancelled', 'Returned'] } });
      const userdata = await userdatacopy.findOne({ _id: userid });
      const address = await useraddresscopy.findOne({ Userid: req.cookies.user.id });
      const pdata = await userdatacopy.findOne({ email: req.cookies.user.email });

      let aerror = "";
      let cancelid = "";

      if (req.query.cancel) {
        cancelid = req.query.cancel;
      }

      if (req.query.address) {
        aerror = req.query.address;
      }

      res.render('user/profile', {
        cookies: pdata,
        address: address,
        error: req.query.error,
        orders,
        cancel,
        aerror,
        userdata,
        cancelid
      });
    } else {
      res.render('user/profile', {
        cookies: "",
        address: "",
        error: req.query.error,
        orders: "",
        cancel: "",
        aerror: "",
        userdata: "",
        cancelid: ""
      });
    }
  } catch (error) {
    // Handle any errors here, e.g., log the error or send an error response.
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




const postprimaryaddress = async function (req, res) {
  const id = req.cookies.user.id;

  const address = {
    Userid: id,
    PrimaryAddress: {
      Name: req.body.name,
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
      Name: req.body.name,
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














const checkout = async function (req, res) {

  const pid = req.query.pid;
  if (pid) {
    const product = await products.findById(pid);
    const user = await userdatacopy.findById(req.cookies.user.id);
    const address = await useraddresscopy.findOne({ Userid: user._id });

    
    
    if(req.query.balance){
      let balance = req.query.balance
      res.render("user/checkout", {
        product: product,
        user: user,
        address: address,
        balance
      });
    }else{

      res.render("user/checkout", {
        product: product,
        user: user,
        address: address,
        balance:""
      });
    }
  
    
  }


}
















const getshop = async function (req, res, next) {
  try{
  let search = req.query.search
  let name = req.query.name
  let categories = req.query.categories
  let catagry
  let min = req.query.min || 0
  let max = req.query.max || 9999999999999999
  let price = req.query.price
  
  if (categories) {
    // If multiple categories are passed, split them into an array
    let categoryArray = categories.split(',');
    let id = await catagory.find({catagory:{$in:categoryArray}})
    if (categoryArray.length === 1) {
      // If there is only one category, use it
      catagry = categoryArray[0];
    } else {
      // If there are multiple categories, filter by all of them
      catagry = { $in: categoryArray };
    }
  }
  if (name) {

const cname = await catagory.findOne({catagory:name})
    if (price) {
      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({ Category: name })
      const skip = (page - 1) * productsPerPage;
      const product = await products.find({ Category: name, Price: { $gt: min, $lt: max } }).skip(skip).limit(productsPerPage).sort({ Price: 1 }).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)

      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name,
          search: "",
          price,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name,
          search: "",
          price,
          wishlist:""
        });
      }
    } else {
      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({ Category: name })
      const skip = (page - 1) * productsPerPage;
      const product = await products.find({ Category: name, Price: { $gt: min, $lt: max } }).skip(skip).limit(productsPerPage).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)

      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name,
          search: "",
          price: "",
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name,
          search: "",
          price: "",
          wishlist:""
        });
      }
    }

  } else if (catagry) {


    console.log(catagry);

    if (price) {

      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({ Category: catagry })
      const skip = (page - 1) * productsPerPage;
      const product = await products.find({ Category: catagry, Price: { $gt: min, $lt: max } }).skip(skip).limit(productsPerPage).sort({ Price: 1 }).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)

      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name: "",
          search: "",
          price,
          max,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name: "",
          search: "",
          price,
          max,
          wishlist:""
        });
      }

    } else {

      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({ Category: catagry })
      const skip = (page - 1) * productsPerPage;
      const product = await products.find({ Category: catagry, Price: { $gt: min, $lt: max } }).skip(skip).limit(productsPerPage).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)

      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name: "",
          search: "",
          price: "",
          max,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          categories,
          name: "",
          search: "",
          price: "",
          max,
          wishlist:""
        });
      }
    }
  } else if (search) {
    if (price) {
      const regex = new RegExp(search, 'i')

      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({
        $or: [
          { Productname: regex }, // Match product name
            // Match product category
        ]
      }).populate('Category')
      // Calculate the number of products to skip based on the current page
      const skip = (page - 1) * productsPerPage;

      // Query the database to get the products for the current page
      const product = await products.find({
        $or: [
          { Productname: regex }, // Match product name
              // Match product category
        ], Price: { $gt: min, $lt: max }
      })
        .skip(skip)
        .limit(productsPerPage)
        .sort({ Price: 1 }).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)


      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search,
          price,
          max,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search,
          price,
          max,
          wishlist:""
        });
      }
    } else {
      const regex = new RegExp(search, 'i')

      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({
        $or: [
          { Productname: regex }, // Match product name
              // Match product category
        ]
      }).populate('Category')
      
      // Calculate the number of products to skip based on the current page
      const skip = (page - 1) * productsPerPage;

      // Query the database to get the products for the current page
      const product = await products.find({
        $or: [
          { Productname: regex }, // Match product name
             // Match product category
        ], Price: { $gt: min, $lt: max }
      })
        .skip(skip)
        .limit(productsPerPage).populate('Category')
        console.log(product);
      const totalpages = Math.ceil(count / productsPerPage)


      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search,
          price: "",
          max,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search,
          price: "",
          max,
          wishlist:""
        });
      }
    }
  } else {
    if (price) {
      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({})
      // Calculate the number of products to skip based on the current page
      const skip = (page - 1) * productsPerPage;

      // Query the database to get the products for the current page
      const product = await products.find({ Price: { $gt: min, $lt: max } })
        .skip(skip)
        .limit(productsPerPage)
        .sort({ Price: 1 }).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)
      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search: "",
          price,
          max,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search: "",
          price,
          max,
          wishlist:""
        });
      }

    } else {


      const cata = await catagory.find({})
      const page = parseInt(req.query.page) || 1;
      const productsPerPage = 6;
      const count = await products.countDocuments({})
      // Calculate the number of products to skip based on the current page
      const skip = (page - 1) * productsPerPage;

      // Query the database to get the products for the current page
      const product = await products.find({ Price: { $gt: min, $lt: max } })
        .skip(skip)
        .limit(productsPerPage).populate('Category')
      const totalpages = Math.ceil(count / productsPerPage)
      if (req.cookies.user) {
        let cart = await cartModel.findOne({ Userid: req.cookies.user.id });
        let wishlist = await wishlistmodel.findOne({userid:req.cookies.user.id})
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          cart: cart ? cart.Products : null,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search: "",
          price: "",
          max,
          wishlist
        });
      } else {
        res.render('user/shop', {
          cookie: req.cookies.user,
          product,
          currentPage: page,
          totalpages,
          cata,
          name: "",
          categories: "",
          search: "",
          price: "",
          max,
          wishlist:""
        });
      }
    }
  }
} catch (err) {
  
  console.log(err);
  
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
  checkout,
  getshop,
}

