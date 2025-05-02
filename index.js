const express = require("express");
const app = express();
const port = process.env.PORT || 5100;
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { sslPaymentController, sslPaymentValidate } = require("./src/lib/ssl-commerz"); // Correct import path
app.use(bodyParser.json());

// middleware
app.use(express.json({ limit: "10mb" }));
app.use(
    cors({
        origin: [
            "https://stepupfront.vercel.app/",
            "https://681503a96aa0c51aa94c1e06--verdant-churros-839c09.netlify.app",
            "https://courageous-fox-119ac5.netlify.app/"
            "http://localhost:5173",
            // "http://100.117.109.6:5173",
            // "https://step-up-nu.vercel.app",
        ], // updatesgfsgd
        credentials: true,
    })
);

// app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' })); // 50mb limit for JSON
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// const UploadImage = require("./src/utilis/UploadImage");

// routes
const userRoutes = require("./src/users/user.route");
const productsRoutes = require("./src/products/product.route");
const reviewsRoutes = require("./src/reviews/review.route");
const ordersRoutes = require("./src/orders/order.route");
const statsRoutes = require("./src/stats/stats.route");
const categoriesRoutes = require("./src/products/categories/category.route");
const sizeRoutes = require("./src/products/size/size.route");
const uploadImagesToCloudinary = require("./src/utilis/UploadImage");
// const sslPayemntController = require("./src/lib/ssl-commerz");
const colorRoutes = require("./src/products/color/color.router");
const contactRoutes = require("./src/Contacts/ContactRoute")
const coinRouter=require("./src/coins/CoinRoute")
const couponRouter=require("./src/coopone/cooponerouter")
app.use("/api/auth", userRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api", contactRoutes);
app.use("/api/coin", coinRouter);
app.use("/api/coupons",couponRouter);


// ssl commerz
app.post("/init", sslPaymentController); // Corrected: Use the controller directly
app.post("/payment-success/:tran_id", sslPaymentValidate);

async function main() {
    await mongoose.connect(process.env.UB_URL);

    app.get("/", (req, res) => {
        res.send("Step-Up E-commerce Server is running!");
    });
}

main()
    .then(() => console.log("Mongodb connected successfuly!"))
    .catch((err) => console.log(err));

// upload image api
app.post("/uploadImage", (req, res) => {
    // console.log(req.body.image);

    uploadImagesToCloudinary(req.body.image)
        .then((url) => res.send(url))
        .catch((error) => res.status(500).send(error));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

//
