const router = require('express').Router();
const SkillExchange = require('../models/SkillExchange');
const auth = require('../middleware/auth');

// Get all skill exchanges
router.get('/', auth, async (req, res) => {
  try {
    const exchanges = await SkillExchange.find()
      .populate('requesterId', 'name')
      .populate('matchedWith', 'name');
    res.json(exchanges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create skill exchange request
router.post('/', auth, async (req, res) => {
  try {
    const { skillOffered, skillWanted } = req.body;
    const exchange = new SkillExchange({
      requesterId: req.user.id,
      skillOffered,
      skillWanted,
      status: 'pending'
    });
    await exchange.save();
    res.status(201).json(exchange);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;