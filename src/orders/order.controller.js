const { CoinSetting } = require("../coins/CoinModel");
const User = require("../users/user.model");
// const { BASE_URL } = require("../utilis/baseURL");
const { errorResponse, successResponse } = require("../utilis/responseHandler");
const Order = require("./order.model");
const Coupon = require("../coopone/cooponmodel");
const mongoose = require("mongoose");

// const SSLCommerzPayment = require('sslcommerz-lts'); // Make sure to install this package

// // Initialize SSLCommerz
// const store_id = process.env.SSLCOMMERZ_STORE_ID;
// const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
// const is_live = process.env.NODE_ENV === 'production'; // true for live, false for sandbox

// Validate coupon function
const validateCoupon = async (couponCode, userId) => {
    if (!couponCode) return { valid: false, message: "No coupon provided" };

    try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        
        if (!coupon) {
            return { valid: false, message: "Invalid coupon code" };
        }
        
        if (!coupon.isValid()) {
            return { valid: false, message: "Coupon has expired or is not active" };
        }
        
        // Check if user has already used this coupon
        if (coupon.usedBy.includes(userId)) {
            return { valid: false, message: "You have already used this coupon" };
        }
        
        return { valid: true, coupon };
    } catch (error) {
        console.error("Coupon validation error:", error);
        return { valid: false, message: "Error validating coupon" };
    }
};

// Calculate final price with coupon
const calculateFinalPrice = (totalAmount, coupon) => {
    if (!coupon) return { discountAmount: 0, finalAmount: totalAmount };
    
    const discountAmount = (totalAmount * coupon.discountPercentage) / 100;
    const finalAmount = totalAmount - discountAmount;
    
    return { discountAmount, finalAmount };
};

// Create order function
const createOrder = async (orderData, session = null) => {
    try {
        const order = new Order(orderData);
        if (session) {
            await order.save({ session });
        } else {
            await order.save();
        }
        return order;
    } catch (error) {
        throw new Error(`Failed to create order: ${error.message}`);
    }
};




const applyCoin = async (req, res) => {
    const { userId, coins, orderAmount } = req.body;
    console.log(coins);
    
    if (!userId || !orderAmount || !coins) {
      return res.status(400).json({
        success: false,
        message: "User ID, order amount, and coins to apply are required"
      });
    }
    
    // Validate coins is a number and greater than 0
    if (isNaN(coins) || coins <= 0) {
      return res.status(400).json({
        success: false,
        message: "Coins to apply must be a positive number"
      });
    }
    
    try {
      // Get user details to check available coins
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Calculate remaining user coins after applying
      let totaluserCoin = user.coin - coins;
      
      // Check if user has at least 100 coins
      if (user.coin < 100) {
        return res.status(400).json({
          success: false,
          message: "You need at least 100 coins to apply coins to your purchase"
        });
      }
      
      // Check if user has sufficient coins
      if (user.coin < coins) {
        return res.status(400).json({
          success: false,
          message: `You only have ${user.coin} coins available`
        });
      }
      
      // Calculate discount amount (1 coin = 1 unit of currency)
      const discountAmount = coins;
      
      // Calculate final amount after discount
      let finalAmount = orderAmount - discountAmount;
      
      // Make sure final amount doesn't go below zero
      if (finalAmount < 0) {
        finalAmount = 0;
      }
      
      // Update user's coin balance
      user.coin = totaluserCoin;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: "Coins applied successfully",
        discountAmount,
        finalAmount,
        remainingCoins: totaluserCoin
      });
      
    } catch (error) {
      console.error("Error applying coins:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to apply coins",
        error: error.message
      });
    }
  };
// Apply coupon to cart
const applyCoupon = async (req, res) => {
    const { couponCode, cartTotal, userId } = req.body;
    
    if (!couponCode || !cartTotal || !userId) {
        return errorResponse(res, 400, "Coupon code, cart total, and user ID are required");
    }
    
    try {
        const couponResult = await validateCoupon(couponCode, userId);
        
        if (!couponResult.valid) {
            return errorResponse(res, 400, couponResult.message);
        }
        
        const { discountAmount, finalAmount } = calculateFinalPrice(cartTotal, couponResult.coupon);
        
        return successResponse(res, 200, "Coupon applied successfully", {
            coupon: couponResult.coupon,
            discountAmount,
            finalAmount
        });
    } catch (error) {
        return errorResponse(res, 500, "Failed to apply coupon", error);
    }
};

// // Stripe payment
// const makeStripePayment = async (req, res) => {
//     const { products, userId, couponCode, email, address } = req.body;
    
//     if (!products || !userId || !email || !address) {
//         return errorResponse(res, 400, "Products, userId, email, and address are required");
//     }
    
//     try {
//         // Calculate total amount
//         let totalAmount = products.reduce((sum, product) => {
//             return sum + (product.price * product.quantity);
//         }, 0);
        
//         // Apply coupon if provided
//         let couponResult = { valid: false };
//         let discountAmount = 0;
//         let finalAmount = totalAmount;
//         let couponId = null;
        
//         if (couponCode) {
//             couponResult = await validateCoupon(couponCode, userId);
//             if (couponResult.valid) {
//                 const calculation = calculateFinalPrice(totalAmount, couponResult.coupon);
//                 discountAmount = calculation.discountAmount;
//                 finalAmount = calculation.finalAmount;
//                 couponId = couponResult.coupon._id;
//             }
//         }
        
//         const lineItems = products.map((product) => ({
//             price_data: {
//                 currency: "usd",
//                 product_data: {
//                     name: product.name,
//                     images: [product.image],
//                 },
//                 unit_amount: Math.round(product.price * 100),
//             },
//             quantity: product.quantity,
//         }));

//         const session = await stripe.checkout.sessions.create({
//             line_items: lineItems,
//             payment_method_types: ["card"],
//             mode: "payment",
//             success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${BASE_URL}/cancel`,
//             metadata: {
//                 userId,
//                 email,
//                 discountAmount,
//                 finalAmount,
//                 couponId: couponId ? couponId.toString() : "",
//                 address: JSON.stringify(address)
//             }
//         });
        
//         res.json({ id: session.id, finalAmount });
//     } catch (error) {
//         return errorResponse(res, 500, "Failed to create payment session", error);
//     }
// };

// SSLCommerz payment
// const makePaymentRequest = async(req, res) => {
//     const { products, userId } = req.body;
//     console.log(products, userId);
//     try {
//         const lineItems = products.map((product) => ({
//             price_data: {
//                 currency: "usd",
//                 product_data: {
//                     name: product.name,
//                     images: [product.image],
//                 },
//                 unit_amount: Math.round(product.price * 100),
//             },
//             quantity: product.quantity,
//         }));

//         const session = await stripe.checkout.sessions.create({
//             line_items: lineItems,
//             payment_method_types: ["card"],
//             mode: "payment",
//             //success?session_id={CHECKOUT_SESSION_ID}
//             success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${BASE_URL}/cancel`,
//         });
//         res.json({ id: session.id })
//     } catch (error) {
//         return errorResponse(res, 500, "Failed to create payment session", error);
//     }
// };

// Cash on Delivery order
const createCodOrder = async (req, res) => {
    const { products, userId, customer_info, discount, totalAmount, paymentMethod, couponCode } = req.body;
    
    if (!products || !userId || !customer_info || !customer_info.email || !customer_info.address) {
      return errorResponse(res, 400, "Products, userId, email, and address are required");
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Calculate total amount
      let calculatedTotal = products.reduce((sum, product) => {
        return sum + (product.price * product.quantity);
      }, 0);
      
      // Use provided totalAmount or calculated one
      let orderTotalAmount = totalAmount || calculatedTotal;
      
      // Apply coupon if provided
      let couponResult = { valid: false };
      let discountAmount = discount || 0;
      let finalAmount = orderTotalAmount - discountAmount;
      let couponId = null;
      
      if (couponCode) {
        couponResult = await validateCoupon(couponCode, userId);
        if (couponResult.valid) {
          const calculation = calculateFinalPrice(orderTotalAmount, couponResult.coupon);
          discountAmount = calculation.discountAmount;
          finalAmount = calculation.finalAmount;
          couponId = couponResult.coupon._id;
        }
      }
      
      // Create order
      const order = await createOrder({
        userId,
        orderId: new mongoose.Types.ObjectId().toString(),
        payment_status:true,
        products: products.map(product => ({
          productId: product._id,
          quantity: product.quantity
        })),
        email: customer_info.email,
        amount: orderTotalAmount,
        discountAmount,
        finalAmount,
        couponApplied: couponId,
        paymentMethod: "cod",
        payment_status: true,
        address: customer_info.address,
        status: "pending"
      }, session);
      
      // If coupon was used, add user to usedBy array
      if (couponId) {
        await Coupon.findByIdAndUpdate(
          couponId, 
          { $push: { usedBy: userId } },
          { session }
        );
      }
      
      await session.commitTransaction();
      session.endSession();
      
      return successResponse(res, 200, "COD order created successfully", order);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 500, "Failed to create COD order", error);
    }
  };



 const processCoinPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { 
        userId, 
        products, 
        email, 
        amount, 
        couponId, 
        address 
      } = req.body;
  
      // Find user
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Calculate total amount
      let discountAmount = 0;
      let finalAmount = amount;
  
      // Apply coupon if provided
      if (couponId) {
        const coupon = await Coupon.findById(couponId).session(session);
        
        if (!coupon || !coupon.isValid()) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: 'Invalid coupon' });
        }
  
        // Check if user already used this coupon
        if (coupon.usedBy.includes(userId)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: 'Coupon already used by this user' });
        }
  
        discountAmount = amount * (coupon.discountPercentage / 100);
        finalAmount = amount - discountAmount;
  
        // Add user to usedBy array
        coupon.usedBy.push(userId);
        await coupon.save({ session });
      }
  
      // Check if user has enough coins
      if (user.coin < finalAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient coins for purchase',
          availableCoins: user.coin,
          requiredCoins: finalAmount
        });
      }
      
      // Deduct coins from user
      user.coin -= finalAmount;
      const transaction_id = `COIN-${Date.now()}-${userId.substring(0, 5)}`;
      
      // Calculate coins earned (5% of purchase)
      const coinsEarned = Math.floor(finalAmount * 0.05);
      
      // Add earned coins to user account
      user.coin += coinsEarned;
  
      // Create new order
      const newOrder = new Order({
        userId,
        orderId: `ORD-${Date.now()}-${userId.substring(0, 5)}`,
        products,
        email,
        amount,
        discountAmount,
        finalAmount,
        couponApplied: couponId || null,
        paymentMethod: 'coin',
        transaction_id,
        payment_status: true, // Coin payments are always complete
        address,
        coinsEarned
      });
  
      await newOrder.save({ session });
      await user.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
  
      return res.status(201).json({
        success: true,
        message: 'Coin payment processed successfully',
        order: newOrder,
        userCoinsRemaining: user.coin,
        coinsSpent: finalAmount,
        coinsEarned
      });
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: 'Error processing coin payment',
        error: error.message
      });
    }
  };

const confirmPayment = async(req, res) => {
    const { session_id } = req.body;
    if (!session_id) return errorResponse(res, 400, "Session ID is required");

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ["line_items", "payment_intent"],
        });

        if (!session || !session.payment_intent) {
            return errorResponse(res, 400, "Invalid payment session");
        }

        const paymentIntentId = session.payment_intent.id;
        let order = await Order.findOne({ orderId: paymentIntentId });

        if (!order) {
            const metadata = session.metadata;
            const userId = metadata.userId;
            const email = metadata.email;
            const discountAmount = parseFloat(metadata.discountAmount || 0);
            const finalAmount = parseFloat(metadata.finalAmount);
            const couponId = metadata.couponId ? metadata.couponId : null;
            const address = JSON.parse(metadata.address);
            
            const lineItems = session.line_items.data.map((item) => ({
                productId: item.price.product_data.metadata?.productId || "unknown",
                quantity: item.quantity || 0,
            })) || [];

            order = new Order({
                userId,
                orderId: paymentIntentId,
                products: lineItems,
                email,
                amount: finalAmount + discountAmount,
                discountAmount,
                finalAmount,
                couponApplied: couponId,
                paymentMethod: "stripe",
                transaction_id: paymentIntentId,
                payment_status: session.payment_intent.status === "succeeded",
                address,
                status: "pending",
            });

            await order.save();
            
            // If coupon was used, add user to usedBy array
            if (couponId) {
                await Coupon.findByIdAndUpdate(couponId, { $push: { usedBy: userId } });
            }
        } else {
            order.status = session.payment_intent.status === "succeeded" ? "pending" : "cancelled";
            order.payment_status = session.payment_intent.status === "succeeded";
            await order.save();
        }

        return successResponse(res, 200, "Order confirmed successfully", order);
    } catch (error) {
        console.error("Payment confirmation error:", error);
        return errorResponse(res, 500, "Failed to confirm payment", error);
    }
};

const getOrdersByEmail = async(req, res) => {
    const email = req.params.email;
    try {
        if (!email) {
            return errorResponse(res, 400, "Email is required")
        }
        const orders = await Order.find({ email })
            .populate("couponApplied")
            .populate("products.productId")
            .sort({ createdAt: -1 });
            
        if (orders.length === 0 || !orders) {
            return errorResponse(res, 404, "No orders found for this email")
        }
        return successResponse(res, 200, "Orders fetched successfully", orders)
    } catch (error) {
        return errorResponse(res, 500, "Failed to get orders", error)
    }
}

const getOrdersByOrderId = async(req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("userId")
            .populate("couponApplied")
            .populate("products.productId");

        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        return successResponse(res, 200, "Order fetched successfully", order);
    } catch (error) {
        return errorResponse(res, 500, "Failed to get order", error);
    }
};

const getAllOrders = async(req, res) => {
    try {
        const orders = await Order.find()
            .populate("couponApplied")
            .sort({ createdAt: -1 });
            
        if (orders.length === 0 || !orders) {
            return errorResponse(res, 404, "No orders found")
        }
        return successResponse(res, 200, "Orders fetched successfully", orders)
    } catch (error) {
        return errorResponse(res, 500, "Failed to get all orders", error)
    }
}

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
      return errorResponse(res, 400, "Status is required");
  }
  
  let session;
  
  try {
      // Start a transaction
      session = await mongoose.startSession();
      session.startTransaction();
      
      // Update the order status
      const updatedOrder = await Order.findByIdAndUpdate(
          id,
          { status, updatedAt: Date.now() },
          {
              new: true,
              runValidators: true,
              session
          }
      ).populate('userId');
      
      if (!updatedOrder) {
          await session.abortTransaction();
          session.endSession();
          return errorResponse(res, 404, "Order not found");
      }
      
      // Track coins awarded
      let coinsEarned = 0;
      
      // Only calculate and award coins if the status is "completed"
      if (status === "completed") {
          try {
              // Get the current coin settings - using lean() for better performance
              const coinSettings = await CoinSetting.findOne().session(session).lean();
              
              if (!coinSettings) {
                  console.log("No coin settings found");
                  // Don't abort transaction, just continue without awarding coins
              } else {
                  const minimumOrderAmount = coinSettings.minimumOrderAmount || 0;
                  const orderAmount = updatedOrder.finalAmount || 0;
                  
                  console.log("Order amount:", orderAmount);
                  console.log("Minimum amount:", minimumOrderAmount);
                  
                  // Calculate coins only if the order amount exceeds minimum order amount
                  if (orderAmount > minimumOrderAmount) {
                      // Calculate eligible amount (amount above the minimum threshold)
                      const eligibleAmount = orderAmount - minimumOrderAmount;
                      
                      // Calculate coins (1 coin per 100 units), rounded down
                      coinsEarned = Math.floor(eligibleAmount / 100);
                      console.log("Coins earned:", coinsEarned);
                      
                      if (coinsEarned > 0) {
                          // Update the order with coins earned
                          updatedOrder.coinsEarned = coinsEarned;
                          await updatedOrder.save({ session });
                          
                          // Check if we have a valid userId
                          const userId = updatedOrder.userId?._id || updatedOrder.userId;
                          
                          if (userId) {
                              // Update user's coin balance
                              const user = await User.findById(userId).session(session);
                              
                              if (user) {
                                  // Add the earned coins to user's current balance
                                  user.coin = parseInt(user.coin || 0) + parseInt(coinsEarned);
                                  await user.save({ session });
                                  console.log("Updated user coins to:", user.coin);
                              }
                          }
                      }
                  }
              }
          } catch (coinError) {
              console.error("Error in coin calculation:", coinError);
              // Don't abort transaction for coin errors, continue with status update
          }
      }
      
      // Commit the transaction
      await session.commitTransaction();
      
      return successResponse(res, 200, "Order status updated successfully", {
          order: updatedOrder,
          coinsAwarded: coinsEarned
      });
  } catch (error) {
      // If an error occurs, abort the transaction
      if (session) {
          try {
              await session.abortTransaction();
          } catch (abortError) {
              console.error("Error aborting transaction:", abortError);
          }
      }
      
      console.error("Error updating order status:", error);
      return errorResponse(res, 500, "Failed to update order status", error.message);
  } finally {
      // Ensure session is ended even if there's an error
      if (session) {
          session.endSession();
      }
  }
};

const deleteOrderById = async(req, res) => {
    const { id } = req.params;
    try {
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) {
            return errorResponse(res, 404, "Order not found")
        }
        return successResponse(res, 200, "Order deleted successfully", deletedOrder)
    } catch (error) {
        return errorResponse(res, 500, "Failed to delete order", error)
    }
}


const handleUserOrders = async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, orderId } = req.query;
      
      // If action is "complete", mark the specified order as complete
      if (action === "complete" && orderId) {
        const order = await Order.findOne({ _id: orderId, userId });
        
        if (!order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found or does not belong to this user'
          });
        }
        
        // Check if order can be marked as complete
        if (order.status === 'cancelled') {
          return res.status(400).json({
            success: false,
            message: 'Cannot mark a cancelled order as complete'
          });
        }
        
        order.status = 'completed';
        await order.save();
        
        return res.status(200).json({
          success: true,
          message: 'Order marked as complete',
          data: order
        });
      }
      
      // Default behavior: Get only completed orders for the user
      const completedOrders = await Order.find({ 
        userId, 
        status: 'completed'  // Only show orders with completed status
      })
        .populate('products.productId')
        .populate('couponApplied')
        .sort({ createdAt: -1 });
      
      if (!completedOrders.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'No completed orders found for this user' 
        });
      }
      
      return res.status(200).json({
        success: true,
        count: completedOrders.length,
        data: completedOrders
      });
      
    } catch (error) {
      console.error('Error handling user orders:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  };
module.exports = {
    applyCoin,
     handleUserOrders,
    createCodOrder,
    processCoinPayment,
    confirmPayment,
    applyCoupon,
    getOrdersByEmail,
    getOrdersByOrderId,
    getAllOrders,
    updateOrderStatus,
    deleteOrderById
};