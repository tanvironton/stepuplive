const express = require('express');
const { submitContactForm, getAllContacts, getSingleContact, deleteContact } = require('./ContactController');

const router = express.Router();

// POST route for submitting the contact form
router.post('/contact', submitContactForm);

// GET route for getting all contacts
router.get('/contacts', getAllContacts);

// GET route for getting a single contact by ID
router.get('/contact/:id', getSingleContact);

// DELETE route for deleting a contact by ID
router.delete('/contact/:id', deleteContact);

module.exports = router;