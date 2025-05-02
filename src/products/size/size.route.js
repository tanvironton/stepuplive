const express = require("express");

const router = express.Router();
const sizesController = require("./size.controller");

// Routes
router.post("/create-size", sizesController.createSize);

router.get("/", sizesController.getAllSizes); // Get all sizes
router.put("/:id", sizesController.updateSize); // Update a size by ID
router.delete("/:id", sizesController.deleteSize); // Delete a size by ID

module.exports = router;