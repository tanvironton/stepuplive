const express = require('express');
const { getCoinSettings, createOrUpdateCoinSettings, updateCoinSettingsById } = require('./CoinController');
const router = express.Router();


// Get current coin settings
router.get('/', getCoinSettings);

// Create or update coin settings
router.post('/', createOrUpdateCoinSettings);

router.put('/update/:id',updateCoinSettingsById)
  

module.exports = router;