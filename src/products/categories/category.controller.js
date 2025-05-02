const { errorResponse, successResponse } = require("../../utilis/responseHandler");
const mongoose = require("mongoose");
const Categories = require("../categories/category.model")
const Products=require("../product.model")
const createNewCategory = async(req, res) => {
    const { label, value } = req.body || {};
    // Optional chaining for `req.body`
    
    try {
        // Validation: Check if both fields are provided
        if (!label || !value) {
            return res.status(400).json({ message: "Both 'label' and 'value' fields are required!" });
        }
        
        // Check if category already exists with same label or value
        const existingCategory = await Categories.findOne({ 
            $or: [
                { label: label },
                { value: value }
            ]
        });
        
        if (existingCategory) {
            return res.status(409).json({ 
                message: "Category already exists", 
                existingCategory 
            });
        }
        
        // Create and save the new category
        const category = new Categories({ label, value });
        const categoryResponse = await category.save();
        
        // Send success response
        return res.status(200).json({
            message: "Category created successfully",
            data: categoryResponse,
        });
        
    } catch (error) {
        // Handle errors and send response
        return res.status(500).json({
            message: "Failed to create new category",
            error: error.message,
        });
    }
};

const getAllCategory = async(req, res) => {
    try {
        const categoriesResponse = await Categories.find();
        return res.status(200).json({
            message: "Get All Categories successfully",
            data: categoriesResponse,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create new category",
            error: error.message,
        });
    }
};



const deleteCategoryById = async(req, res) => {
    const { id } = req.params || {};

    try {
        const categoryResponse = await Categories.findByIdAndDelete(id);
        return successResponse(
            res,
            200,
            "Category Deleted successfully",
            categoryResponse
        );
    } catch (error) {
        return errorResponse(res, 500, "Failed to Delete category", error);
    }
};

const addDiscount = async (req, res) => {
    const { id } = req.params || {};
    const { discount } = req.body || {};
    
    // Validate discount value
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
        return errorResponse(res, 400, "Discount value must be a number between 0 and 100");
    }
    
    // Start session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // 1. Update Category Discount
        const updatedCategory = await Categories.findByIdAndUpdate(
            id,
            { discount },
            { new: true, runValidators: true, session }
        );
        
        if (!updatedCategory) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 404, "Category not found");
        }
        
        // 2. Find all Products under the category
        const products = await Products.find({ category: id }).session(session);
        
        // 3. Prepare bulk operations for all products in the category
        const bulkOperations = products.map(product => {
            // Calculate the base price (either current price before discount or stored oldPrice)
            let basePrice;
            
            // If product already has a discount applied, use oldPrice as the base
            if (product.discount > 0 && product.oldPrice > 0) {
                basePrice = product.oldPrice;
            } else {
                // If no previous discount, current price is the base price
                basePrice = product.price;
                // Store the original price as oldPrice
            }
            
            // Calculate new discounted price
            const discountAmount = (basePrice * discount) / 100;
            const newPrice = basePrice - discountAmount;
            
            return {
                updateOne: {
                    filter: { _id: product._id },
                    update: {
                        $set: {
                            discount: discount,
                            oldPrice: basePrice,
                            price: newPrice
                        }
                    }
                }
            };
        });
        
        // 4. Execute bulk update if there are any products to update
        if (bulkOperations.length > 0) {
            await Products.bulkWrite(bulkOperations, { session });
        }
        
        // 5. Commit Transaction
        await session.commitTransaction();
        session.endSession();
        
        return successResponse(res, 200, "Discount updated successfully", {
            category: updatedCategory,
            productsUpdated: bulkOperations.length
        });
        
    } catch (error) {
        // Rollback transaction in case of error
        await session.abortTransaction();
        session.endSession();
        return errorResponse(res, 500, "Failed to update discount", error.message);
    }
};

// const addDiscount = async(req, res) => {
//     const { id } = req.params || {};
//     const { discount } = req.body || {};
    
//     // Validate discount value
//     if (discount < 0 || discount > 100) {
//         return errorResponse(res, 400, "Discount value must be between 0 and 100");
//     }
    
//     try {
//         // Start a transaction
//         const session = await mongoose.startSession();
//         session.startTransaction();
        
//         try {
//             // Update the category with the new discount
//             const updatedCategory = await Categories.findByIdAndUpdate(
//                 id,
//                 { discount },
//                 { new: true, runValidators: true, session }
//             );
            
//             if (!updatedCategory) {
//                 await session.abortTransaction();
//                 session.endSession();
//                 return errorResponse(res, 404, "Category not found");
//             }
            
//             // Find all products in this category
//             const products = await Products.find({ category: id }).session(session);
            
//             // Update each product's discount if needed
//             for (const product of products) {
//                 // Only update product if its discount is less than the category discount
//                 if (product.discount < discount) {
//                     // If oldPrice is not set (oldPrice === 0), set it to the current price
//                     if (!product.oldPrice || product.oldPrice === 0) {
//                         product.oldPrice = product.price;
//                     }
                    
//                     // Calculate new price based on the discount
//                     const discountAmount = (product.oldPrice * discount) / 100;
//                     const newPrice = product.oldPrice - discountAmount;
                    
//                     // Update the product
//                     await Products.findByIdAndUpdate(
//                         product._id,
//                         {
//                             discount: discount,
//                             price: newPrice,
//                             oldPrice: product.oldPrice
//                         },
//                         { session }
//                     );
//                 }
//             }
            
//             // Commit the transaction
//             await session.commitTransaction();
//             session.endSession();
            
//             return successResponse(res, 200, "Discount updated successfully", {
//                 category: updatedCategory,
//                 productsUpdated: products.length
//             });
//         } catch (error) {
//             // If an error occurred, abort the transaction
//             await session.abortTransaction();
//             session.endSession();
//             throw error;
//         }
//     } catch (error) {
//         return errorResponse(res, 500, "Failed to update discount", error);
//     }
// };
module.exports = {
    createNewCategory,
    getAllCategory,
    deleteCategoryById,
    addDiscount,
};