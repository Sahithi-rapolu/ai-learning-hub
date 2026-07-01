const mongoose = require('mongoose');

const SkillExchangeSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skillOffered: String,
  skillWanted: String,
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'completed'], 
    default: 'pending' 
  },
  matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkillExchange', SkillExchangeSchema);