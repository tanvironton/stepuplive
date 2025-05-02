const mongoose = require('mongoose');

// Define the schema for the contact form
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,

    },
    phone: {
        type: String,
    },
    message: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Create a model from the schema
const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;