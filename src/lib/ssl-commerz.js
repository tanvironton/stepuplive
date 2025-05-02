const SSLCommerzPayment = require("sslcommerz-lts");
const User = require("../users/user.model");
const crypto = require("crypto");
const Order = require("../orders/order.model"); // Import Order model

const store_id = "stepu6741ba7cac6df";
const store_passwd = "stepu6741ba7cac6df@ssl";
const is_live = false; // Set to true for live environment

const sslPaymentController = async(req, res) => {
    // Extract data from request body matching the structure from CheckoutPage
    const { products, userId, customer_info, discount, totalAmount, couponCode } = req.body;
    
    if (!products || !userId || !customer_info) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Use the provided totalAmount or calculate it
    const calculatedTotal = products.reduce(
        (acc, curr) => acc + curr.price * curr.quantity,
        0
    ) || 0;
    
    const finalAmount = totalAmount || calculatedTotal;
    const discountAmount = discount || 0;
    
    // Get product names for the transaction
    const productNames = products.map((product) => product.name).join(", ");
    const tran_id = crypto.randomUUID().toString();

    // Find the user by ID
    const user = await User.findOne({ _id: userId });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Use customer_info from the request or fallback to user data
    const customerName = customer_info.first_name 
        ? `${customer_info.first_name} ${customer_info.last_name || ''}`
        : user.username;
    
    const customerEmail = customer_info.email || user.email;
    const customerPhone = customer_info.phone || "01711111111";
    
    // Get address information from customer_info
    const addressLine = customer_info.address || "";
    const city = customer_info.city || "Dhaka";
    const state = customer_info.state || "Dhaka";
    const postalCode = customer_info.postalCode || "1000";
    const country = "Bangladesh";

    // Create payment data for SSLCommerz
    const data = {
        total_amount: finalAmount,
        currency: "BDT", // Use BDT as default currency for Bangladesh
        tran_id: tran_id, // Use a unique transaction ID for each payment
        success_url: `${process.env.FRONTEND_URL || 'https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app'}/payment-success/${tran_id}`,
        fail_url: `${process.env.FRONTEND_URL || 'https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app'}/fail`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app'}/cancel`,
        ipn_url: `${process.env.FRONTEND_URL || 'https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app'}/ipn`,
        shipping_method: "Courier",
        product_name: productNames,
        product_category: "Fashion",
        product_profile: "general",
        cus_name: customerName,
        cus_email: customerEmail,
        cus_add1: addressLine,
        cus_add2: "",
        cus_city: city,
        cus_state: state,
        cus_postcode: postalCode,
        cus_country: country,
        cus_phone: customerPhone,
        cus_fax: customerPhone,
        ship_name: customerName,
        ship_add1: addressLine,
        ship_add2: "",
        ship_city: city,
        ship_state: state,
        ship_postcode: postalCode,
        ship_country: country,
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    sslcz.init(data).then((apiResponse) => {
        let GatewayPageURL = apiResponse.GatewayPageURL;

        // After successfully getting the Gateway URL, save the order to the database
        const order = new Order({
            userId: userId,
            orderId: tran_id,
            products: products.map(product => ({
                productId: product._id,
                quantity: product.quantity,
            })),
            email: customerEmail,
            amount: finalAmount,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            couponApplied: couponCode || null,
            transaction_id: tran_id,
            paymentMethod: "sslcommerz",
            payment_status: false, // Initially, payment status is false
            address: addressLine,
            status: "pending", // Order status is pending until payment is confirmed
        });

        // Save order to the database
        order.save()
            .then(() => {
                // Return the payment gateway URL to the frontend for redirection
                res.status(200).json({ url: GatewayPageURL });
            })
            .catch((error) => {
                console.error("Error saving order to database:", error);
                res.status(500).json({ message: "Failed to save order", error: error.message });
            });
    }).catch((error) => {
        console.error("Error initializing SSLCommerz payment:", error);
        res.status(500).json({ message: "Error initializing payment", error: error.message });
    });
};

const sslPaymentValidate = async (req, res) => {
    // For payment validation from success URL
    // Extract transaction ID from params if it's available
    const tran_id = req.params.tran_id || (req.body && req.body.tran_id);
    
    if (!tran_id) {
        return res.status(400).json({ message: "Transaction ID is required" });
    }
    
    try {
        // If there's a val_id in the request body, validate with SSLCommerz
        if (req.body && req.body.val_id) {
            const data = { val_id: req.body.val_id };
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
            
            const validationResponse = await sslcz.validate(data);
            console.log("Validation response:", validationResponse);
            
            // Use tran_id from the validation response if available
            const transactionId = validationResponse.tran_id || tran_id;
            
            // Update order status
            updateOrderStatus(transactionId, res);
        } else {
            // If no val_id (direct access to success URL), just update the order
            updateOrderStatus(tran_id, res);
        }
    } catch (error) {
        console.error("Error in payment validation:", error);
        res.status(500).json({ message: "Error validating payment", error: error.message });
    }
};

// Helper function to update order status
async function updateOrderStatus(tran_id, res) {
    try {
        const order = await Order.findOne({ 
            $or: [
                { transaction_id: tran_id },
                { orderId: tran_id }
            ]
        });
        
        if (order) {
            order.payment_status = true;
            order.status = "processing";
            
            await order.save();
            
            // Redirect to the frontend success page
            const redirectUrl = `${process.env.FRONTEND_URL || 'https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app'}/payment-success/${tran_id}`;
            
            // Check if this is an API response or redirect
            if (res.headersSent) {
                return;
            }
            
            if (res.redirect) {
                res.redirect(redirectUrl);
            } else {
                res.status(200).json({ 
                    success: true, 
                    message: "Payment validated successfully",
                    redirectUrl
                });
            }
        } else {
            console.error("Order not found for transaction ID:", tran_id);
            const errorUrl = `${process.env.FRONTEND_URL || 'https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app'}/fail`;
            
            if (res.redirect) {
                res.redirect(errorUrl);
            } else {
                res.status(404).json({ message: "Order not found" });
            }
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Error updating order status", error: error.message });
    }
}

module.exports = {
    sslPaymentController,
    sslPaymentValidate,
};
