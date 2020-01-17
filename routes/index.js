
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

const checkLogIn = (req, res, next) => {
  let control = {};
  if (req.user) {
    if (req.user.role === "SELLER") {
      control = {
        isLogged: true,
        isSeller: true,
      }
      return control;
    }
    control = {
      isLogged: true,
      isSeller: false
    }
    return control;
  }
  control ={
    isLogged: false,
    isSeller: false
  }
  return control;
}

// LANDING PAGE
router.get('/', (req, res, next) => {
  res.render('index', checkLogIn(req));
});

// REMOVER ESSA ROTA E ESSA VIEW
router.get('/vendas', (req, res, next) => {
  Venda.find()
  .populate('owner')
  .then(vendas => {
    // console.log(vendas);
    res.render('vendas', {vendas})
  })
  .catch(err => console.log(err))
});

// ROTAS API
router.get('/api', (req, res, next) => {
  Venda.find()
  .then(allVendas => {
    res.status(200).json({ vendas: allVendas });
  })
  .catch(err => next(err));
});

router.get('/api/:id', (req, res, next) => {
  let vendaId = req.params.id;
  Venda.findById(vendaId)
    .then(venda => {
      res.status(200).json({ venda: venda });
    })
    .catch(err => next(err));
});

router.get('/login', (req, res, next) => {
  res.render('auth/login', checkLogIn(req));
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/app", 
  failureRedirect: "/login", 
  failureFlash: true, 
  passReqToCallback: true, 
 }));

router.get('/signup', (req, res, next) => {
  res.render('auth/signup', checkLogIn(req));
});

router.post('/signup', uploadCloud.single('photo'), (req, res, next) => {  
  const {username, password, name, lastName} = req.body;
  let profilePicturePath = '';
  if (req.file) {profilePicturePath = req.file.url;}
  
  // validação de formulário
  if (username === "" || password === "" || name === "" || lastName === "") {
    res.render("auth/signup", {
      errorMessage: "Por favor, preencha todos os campos"
    });
    return;
  }
  // garante username único
  User.findOne({ "username": username })
  .then(user => {
    if (user !== null) {
        res.render("auth/signup", {
          errorMessage: "O nome de usuário já existe"
        });
        return;
      }
    
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPass = bcrypt.hashSync(password, salt);
    User.create({
      username,
      password: hashPass,
      name,
      lastName,
      profilePicturePath
    })
    .then((user) => {
      res.redirect("/login");
    })
    .catch(err => next(err))
  })
  .catch(err => next(err))
});

router.get('/seller-signup', (req, res, next) => {
  res.render('auth/seller-signup', checkLogIn(req));
})

router.post('/seller-signup', uploadCloud.single('photo'), (req, res, next) => {
  const {username, password, name, lastName, vendname, description, streetAddress, lat, long, startTime, endTime} = req.body;
  let profilePicturePath = '';
  if (req.file) {profilePicturePath = req.file.url;}

  // validação de formulário
  if (username === "" || password === "" || name === "" || lastName === "") {
    res.render("auth/seller-signup", {
      errorMessage: "Por favor, preencha todos os campos"
    });
    return;
  }
  // garante username único
  User.findOne({ "username": username })
  .then(user => {
    if (user !== null) {
        res.render("auth/seller-signup", {
          errorMessage: "O nome de usuário já existe"
        });
        return;
      }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPass = bcrypt.hashSync(password, salt);

    User.create({
      username,
      password: hashPass,
      name,
      lastName,
      role: "SELLER",
      profilePicturePath
    })
    .then((newUser) => {
      let myLocation = [long, lat];
      let categories = [];
      for (let i = 1; i <= 5; i +=1) {
        let prop = 'cat' + i;
        if (req.body[prop]) {categories.push(req.body[prop])}
      }
      Venda.create({
        name: vendname,
        owner: newUser._id,
        description,
        categories,
        streetAddress,
        location: {
          type: "Point",
          coordinates: myLocation
        },
        startTime,
        endTime,
      })
      .then(newVenda => {
        res.redirect('/login')
      })
      .catch(err => next(err));
    })
    .catch(err => next(err));
  })
  .catch(err => next(err));
});

router.get('/add-venda', checkRoles("SELLER"), (req, res, next) => {
  res.render('auth/add-venda', checkLogIn(req));
});

router.post('/add-venda', (req, res, next) => {
  const {name, description, streetAddress, lat, long, startTime, endTime} = req.body;
  let myLocation = [long, lat];
  let categories = [];
  for (let i = 1; i <= 5; i +=1) {
    let prop = 'cat' + i;
    if (req.body[prop]) {categories.push(req.body[prop])}
  }

  Venda.create({
    name,
    owner: req.user._id,
    description,
    categories,
    streetAddress,
    location: {
      type: "Point",
      coordinates: myLocation
    },
    startTime,
    endTime,
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
  res.redirect("/");
});

// APP MAIN PAGE
router.get('/app', (req, res, next) => {
  res.render('app', checkLogIn(req));
});

router.get('/minhas-vendas', checkRoles("SELLER"), (req, res, next) => {
  const userId = req.user._id;
  Venda.find({owner: userId})
  .populate('owner')
  .then(vendas => {
    let control = checkLogIn(req);
    let {isLogged, isSeller} = control;
    res.render('minhas-vendas', {vendas, isLogged, isSeller})
  })
  .catch(err => console.log(err));
})

router.post('/upload-picture', uploadCloud.single('photo'), (req, res, next) => {
  const path = req.file.url;
  const {description, id} = req.body;
  const newPic = {
    description,
    path
  };

  Venda.findByIdAndUpdate(id, {$push: {pictures: newPic}})
  .then(venda => {
    console.log("sucesso");
    res.redirect('/');
  })
  .catch(err => console.log(err))
})

router.get('/venda/ratings/:id', (req, res, next) => {
  const vendaId = req.params.id;
  Venda.findById(vendaId)
  .then(venda => {
    let control = checkLogIn(req);
    let {isLogged, isSeller} = control;
    venda.isLogged = isLogged;
    venda.isSeller = isSeller;
    res.render('venda-ratings', venda)
  })
  .catch(err => console.log(err))
})

router.get('/venda/:id', (req, res, next) => {
  Venda.findById(req.params.id)
  .populate('owner')
  .then(venda => {
    let control = checkLogIn(req);
    let {isSeller} = control;
    if (req.user) {
      venda.isLogged = true;
      venda.userId = req.user._id;
      venda.isSeller = isSeller;
      if (req.user._id.equals(venda.owner._id)) {
        venda.isOwner = true;
      }
    }
    res.render('venda-details', venda)
  })
  .catch(err => console.log(err))
})

router.get('/edit-venda/:id', (req, res, next) => {
  Venda.findById(req.params.id)
  .then((venda) => {
    let control = checkLogIn(req);
    let {isLogged, isSeller} = control;
    venda.isLogged = isLogged;
    venda.isSeller = isSeller;
    res.render('edit-venda', venda)
  })
  .catch(err => console.log(err))
})

router.post('/edit-venda', (req, res, next) => {
  const {name, description, streetAddress, lat, long, startTime, endTime} = req.body;
  let categories = [];
  let location = [parseFloat(long), parseFloat(lat)];
  for (let i = 1; i <= 5; i +=1) {
    let prop = 'cat' + i;
    if (req.body[prop]) {categories.push(req.body[prop])}
  }

  const editVenda = {
    name,
    owner: req.user._id,
    description,
    categories,
    streetAddress,
    location: {
      type: "Point",
      coordinates: location
    },
    startTime,
    endTime
  }
  Venda.findByIdAndUpdate(req.body.id, editVenda)
  .then(() => {
    res.redirect('/')})
  .catch(err => console.log(err))
})

router.post('/add-rating', (req, res, next) => {
  const {rating, content, userId, vendaId} = req.body;
  const user = req.user.username
  const newRating = {
    rating,
    content,
    user
  };

  Venda.findByIdAndUpdate(vendaId, {$push: {ratings: newRating}})
  .then(() => {
    res.redirect(`/venda/${vendaId}`)
  })
  .catch(err => console.log(err))
})

router.get('/delete-venda/:id', (req, res, next) => {
  if (req.user) {
    Venda.findById(req.params.id)
    .then(venda => {
      if (req.user._id.equals(venda.owner._id)) {
        Venda.findByIdAndDelete(req.params.id)
        .then(() => {
          res.redirect('/')
        })
        .catch(err => console.log(err))
      } else {
        res.send("Você não tem autorização para deletar essa venda!")
      }
    })
    .catch(err => console.log(err))
  } else {
    res.redirect("/login")
  }
})


module.exports = router;

module.exports = router;
