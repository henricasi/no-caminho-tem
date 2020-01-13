const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
  name: String,
  lastName: String,
  role: {
    type: String,
    enum: ['USER', 'SELLER', 'ADMIN'],
    default: 'USER'
  },
  profilePicturePath: String
  // vendas: [ { type : Schema.Types.ObjectId, ref: 'Venda' } ]
}, {
  timestamps: true
})

const User = mongoose.model('User', userSchema);
module.exports = User;