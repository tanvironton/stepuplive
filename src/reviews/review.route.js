const express = require('express');
const { postAReview,  getTotalReviewsCount, getReviewsByProductId } = require('./review.controller');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// post a review
router.post("/post-review",  postAReview);


// review counts 
router.get("/total-reviews", getTotalReviewsCount )

// get review data for user
router.get('/:productId', getReviewsByProductId);;


module.exports =router;