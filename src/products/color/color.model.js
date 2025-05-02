const mongoose = require("mongoose");

const ColorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Color name (e.g., Red, Blue)
    hexCode: { type: String, required: true } // Hex code (e.g., #FF0000)
}, { timestamps: true });

const Color = mongoose.model("Color", ColorSchema);

module.exports = Color;