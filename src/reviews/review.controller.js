const Products = require("../products/product.model");
const { errorResponse, successResponse } = require("../utilis/responseHandler");
const Reviews = require("./review.model");
const Orders =require("../orders/order.model")
const mongoose = require('mongoose');
// const postAReview = async (req, res) => {
//     try {
//         const {comment, rating, userId, productId} = req.body;

//         if(!comment || rating === undefined || !productId || !userId){
//             return errorResponse(res, 400, "Missing required fields")
//         }

//         const existingReview = await Reviews.findOne({productId, userId});
//         if(existingReview) {
//             existingReview.comment = comment;
//             existingReview.rating = rating;
//             await existingReview.save();
//         } else {
//             const newReview = new Reviews({
//                 comment, rating, userId, productId
//             })

//             await newReview.save();
//         }

//         const reviews = await Reviews.find({productId}).sort({updatedAt: -1});

//         if(reviews.length > 0) {
//             const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
//             const averageRating =  totalRating / reviews.length;

//             const product =  await Products.findById(productId);

//             if(product) {
//                 product.rating =  averageRating;
//                 await product.save({validateBeforeSave: false})
//             } else {
//                 return errorResponse(res, 404, "Product not found")
//             }
//         }

//         return successResponse(res, 200, "Review posted successfully", reviews)
        
//     } catch (error) {
//         return errorResponse(res, 500, "Failed to post a review", error)
//     }
// }
const postAReview = async (req, res) => {
    try {
      // OPTION 1: If you're not using authentication middleware yet
      // Get userId directly from the request body
      const { productId, rating, comment, userId } = req.body;
  
      // OPTION 2: If you ARE using authentication but it might not be set up correctly
      // const { productId, rating, comment } = req.body;
      // const userId = req.user ? req.user._id : req.body.userId;
      
      // Validate required fields
      if (!productId || !rating || !comment || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product ID, rating, comment and user ID are required' 
        });
      }
  
      // Validate rating is between 1 and 5
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
  
      // Check if product ID is valid
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }
  
      // Check if user has purchased this product with a completed order
      const orders = await Orders.find({ // Changed from Orders to Order
        userId: userId,
        status: "completed",
        "products.productId": productId
      });
  
      if (orders.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only review products you have purchased with completed orders'
        });
      }
  
      // Check if user has already reviewed this product
      const existingReview = await Reviews.findOne({
        userId: userId,
        productId: productId
      });
  
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }
  
      // Create and save the review
      const newReview = new Reviews({ // Changed from Reviews to Review
        userId,
        productId,
        rating,
        comment
      });
  
      await newReview.save();
  
      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        review: newReview
      });
  
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit review',
        error: error.message
      });
    }
  };
  
  

  const getReviewsByProductId = async (req, res) => {
    try {
      const { productId } = req.params; // Get productId from URL parameters
      
      // Validate that productId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format'
        });
      }
  
      // Find all reviews for the specified product
      const reviews = await Reviews.find({ productId })
        .populate('userId', 'name email profile_img') // Populate user details (adjust fields as needed)
        .sort({ createdAt: -1 }); // Sort by newest first
      
      // Get average rating
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
  
      // Return the reviews along with metadata
      return res.status(200).json({
        success: true,
        reviews,
        metadata: {
          totalReviews,
          avgRating: parseFloat(avgRating.toFixed(1))
        }
      });
  
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews',
        error: error.message
      });
    }
  };

const getTotalReviewsCount =  async (req, res) => {
    try {
        const totalReviews = await Reviews.countDocuments({});
        return successResponse(res, 200, "Total reviews fetched successfully", totalReviews)
    } catch (error) {
        return errorResponse(res, 500, "Failed to get users review", error)
    }
}

module.exports = {
    postAReview,
    getReviewsByProductId ,
    getTotalReviewsCount
}