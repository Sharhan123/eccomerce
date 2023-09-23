var express = require('express');
var router = express.Router();
var userdatacopy = require('../model/schema')
var bycrypt = require('bcrypt')
const nodemailer = require('nodemailer');
var useraddresscopy = require('../model/address')
var products= require('../model/productmodel');
require('dotenv').config()

var transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: "sharhanmohammed03@gmail.com",
  pass:process.env.SECRET_KEY,
  },
})


/* GET home page. */
router.get('/',  async function (req, res, next) {
  const product= await products.find({})
  res.render('user/home', { cookie: req.cookies.user ,product});
})







// user sign up page  /////////////

router.get('/register', function (req, res, next) {

  res.render('user/signup', { error: "" })
})







// register///////////////////////////
router.post('/sign', async function (req, res, next) {

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
            Blocked:false
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

})






// verify otp **************//


router.get('/verify', function (req, res, next) {
  res.render('user/ottp', { error: "", cookie: req.cookies.user })
  console.log(process.env.SECRET_KEY);
})

router.post('/verify', async function (req, res, next) {
  const verificationCode = req.body.code;
  const userEmail = req.cookies.user.email;
  const user = await userdatacopy.findOne({ email: userEmail, verify: verificationCode });
  if (user) {
    await userdatacopy.updateOne({ email: userEmail }, { $set: { verify: 1 } });
    res.redirect('/')
  } else {
    res.render('user/ottp', { error: "Invalid verification code. Please try again.", cookies: req.cookies.user });
  }
})




// verification post **************//

router.post("/resendVerification/:email", async (req, res) => {
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
});







// login ******************//

router.get('/sin', function (req, res, next) {
  res.render('user/signin', { error: "" })
});


router.post('/login', function (req, res, next) {

  userdatacopy.findOne({ $or: [{ email: req.body.semail }, { username: req.body.semail }] }).then((data) => {
    console.log(data);
    if (!data) {

      res.render('user/signin', { error: "invalid email or User name" })
    } else {
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
})





// logout ******************//

router.get('/logout', function (req, res, next) {
  res.clearCookie('user');
  res.redirect('/');
});






// dashboard***************///


router.get('/dash', async function (req, res, next) {

  if (req.cookies.user) {
    const address = await useraddresscopy.findOne({ Userid: req.cookies.user.id });
    const pdata= await userdatacopy.findOne({email:req.cookies.user.email}).then((data)=>{
      return {
        name: data.username,
        email: data.email,
        dob: data.dob,
        gender: data.gender,
      }
    })
    res.render('user/profile', { cookies: pdata, address: address })
  } else {
    res.render('user/profile', { cookies: "", address: "" })
  }
})


router.post('/primaryaddress', async function (req, res, next) {
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
      await useraddresscopy.updateOne({Userid:id},{$set:address})
      res.redirect('/dash')
    } else {
      const add = new useraddresscopy(address)
      await add.save()
      res.redirect('/dash')
    }
  })



router.post('/secondaryaddress', async function (req, res, next) {
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
  if(data){
    await useraddresscopy.updateOne({Userid:id},{$set:saddress})
    res.redirect('/dash')
  }else{
    const add= new useraddresscopy(saddress)
    await add.save()
  }

})


// edit profile

router.post('/editprofile',async function (req, res){
try{
  const data= await userdatacopy.findOne({email:req.cookies.user.email})
  
  if(req.body.currentpass&&(await bycrypt.compare (req.body.currentpass , data.password))){
    if(req.body.newpass){
      const bpassword = await bycrypt.hash(req.body.newpass, 10)
      data.password = bpassword
    }
  }else{
    
  }
  data.username = req.body.name
  data.email= req.body.email
  data.dob = req.body.dob
  data.gender = req.body.gender
  await data.save()
res.redirect('/dash')
  
}catch(err){
  res.send(err)
}
})
module.exports = router;


 