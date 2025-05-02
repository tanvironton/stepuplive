const express = require("express");
const router = express.Router();
const colorController = require("./color.controller");

router.post("/create-color", colorController.createColor); // Create a new color
router.get("/all", colorController.getAllColors); // Get all colors
router.get("/:id", colorController.getColorById); // Get color by ID
router.put("/:id", colorController.updateColor); // Update a color
router.delete("/:id", colorController.deleteColor); // Delete a color

module.exports = router;