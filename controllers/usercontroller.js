var express = require('express');
var router = express.Router();
var userdatacopy = require('../model/schema')
var bycrypt = require('bcrypt')
const nodemailer = require('nodemailer');
var useraddresscopy = require('../model/address')
var products= require('../model/productmodel');
require('dotenv').config()


