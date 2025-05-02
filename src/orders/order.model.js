const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: String,
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
    }],
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ["coin", "cod", "sslcommerz"],
        required: true
    },
    transaction_id: {
        type: String,
    },
    payment_status: {
        type: Boolean,
        default: false,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "completed", "cancelled"],
        default: "pending",
    },
    coinsEarned: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;