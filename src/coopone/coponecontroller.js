// controllers/couponController.js
const Coupon = require("./cooponmodel");
// const Order = require("../orders/order.model");
const mongoose = require("mongoose");
exports.createCoupon = async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        await coupon.save();
        res.status(201).json(coupon);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(coupon);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: "Coupon deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json(coupons);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch coupons", details: err.message });
    }
};


exports.applyCoupon = async (req, res) => {
    const { code, userId, amount } = req.body;
    
    // Validate required fields
    if (!code || !userId || !amount) {
      return res.status(400).json({ error: "Missing required fields: code, userId, and amount are required." });
    }
    
    // Validate amount is a positive number
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
  
    // Start a session for transaction
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      const coupon = await Coupon.findOne({ code }).session(session);
      
      if (!coupon) {
        return res.status(400).json({ error: "Coupon not found." });
      }
      
      if (!coupon.isValid()) {
        return res.status(400).json({ error: "Coupon is expired or inactive." });
      }
      
      if (coupon.usedBy.includes(userId)) {
        return res.status(400).json({ error: "Coupon already used by this user." });
      }
      
      const discountAmount = (amount * coupon.discountPercentage) / 100;
      const finalAmount = amount - discountAmount;
      
      // Save user as having used the coupon
      coupon.usedBy.push(userId);
      await coupon.save({ session });
      
      await session.commitTransaction();
      
      res.json({
        originalAmount: amount,
        discountAmount,
        finalAmount,
        couponUsed: coupon.code
      });
    } catch (err) {
      await session.abortTransaction();
      
      console.error("Error applying coupon:", err);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      
      res.status(500).json({ error: "An error occurred while processing your request." });
    } finally {
      session.endSession();
    }
  };
