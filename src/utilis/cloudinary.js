// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// // Configure Cloudinary
// cloudinary.config({
//     cloud_name: "ddyiapp5m",
//     api_key: "416225411258796",
//     api_secret: "rvW5ZZ6sBuSh-JybNpvpAB-TA40",
// });

// // Set up multer storage with Cloudinary
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'your_folder_name', // Optional: specify a folder in Cloudinary
//         allowedFormats: ['jpg', 'jpeg', 'png'], // Optional: file types
//         transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional: image transformations
//     }
// });

// // Initialize multer with Cloudinary storage
// const upload = multer({ storage: storage });

// // Export the upload instance to be used in routes
// module.exports = { upload };


const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
const multer = require('multer');
dotenv.config();

// Cloudinary configuration
cloudinary.config({
    cloud_name: "ddyiapp5m",
    api_key: "416225411258796",
    api_secret: "rvW5ZZ6sBuSh-JybNpvpAB-TA40",
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "uploads",
        format: async(req, file) => "jpg",
        public_id: (req, file) => file.originalname.split(".")[0],
    },
});

// Multer configuration for handling multiple file uploads
const upload = multer({ storage: storage });

// Export the upload function for handling multiple files
module.exports = {
    upload,
    uploadMultiple: upload.array('gallery', 10), // Allows uploading up to 10 images at once
};