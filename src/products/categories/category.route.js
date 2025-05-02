const express = require("express");
const {
    createNewCategory,
    getAllCategory,
    deleteCategoryById,
    addDiscount,
} = require("./category.controller");
const router = express.Router();

//router.post("/", createNewCategory);
router.get("/", getAllCategory);
router.post("/create-category", createNewCategory);
router.delete("/delete-category/:id", deleteCategoryById);
router.put("/:id/discount", addDiscount); //  PUT method
module.exports = router;