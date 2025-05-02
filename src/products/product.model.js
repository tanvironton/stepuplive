const mongoose = require("mongoose");

// Create a size stock schema to track inventory by size
const sizeStockSchema = new mongoose.Schema({
  size: { type: mongoose.Schema.Types.ObjectId, ref: "Sizes", required: true },
  stock: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Categories", required: true },
  description: {
    type: String
  },
  longDescription: {
    type: String
  },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  discount: { type: Number, default: 0 },
  bestseller: { type: Boolean, default: false },
  topSell: { type: Boolean, default: false },
  image: { type: String },
  gallery: [{ type: String }],
  // Keep single color selection
  color: { type: mongoose.Schema.Types.ObjectId, ref: "Color", required: true },
  // Replace sizes array with sizeStock array to track quantity per size
  sizeStock: [sizeStockSchema],
  // Keep original sizes array for compatibility
  sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sizes", required: true }],
  rating: { type: Number, default: 0 },
  termsAndConditions: { type: String, default: "Standard terms apply" }
}, { timestamps: true });

// Pre-save middleware to automatically populate sizes array from sizeStock
productSchema.pre('save', function(next) {
  // Extract sizes from sizeStock
  this.sizes = this.sizeStock.map(item => item.size);
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;