const Reviews = require("../reviews/review.model");
const { errorResponse, successResponse } = require("../utilis/responseHandler");
const Products = require("./product.model");
const mongoose = require("mongoose");

const createNewProduct = async(req, res) => {
  try {
    // Check if req.files exists and is an array
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, "At least one product image is required.");
    }
    
    // Map over the files to get their paths
    const images = req.files.map(file => file.path);
    
    // Initialize discount as 0 by default
    let discount ;
    const { name, price, oldPrice, color, sizeStock, category, sizes } = req.body;
    
    // Check for required fields
    if (!category) {
      return errorResponse(res, 400, "Category is required.");
    }
    
    if (!color) {
      return errorResponse(res, 400, "Color is required.");
    }

    if (!sizes || (Array.isArray(sizes) && sizes.length === 0)) {
      return errorResponse(res, 400, "At least one size is required.");
    }
    
    // Check if a product with the same name already exists
    const existingProduct = await Products.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingProduct) {
      return errorResponse(res, 409, "A product with this name already exists. Product names must be unique.");
    }
    
    // Calculate discount if applicable - auto calculate if oldPrice exists and is greater than price
    if (oldPrice && price && oldPrice > price) {
      discount = ((oldPrice - price) / oldPrice) * 100;
      discount = Math.round(discount);
    } else {
      discount = 0;
    }
    
    // IMPROVED COLOR HANDLING - Accept either a color ID or a JSON object
    let processedColor;
    try {
      // Check if it's a valid MongoDB ObjectId string
      if (typeof color === 'string' && color.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a valid ObjectId, use it directly
        processedColor = color;
      } else if (typeof color === 'string') {
        // Try to parse as JSON
        const parsed = JSON.parse(color);
        // If it has an _id field, use that
        processedColor = parsed._id || parsed;
      } else {
        // It's already an object
        processedColor = color._id || color;
      }
    } catch (error) {
      return errorResponse(res, 400, "Invalid color format. Expected color ID or JSON object.");
    }
    
    // Parse sizes from the request body if needed
    let parsedSizes;
    try {
      if (typeof sizes === 'string') {
        parsedSizes = JSON.parse(sizes);
      } else {
        parsedSizes = sizes;
      }
      
      // Ensure parsedSizes is an array
      if (!Array.isArray(parsedSizes)) {
        parsedSizes = [parsedSizes];
      }
    } catch (error) {
      return errorResponse(res, 400, "Invalid sizes format. Expected JSON array.");
    }
    
    // Parse sizeStock from the request body
    let parsedSizeStock = [];
    if (sizeStock) {
      try {
        // If sizeStock sent as a JSON string
        if (typeof sizeStock === 'string') {
          parsedSizeStock = JSON.parse(sizeStock);
        } else {
          // If sizeStock sent as an already parsed object/array
          parsedSizeStock = sizeStock;
        }
        
        // Ensure parsedSizeStock is an array
        if (!Array.isArray(parsedSizeStock)) {
          parsedSizeStock = [parsedSizeStock];
        }
        
        // Validate all sizeStock entries have size and stock properties
        for (const item of parsedSizeStock) {
          if (!item.size || typeof item.stock !== 'number') {
            return errorResponse(res, 400, "Each sizeStock item must have a size and stock quantity.");
          }
        }
        
        // Ensure all sizes have stock records
        const sizeIds = new Set(parsedSizeStock.map(item => 
          typeof item.size === 'object' ? item.size._id : item.size
        ));

        // Check if each size has a corresponding stock entry
        const sizesWithNoStock = parsedSizes.filter(size => 
          !sizeIds.has(typeof size === 'object' ? size._id : size)
        );

        if (sizesWithNoStock.length > 0) {
          // Create stock entries with 0 quantity for sizes that don't have stock records
          for (const size of sizesWithNoStock) {
            parsedSizeStock.push({
              size: size,
              stock: 0
            });
          }
        }
      } catch (error) {
        return errorResponse(res, 400, "Invalid sizeStock format. Expected JSON array.");
      }
    } else {
      // If no sizeStock provided, create entries with 0 stock for all sizes
      parsedSizeStock = parsedSizes.map(size => ({
        size: size,
        stock: 0
      }));
    }
    
    // Create the product
    const newProduct = new Products({
      ...req.body,
      image: images[0],
      gallery: images,
      discount: discount,
      color: processedColor, // Use the processed color
      sizes: parsedSizes,
      sizeStock: parsedSizeStock
    });
    
    const savedProduct = await newProduct.save();
    
    return successResponse(res, 200, "Product created successfully", savedProduct);
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return errorResponse(res, 409, "A product with identical unique fields already exists.");
    }
    
    return errorResponse(res, 500, "Failed to create new product", error);
  }
};
  // Update size stock quantities
  const updateSizeStock = async(req, res) => {
    try {
      const { productId, sizeStockUpdates } = req.body;
      
      if (!productId || !sizeStockUpdates || !Array.isArray(sizeStockUpdates)) {
        return errorResponse(res, 400, "Product ID and size stock updates array are required");
      }
      
      const product = await Products.findById(productId);
      
      if (!product) {
        return errorResponse(res, 404, "Product not found");
      }
      
      // Update each size's stock
      for (const update of sizeStockUpdates) {
        const { size, stock } = update;
        
        if (!size || stock === undefined) {
          continue; // Skip invalid updates
        }
        
        // Find if this size already exists in the product
        const sizeIndex = product.sizeStock.findIndex(s => s.size.toString() === size);
        
        if (sizeIndex !== -1) {
          // Update existing size stock
          product.sizeStock[sizeIndex].stock = stock;
        } else {
          // Add new size with stock
          product.sizeStock.push({ size, stock });
        }
      }
      
      await product.save();
      
      return successResponse(res, 200, "Size stock updated successfully", product);
    } catch (error) {
      console.error(error);
      return errorResponse(res, 500, "Failed to update size stock", error);
    }
  };
  
  // Get product with stock information
  const getProductWithStock = async(req, res) => {
    try {
      const { productId } = req.params;
      
      const product = await Products.findById(productId)
        .populate('category')
        
        .populate('sizeStock.size');
      
      if (!product) {
        return errorResponse(res, 404, "Product not found");
      }
      
      return successResponse(res, 200, "Product retrieved successfully", product);
    } catch (error) {
      console.error(error);
      return errorResponse(res, 500, "Failed to retrieve product", error);
    }
  };
  








const getAllProducts = async(req, res) => {
    try {
        const {
            category,
            color,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};
        if (category && category !== "all") {
            filter.category = category;
        }
        if (color && color !== "all") {
            filter.color = color;
        }

        if (minPrice && maxPrice) {
            const min = parseFloat(minPrice);
            const max = parseFloat(maxPrice);
            if (!isNaN(min) && !isNaN(max)) {
                filter.price = { $gte: min, $lte: max };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalProducts = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        // Populate category, color, and sizes fields
        const products = await Products.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('category') // Populating category reference
            // .populate('colors') // Populating color reference
            .populate('sizes') // Populating sizes reference
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            200,
            "Products fetched successfully",
            (data = {
                products,
                totalProducts,
                totalPages,
            })
        );
    } catch (error) {
        return errorResponse(res, 500, "Failed to get all products", error);
    }
};


const getSingleProduct = async(req, res) => {
    const { id } = req.params;
    try {
        // Populate category, sizes, and colors
        const product = await Products.findById(id)
            // .populate('category') // Assuming category is a reference to another collection
            .populate('sizes') // Assuming sizes is an array of references to a sizes collection
           .populate('color'); // Assuming colors is an array of references to a colors collection

        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }

        return successResponse(res, 200, "Single Product and reviews", {
            product,
        });
    } catch (error) {
        return errorResponse(res, 500, "Failed to get single product", error);
    }
};


const updateProductById = async(req, res) => {
  const productId = req.params.id;
  
  // Validate MongoDB ObjectId for product
  if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid Product ID" });
  }
  
  try {
      console.log("Updating product with ID:", productId);
      console.log("Update data:", req.body);
      
      // Get existing product
      const existingProduct = await Products.findById(productId);
      if (!existingProduct) {
          return res.status(404).json({ error: "Product not found" });
      }
      
      // Prepare update data
      const updateData = {...req.body};
      
      // Auto-calculate discount if price and oldPrice are provided
      if (updateData.oldPrice === '0' || updateData.oldPrice === 0) {
          // If oldPrice is 0, set discount to 0
          updateData.discount = 0;
      } else if (updateData.price && updateData.oldPrice) {
          const price = Number(updateData.price);
          const oldPrice = Number(updateData.oldPrice);
          
          if (oldPrice > price) {
              // Calculate discount percentage
              updateData.discount = Math.round(((oldPrice - price) / oldPrice) * 100);
          } else {
              updateData.discount = 0;
          }
      } else if (updateData.price && existingProduct.oldPrice) {
          // If only price is updated but oldPrice exists in the database
          const price = Number(updateData.price);
          const oldPrice = Number(existingProduct.oldPrice);
          
          if (oldPrice === 0) {
              updateData.discount = 0;
          } else if (oldPrice > price) {
              updateData.discount = Math.round(((oldPrice - price) / oldPrice) * 100);
          } else {
              updateData.discount = 0;
          }
      } else if (updateData.oldPrice && existingProduct.price) {
          // If only oldPrice is updated but price exists in the database
          const price = Number(existingProduct.price);
          const oldPrice = Number(updateData.oldPrice);
          
          if (oldPrice === 0) {
              updateData.discount = 0;
          } else if (oldPrice > price) {
              updateData.discount = Math.round(((oldPrice - price) / oldPrice) * 100);
          } else {
              updateData.discount = 0;
          }
      }
      
      // Handle sizes (ensure they are valid ObjectIds)
      if (updateData.sizes) {
          updateData.sizes = updateData.sizes.map((size) => {
              // Validate size ObjectId format
              if (mongoose.Types.ObjectId.isValid(size)) {
                  return new mongoose.Types.ObjectId(size); // Convert string to ObjectId
              }
              throw new Error(`Invalid size ObjectId: ${size}`);
          });
      }
      
      // Handle colors (ensure they are valid ObjectIds)
      if (updateData.colors) {
          updateData.colors = updateData.colors.map((color) => {
              // Validate color ObjectId format
              if (mongoose.Types.ObjectId.isValid(color)) {
                  return new mongoose.Types.ObjectId(color); // Convert string to ObjectId
              }
              throw new Error(`Invalid color ObjectId: ${color}`);
          });
      }
      
      // Handle sizeStock (parse JSON string if needed)
      if (updateData.sizeStock) {
          // Check if sizeStock is a string that needs to be parsed
          if (typeof updateData.sizeStock === 'string') {
              try {
                  const parsedSizeStock = JSON.parse(updateData.sizeStock);
                  
                  // Convert size strings to ObjectIds
                  updateData.sizeStock = parsedSizeStock.map(item => ({
                      size: mongoose.Types.ObjectId.isValid(item.size) 
                          ? new mongoose.Types.ObjectId(item.size) 
                          : item.size,
                      stock: Number(item.stock)
                  }));
              } catch (err) {
                  console.error("Error parsing sizeStock JSON:", err);
                  return res.status(400).json({ error: "Invalid sizeStock format" });
              }
          }
      }
      
      // Handle image uploads (if provided)
      if (req.files && req.files.length > 0) {
          const newImages = req.files.map(file => file.path);
          
          // If existingGallery was provided in the request
          if (req.body.existingGallery) {
              // If existingGallery is an array (multiple images)
              if (Array.isArray(req.body.existingGallery)) {
                  updateData.gallery = [...req.body.existingGallery, ...newImages];
              } else {
                  // If existingGallery is a single string (one image)
                  updateData.gallery = [req.body.existingGallery, ...newImages];
              }
          } else {
              // If no existing images are kept, just use the new ones
              updateData.gallery = newImages;
          }
      } else if (req.body.existingGallery) {
          // No new files, but keeping some existing images
          if (Array.isArray(req.body.existingGallery)) {
              updateData.gallery = req.body.existingGallery;
          } else {
              updateData.gallery = [req.body.existingGallery];
          }
      } else {
          // No images at all - empty gallery
          updateData.gallery = [];
      }
      
      // Update product
      const updatedProduct = await Products.findByIdAndUpdate(
          productId, 
          { $set: updateData }, 
          { new: true, runValidators: true }
      );
      
      return res.status(200).json({
          message: "Product updated successfully",
          product: updatedProduct,
      });
  } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "Failed to update product", details: error.message });
  }
};





const deleteProductById = async(req, res) => {
    const productId = req.params.id;
    try {
        const deletedProduct = await Products.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return errorResponse(res, 404, "Product not found");
        }
        await Reviews.deleteMany({ productId: productId });
        return successResponse(res, 200, "Product deleted successfully");
    } catch (error) {
        return errorResponse(res, 500, "Failed to delete", error);
    }
};

const getsearchProducts = async(req, res) => {
    try {
        const { search } = req.query; // Get the search query parameter

        let filter = {};

        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } }, // Search by name (case insensitive)
                    { description: { $regex: search, $options: 'i' } }, // Search by description (case insensitive)
                    { category: { $regex: search, $options: 'i' } } // Search by category
                ]
            };
        }

        // Fetch the products
        const products = await Product.find(filter);

        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching products' });
    }
};




const updateProductDiscount = async (req, res) => {
    try {
      const { productId } = req.params; // Get productId from URL params
      const { discountPercentage, discountBase } = req.body;
          
      // Validate input
      if (!productId) {
        return errorResponse(res, 400, "Product ID is required");
      }
          
      if (discountPercentage === undefined || discountPercentage === null) {
        return errorResponse(res, 400, "Discount percentage is required");
      }
          
      if (!discountBase || !['oldPrice', 'price'].includes(discountBase)) {
        return errorResponse(res, 400, "Discount base must be either 'oldPrice' or 'price'");
      }
          
      // Convert value to number to ensure proper calculations
      const discount = Number(discountPercentage);
          
      // Validate the discount is a valid number
      if (isNaN(discount)) {
        return errorResponse(res, 400, "Discount must be a valid number");
      }
          
      // Validate the discount is within acceptable range
      if (discount < 0 || discount > 99) {
        return errorResponse(res, 400, "Discount must be between 0 and 99 percent");
      }
          
      // Find the product
      const product = await Products.findById(productId);
      if (!product) {
        return errorResponse(res, 404, "Product not found");
      }
          
      const updates = {};
          
      // If discount is 0, reset oldPrice and discount
      if (discount === 0) {
        updates.discount = 0;
        updates.oldPrice = 0;
        // Price remains unchanged
      } else {
        // When setting a discount > 0
        if (discountBase === 'price') {
          // If oldPrice exists, use it for calculations
          if (product.oldPrice > 0) {
            // Keep existing oldPrice
            // Calculate the new price based on the input discount
            updates.price = Math.round(product.price * (1 - (discount / 100)) * 100) / 100;
            
            // Calculate actual discount based on oldPrice and new price
            const actualDiscount = Math.round((1 - updates.price / product.oldPrice) * 100);
            updates.discount = actualDiscount;
          } else {
            // Normal case - oldPrice doesn't exist
            updates.oldPrice = product.price;
            updates.discount = discount;
            updates.price = Math.round(product.price * (1 - (discount / 100)) * 100) / 100;
          }
        } else if (discountBase === 'oldPrice') {
          updates.discount = discount;
          
          // If oldPrice doesn't exist or is less than current price, use current price as oldPrice
          if (!product.oldPrice || product.oldPrice <= product.price) {
            updates.oldPrice = product.price;
          }
                  
          // Calculate new price based on oldPrice and discount
          const oldPriceToUse = updates.oldPrice || product.oldPrice;
          updates.price = Math.round(oldPriceToUse * (1 - (discount / 100)) * 100) / 100;
        }
      }
          
      // Update the product
      const updatedProduct = await Products.findByIdAndUpdate(
        productId,
        { $set: updates },
        { new: true }
      );
          
      return successResponse(
        res,
        200,
        "Product discount updated successfully",
        { product: updatedProduct, updates }
      );
    } catch (error) {
      console.error("Error updating product discount:", error);
      return errorResponse(res, 500, "Failed to update product discount", error);
    }
  };

module.exports = {
    createNewProduct,
    getAllProducts,
    getSingleProduct,
    updateProductById,
    deleteProductById,
    getsearchProducts,updateProductDiscount,updateSizeStock,getProductWithStock
};