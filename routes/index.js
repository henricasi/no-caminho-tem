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

// nossa API
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

module.exports = router;
