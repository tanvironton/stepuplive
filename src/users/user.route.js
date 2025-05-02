const express = require("express");
const {
    userRegistration,
    userLoggedIn,
    userLogout,
    getAllUsers,
    deleteUser,
    updateUserRole,
    editUserProfile,
    getSingleUser,
} = require("./user.controller");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const router = express.Router();

// register endpoint
router.post("/register", userRegistration);

// login routes
router.post("/login", userLoggedIn);

// logout endpoint
router.post("/logout", userLogout);

// get all users endpoints (token verify and admin)
router.get("/users", getAllUsers);

// delete user endpoint (only admin)
router.delete("/users/:id", deleteUser);
// delete user endpoint (only admin)
router.get("/users/:id", getSingleUser);
// update user role(by admin)
router.put("/users/:id", updateUserRole);

// edit user profile
router.patch("/edit-profile/:id", editUserProfile);

module.exports = router;