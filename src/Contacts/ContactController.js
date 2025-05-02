const Contact = require('./ContactModel');

// Create a new contact
const submitContactForm = async(req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate the incoming data
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required.' });
        }

        // Create a new contact entry in the database
        const newContact = new Contact({ name, email, phone, message });
        await newContact.save();

        return res.status(201).json({ success: 'Your message has been received!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
};

// Get all contacts
const getAllContacts = async(req, res) => {
    try {
        const contacts = await Contact.find();
        return res.status(200).json(contacts);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
};

// Get a single contact by ID
const getSingleContact = async(req, res) => {
    const { id } = req.params;
    try {
        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found.' });
        }

        return res.status(200).json(contact);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
};

// Delete a contact by ID
const deleteContact = async(req, res) => {
    const { id } = req.params;
    try {
        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found.' });
        }

        return res.status(200).json({ success: 'Contact deleted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
};

module.exports = {
    submitContactForm,
    getAllContacts,
    getSingleContact,
    deleteContact,
};