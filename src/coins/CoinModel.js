const mongoose = require('mongoose');

const coinSettingSchema = new mongoose.Schema({
  pricePerCoin: {
    type: Number,
    default: 0, 
    required: true
  },
  minimumOrderAmount: {
    type: Number,
    default: 1000, 
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// const userCoinSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   coins: {
//     type: Number,
//     default: 0
//   },
  
// }, { timestamps: true });

const CoinSetting = mongoose.model('CoinSetting', coinSettingSchema);
// const UserCoin = mongoose.model('UserCoin', userCoinSchema);

module.exports = { CoinSetting };