const { CoinSetting } = require("./CoinModel");
const mongoose = require('mongoose');
exports.getCoinSettings = async (req, res) => {
    try {
      const settings = await CoinSetting.findOne().sort({ updatedAt: -1 });
      
      if (!settings) {
        return res.status(404).json({ success: false, message: 'No coin settings found' });
      }
      
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };
  
  /**
 
   */
  exports.createOrUpdateCoinSettings = async (req, res) => {
    try {
      const { pricePerCoin, minimumOrderAmount } = req.body;
      
      // Validate inputs
      if (pricePerCoin === undefined || minimumOrderAmount === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Both pricePerCoin and minimumOrderAmount are required' 
        });
      }
      
      // Find if settings already exist
      const existingSettings = await CoinSetting.findOne();
      
      let settings;
      
      if (existingSettings) {
        // Update existing settings
        existingSettings.pricePerCoin = pricePerCoin;
        existingSettings.minimumOrderAmount = minimumOrderAmount;
        existingSettings.updatedAt = Date.now();
        
        settings = await existingSettings.save();
        
        return res.status(200).json({
          success: true,
          message: 'Coin settings updated successfully',
          data: settings
        });
      } else {
        // Create new settings
        settings = await CoinSetting.create({
          pricePerCoin,
          minimumOrderAmount
        });
        
        return res.status(201).json({
          success: true,
          message: 'Coin settings created successfully',
          data: settings
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };


  exports.updateCoinSettingsById = async (req, res) => {
    try {
      const { id } = req.params;
      const { pricePerCoin, minimumOrderAmount } = req.body;
      
      // Validate inputs
      if (!pricePerCoin && !minimumOrderAmount) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (pricePerCoin or minimumOrderAmount) is required for update'
        });
      }
      
      // Check if ID is valid
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coin settings ID format'
        });
      }
      
      // Find settings by ID
      const existingSettings = await CoinSetting.findById(id);
      
      if (!existingSettings) {
        return res.status(404).json({
          success: false,
          message: 'Coin settings not found with the provided ID'
        });
      }
      
      // Update only the fields that are provided
      if (pricePerCoin !== undefined) {
        existingSettings.pricePerCoin = pricePerCoin;
      }
      
      if (minimumOrderAmount !== undefined) {
        existingSettings.minimumOrderAmount = minimumOrderAmount;
      }
      
      existingSettings.updatedAt = Date.now();
      
      const updatedSettings = await existingSettings.save();
      
      return res.status(200).json({
        success: true,
        message: 'Coin settings updated successfully',
        data: updatedSettings
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };
  