const express = require('express');
const { 
  
    createCodOrder,
    sslCommerzPaymentSuccess,
    confirmPayment, 
    applyCoupon,
    getOrdersByEmail, 
    getOrdersByOrderId, 
    getAllOrders, 
    updateOrderStatus, 
    deleteOrderById, 
    processCoinPayment,
    handleUserOrders,
    applyCoin
} = require('./order.controller');

const router = express.Router();

// Apply coupon
router.post('/apply-coupon', applyCoupon);
router.post('/apply-coins', applyCoin);
// // Create checkout sessions for different payment methods
// router.post('/create-stripe-session', makeStripePayment);
// router.post('/create-sslcommerz-session', makeSSLCommerzPayment);
router.post('/create-cod-order', createCodOrder);
router.post('/create-coin-order',  processCoinPayment);

// SSLCommerz callback routes
// router.post('/sslcommerz-payment-success', sslCommerzPaymentSuccess);
// router.post('/sslcommerz-payment-failed', (req, res) => res.redirect(`${process.env.BASE_URL}/payment-failed`));
// router.post('/sslcommerz-payment-canceled', (req, res) => res.redirect(`${process.env.BASE_URL}/payment-canceled`));
// router.post('/sslcommerz-ipn', (req, res) => res.send('IPN'));

// Confirm payment (for Stripe)
router.post("/confirm-payment", confirmPayment);
router.get('/user/:userId',handleUserOrders);
// Get orders by email address
router.get('/:email', getOrdersByEmail);

// Get orders by orderId
router.get('/order/:id', getOrdersByOrderId);

// Get all orders (admin only)
router.get('/', getAllOrders);

// Update order status (admin only)
router.patch("/update-order-status/:id", updateOrderStatus);

// Delete order (admin only)
router.delete("/delete-order/:id", deleteOrderById);

module.exports = router;