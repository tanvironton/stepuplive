// models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

couponSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        return next(new Error('End date must be after start date'));
    }
    next();
});

couponSchema.methods.isValid = function () {
    const now = new Date();
    return this.isActive && now >= this.startDate && now <= this.endDate;
};

module.exports = mongoose.model("Coupon", couponSchema);
