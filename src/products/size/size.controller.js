const Sizes = require("./size.model");

exports.createSize = async (req, res) => { 
    try {
        console.log("Received Request Body:", req.body); // Debugging Log
        const { name, value } = req.body;

        if (!name || !value) {
            return res.status(400).json({ message: "Name and value are required" });
        }

        // Check if a size with the same name or value already exists
        const existingSize = await Sizes.findOne({ 
            $or: [{ name }, { value }] 
        });

        if (existingSize) {
            return res.status(400).json({ message: "Size already exists" });
        }

        // Create and save the new size if it doesn't exist
        const newSize = new Sizes({ name, value });
        await newSize.save();

        res.status(201).json(newSize);
    } catch (error) {
        console.error("Error creating size:", error.message); // Log error
        res.status(500).json({ message: "Error creating size", error: error.message });
    }
};

// Get all sizes
exports.getAllSizes = async(req, res) => {
    try {
        const sizes = await Sizes.find();
        res.status(200).json(sizes);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sizes", error: error.message });
    }
};

// Update a size
exports.updateSize = async(req, res) => {
    try {
        const { id } = req.params;
        const updatedSize = await Sizes.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedSize) {
            return res.status(404).json({ message: "Size not found" });
        }
        res.status(200).json(updatedSize);
    } catch (error) {
        res.status(500).json({ message: "Error updating size", error: error.message });
    }
};

// Delete a size
exports.deleteSize = async(req, res) => {
    try {
        const { id } = req.params;
        const deletedSize = await Sizes.findByIdAndDelete(id);
        if (!deletedSize) {
            return res.status(404).json({ message: "Size not found" });
        }
        res.status(200).json({ message: "Size deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting size", error: error.message });
    }
};