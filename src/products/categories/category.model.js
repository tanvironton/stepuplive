const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
        label: {
            type: String,
            required: true,
            unique: true
        },
        value: {
            type: String,
            required: true,
            unique: true
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
    }, { timestamps: true } // ✅ Correct placement of timestamps
);

const Categories = mongoose.model("Categories", categorySchema);

module.exports = Categories;