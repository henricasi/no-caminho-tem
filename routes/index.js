const express = require('express');
const router = express.Router();
const Venda = require('../models/venda');

router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/vendas', (req, res, next) => {
  Venda.find()
  .populate('owner')
  .then(vendas => {
    // console.log(vendas);
    res.render('vendas', {vendas})
  })
  .catch(err => console.log(err))
});

module.exports = router;
