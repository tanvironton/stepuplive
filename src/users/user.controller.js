const generateToken = require("../middleware/generateToken");
const { successResponse, errorResponse } = require("../utilis/responseHandler");
const User = require("./user.model");

// user registration
const userRegistration = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = new User({ username, email, password });
    await user.save();
    res.status(200).send({ message: "Registration successful!" });
  } catch (error) {
    console.error("Error resgistering a user ", error);
    res.status(500).send({ message: "Registration failed!" });
  }
};

// user login
const userLoggedIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid Password!" });
    }
    const token = await generateToken(user._id);

    let cookieOpt = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    res.cookie("token", token);
    res.status(200).send({
      message: "Logged in successfully!",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession,
        coin:user.coin,
      },
    });
  } catch (error) {
    console.error("Error Login user ", error);
    res.status(500).send({ message: "Login failed!" });
  }
};

const userLogout = async (req, res) => {
  try {
    res.clearCookie("token");

    // res.status(200).send({ message: "Logged out successfully!" });
    successResponse(res, 200, "Logged out successfully!");
  } catch (error) {
    errorResponse(res, 500, "Logged out failed!", error);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "email role").sort({ createdAt: -1 });
    successResponse(
      res,
      200,
      "All users fetched successfully!",
      (data = users)
    );
  } catch (error) {
    errorResponse(res, 500, "Failed to fetch all users!", error);
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, 404, "User not found!");
    }

    return successResponse(res, 200, "Users deleted successfully!");
  } catch (error) {
    errorResponse(res, 500, "Failed to delete user!", error);
  }
};

const getSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, "User not found!");
    }

    return successResponse(res, 200, "User retrieved successfully!", user);
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve user!", error);
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: role },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found!");
    }

    return successResponse(
      res,
      200,
      "User role update successfully!",
      (data = updatedUser)
    );
  } catch (error) {
    errorResponse(res, 500, "Failed to update user role!", error);
  }
};

const editUserProfile = async (req, res) => {
  const { id } = req.params;
  const { username, profileImage, bio, profession } = req.body;

  try {
    const updateFields = {
      username,
      profileImage,
      bio,
      profession,
    };
    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });
    // console.log(updatedUser)
    if (!updatedUser) {
      return errorResponse(res, 404, "User not found!");
    }

    return successResponse(
      res,
      200,
      "User profile updated successfully!",
      (data = {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        bio: updatedUser.bio,
        profession: updatedUser.profession,
      })
    );
  } catch (error) {
    errorResponse(res, 500, "Failed to update user profile!", error);
  }
};

module.exports = {
  userRegistration,
  userLoggedIn,
  userLogout,
  getAllUsers,
  deleteUser,
  updateUserRole,
  editUserProfile,
  getSingleUser
};
