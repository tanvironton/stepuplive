
const express = require("express");
const router = express.Router();
const {createCoupon,applyCoupon,getAllCoupons,updateCoupon,deleteCoupon} = require("./coponecontroller");

router.post("/create", createCoupon);
router.get("/", getAllCoupons);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);
router.post("/apply", applyCoupon);

module.exports = router;