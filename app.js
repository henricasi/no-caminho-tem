require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const mongoose = require('mongoose');
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const User = require('./models/user')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
hbs.registerPartials(path.join(__dirname, '/views/partials'));

// Mongoose Setup
mongoose
 .connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
 .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
 .catch(err => console.error('Error connecting to mongo', err));


// Passport Setup
app.use(session({
  secret: "our-passport-local-strategy-app", // aqui também não tenho certeza se uso o env
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60000 },
  store: new MongoStore({
  mongooseConnection: mongoose.connection,
  ttl: 24 * 60 * 60 // 1 day
  })
  }));
 passport.serializeUser((user, cb) => {
  cb(null, user._id);
 });
 passport.deserializeUser((id, cb) => {false
  User.findById(id, (err, user) => {
  if (err) { return cb(err); }
  cb(null, user);
  });
 });
// configurando estratégia local
app.use(flash());
passport.use(new LocalStrategy({
 passReqToCallback: true }, (req, username, password, next) => {
  User.findOne({ username }, (err, user) => {
  if (err) {
  return next(err);
  }
  if (!user) {
  return next(null, false, { message: "Incorrect username" });
  }
  if (!bcrypt.compareSync(password, user.password)) {
  return next(null, false, { message: "Incorrect password" });
  }
  return next(null, user);
  });
 }));
app.use(passport.initialize());
app.use(passport.session());


// ROTAS
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
app.use('/', indexRoutes);
app.use('/', authRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
