const mongoose = require("mongoose");

const SizesSchema = new mongoose.Schema({
    name: { type: String }, // Ensure "label" is correct
    value: { type: String }
}, { timestamps: true });

const Sizes = mongoose.model("Sizes", SizesSchema);

module.exports = Sizes;