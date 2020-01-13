const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Venda = require('../models/venda');

const bcrypt = require("bcrypt");
const saltRounds = 10;

const passport = require("passport");
const ensureLogin = require("connect-ensure-login");
const uploadCloud = require('../config/cloudinary.js');

const checkRoles = (role) => {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect('/login')
    }
  }
}

router.get('/login', (req, res, next) => {
  res.render('auth/login');
});

// router.get('/user', (req, res, next) => {
//   res.send(req.user);
// })

router.post('/login', passport.authenticate("local", {
  successRedirect: "/", 
  failureRedirect: "/login", 
  failureFlash: true, 
  passReqToCallback: true, 
 }));

router.get('/signup', (req, res, next) => {
  res.render('auth/signup');
});

router.post('/signup', uploadCloud.single('photo'), (req, res, next) => {
  console.log(`My body is`);
  console.log(req.body);
  const {username, password, name, lastName, role} = req.body;
  let profilePicturePath = '';
  if (req.file) {profilePicturePath = req.file.url;}
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashPass = bcrypt.hashSync(password, salt);
  User.create({
    username,
    password: hashPass,
    name,
    lastName,
    role,
    profilePicturePath
  })
  .then(() => {
    res.redirect("/");
  })
  .catch(error => {
    console.log(error);
  })
});

router.get('/vend-signup', checkRoles("SELLER"), (req, res, next) => {
  res.render('auth/vend-signup');
});

router.post('/vend-signup', (req, res, next) => {
  const {name, description, lat, long, startTime, endTime} = req.body;
  let categories = [];
  let location = [long, lat];
  for (let i = 1; i <= 5; i +=1) {
    let prop = 'cat' + i;
    if (req.body[prop]) {categories.push(req.body[prop])}
  }

  Venda.create({
    name,
    owner: req.user._id,
    description,
    categories,
    location,
    startTime,
    endTime
  })
  .then(newVenda => {
    Venda.findOne({_id: newVenda._id})
    .populate('owner')
    .then(newVenda => {
      console.log('Venda populada:');
      console.log(newVenda);
      res.redirect('/');
    })
    .catch(err => console.log(err))
  })
  .catch(err => console.log(err))
});

router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect("/login");
});

// APP MAIN PAGE
router.get('/app', (req, res, next) => {
  res.render('app');
});

router.get('/venda/:id', (req, res, next) => {
  Venda.findById(req.params.id)
  .populate('owner')
  .then(venda => {
    res.render('venda-details', venda)
  })
  .catch(err => console.log(err))
})

module.exports = router;