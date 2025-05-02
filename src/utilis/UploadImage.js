// const cloudinary = require("cloudinary").v2;

// cloudinary.config({
//   cloud_name: "ddyiapp5m",
//   api_key: "416225411258796",
//   api_secret: "rvW5ZZ6sBuSh-JybNpvpAB-TA40",
// });

// const opts = {
//   overwrite: true,
//   invalidate: true,
//   resource_type: "auto",
// };

// function uploadImagesToCloudinary(images) {
//   return new Promise((resolve, reject) => {
//     if (!images || images.length === 0) {
//       return reject({ message: "No images provided." });
//     }

//     const uploadPromises = images?.map((image) =>
//       cloudinary.uploader
//         .upload(image, opts)
//         .then((result) => result.secure_url) // Extract the secure URL from the result
//         .catch((error) => {
//           console.error(error.message); // Log the error
//           throw new Error(error.message); // Throw error to handle it in Promise.all
//         })
//     );

//     Promise.all(uploadPromises)
//       .then((urls) => {
//         // console.log(urls);
//         resolve(urls);
//       })
//       .catch((error) => reject({ message: error.message }));
//   });
// }

// module.exports = uploadImagesToCloudinary;import multer from 'multer';
const multer = require('multer');
const { storage } = require("./cloudinary"); // Make sure the path is correct

// Create multer instance with Cloudinary storage
// const upload = multer({ storage }).array('gallery', 5); // Use 'image' as the field name for a single file upload

// module.exports = { upload };