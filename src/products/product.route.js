const express = require("express");
const {
    createNewProduct,
    getAllProducts,
    getSingleProduct,
    updateProductById,
    deleteProductById,
    getsearchProducts,
    updateProductDiscount,
    updateSizeStock,
    getProductWithStock
} = require("./product.controller");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const { uploadMultiple } = require("../utilis/cloudinary");
const router = express.Router();
// verifyToken, verifyAdmin,
// create a product(only admin)
router.post("/create-product",
    // For single image upload
    uploadMultiple, // For multiple images upload

    createNewProduct
);

// get all products
router.get("/", getAllProducts);

// get single product
router.get("/:id", getSingleProduct);

// update product (admin only)
router.put(
    "/update-product/:id",
    uploadMultiple,
    updateProductById
);

// delete product (admin only)
router.delete("/:id", deleteProductById);
router.get('/products', getsearchProducts);

router.patch('/discount/:productId',updateProductDiscount);
// Update size stock quantities
router.patch('/size-stock', updateSizeStock);

// Get product with stock information
router.get('/stock/:productId', getProductWithStock);
module.exports = router;