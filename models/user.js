const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  name: String,
  lastName: String,
  role: {
    type: String,
    enum: ['USER', 'SELLER', 'ADMIN'],
    default: 'USER'
  },
  favorites: [ { type : Schema.Types.ObjectId, ref: 'Venda' } ], //TODO implementar favoritos no front
  profilePicturePath: String
}, {
  timestamps: true
})

const User = mongoose.model('User', userSchema);
module.exports = User;