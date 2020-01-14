const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendaSchema = new Schema({
  name: String,
  owner: { type : Schema.Types.ObjectId, ref: 'User' },
  description: String,
  categories: [String],
  // products: [String], //TODO permitir adicionar produtos
  location: { type: { type: String }, coordinates: {type: [Number]} },
  startTime: String, //TODO permitir mais horários
  endTime: String,
  ratings: [{
    rating: {type: Number, min: 1, max: 5},
    content: String,
    user: { type : Schema.Types.ObjectId, ref: 'User' },
  }],
  pictures: Array,
}, {
  timestamps: true
})

vendaSchema.index({ location: '2dsphere' });
const Venda = mongoose.model('Venda', vendaSchema);
module.exports = Venda;