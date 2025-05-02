const Color = require("./color.model");

// Create a new color
exports.createColor = async(req, res) => {
    try {
        const { name, hexCode } = req.body;
        if (!name || !hexCode) {
            return res.status(400).json({ message: "Name and hexCode are required" });
        }

        const newColor = new Color({ name, hexCode });
        await newColor.save();
        res.status(201).json(newColor);
    } catch (error) {
        res.status(500).json({ message: "Error creating color", error: error.message });
    }
};

// Get all colors
exports.getAllColors = async(req, res) => {
    try {
        const colors = await Color.find();
        res.status(200).json(colors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching colors", error: error.message });
    }
};

// Get color by ID
exports.getColorById = async(req, res) => {
    try {
        const color = await Color.findById(req.params.id);
        if (!color) {
            return res.status(404).json({ message: "Color not found" });
        }
        res.status(200).json(color);
    } catch (error) {
        res.status(500).json({ message: "Error fetching color", error: error.message });
    }
};

// Update a color
exports.updateColor = async(req, res) => {
    try {
        const { name, hexCode } = req.body;
        const updatedColor = await Color.findByIdAndUpdate(
            req.params.id, { name, hexCode }, { new: true, runValidators: true }
        );

        if (!updatedColor) {
            return res.status(404).json({ message: "Color not found" });
        }

        res.status(200).json(updatedColor);
    } catch (error) {
        res.status(500).json({ message: "Error updating color", error: error.message });
    }
};

// Delete a color
exports.deleteColor = async(req, res) => {
    try {
        const deletedColor = await Color.findByIdAndDelete(req.params.id);
        if (!deletedColor) {
            return res.status(404).json({ message: "Color not found" });
        }
        res.status(200).json({ message: "Color deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting color", error: error.message });
    }
};