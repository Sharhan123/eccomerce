require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');


// const indexRouter = require('./routes/user');
const adminRouter = require('./routes/adminroutes');
const userRouter = require('./routes/userroutes');
const adminrouter= require('./routes/adminroutes')
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', userRouter);

// app.use('/admin', usersRouter);

app.use('/getadmin',adminrouter)
mongoose.connect('mongodb+srv://sharhanmohammed03:Rapid7711@cluster.8vewkk6.mongodb.net/electromania?retryWrites=true&w=majority').then(()=>console.log("connection successfull")).catch((err)=>console.log(err))
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
