const { Product } = require("../models/postgres");
const { Sequelize } = require('sequelize');
const { upload } = require("../config/cloudinary");

// Auth check middleware for admin, pass (req, res, next)
const isAdmin = (req, res, next) => {
  console.log("isAdmin middleware called");
  
  // If ADMIN_TOKEN is not set, allow all requests (development mode)
  if (!process.env.ADMIN_TOKEN) {
    console.log("No ADMIN_TOKEN set - allowing request (development mode)");
    return next();
  }
  
  const token = req.header("x-admin-token");
  console.log("Token from header:", token);
  
  if (!token || token !== process.env.ADMIN_TOKEN) {
    console.log("Authentication failed");
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  console.log("Authentication successful");
  next();
};

exports.isAdmin = isAdmin;

// Middleware for handling image upload
exports.uploadImage = upload.single('image');

// Public: search products
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    console.log("Search query received:", q);
    
    if (!q || q.trim() === '') {
      console.log("Empty search query, returning empty array");
      return res.json([]);
    }
    
    // Escape special regex characters to prevent regex errors
    const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');
    console.log("Search regex:", searchRegex);
    
    const products = await Product.findAll({
      where: {
        [Sequelize.Op.or]: [
          { name: { [Sequelize.Op.iLike]: `%${q}%` } },
          { category: { [Sequelize.Op.iLike]: `%${q}%` } },
          { description: { [Sequelize.Op.iLike]: `%${q}%` } }
        ]
      }
    });
    
    console.log(`Found ${products.length} products for query: ${q}`);
    res.json(products);
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

// Public: get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Admin: create product
exports.createProduct = async (req, res) => {
  try {
    // If image was uploaded, use Cloudinary URL, otherwise use provided image URL
    let imagePath = req.body.image;
    
    if (req.file) {
      // Image was uploaded to Cloudinary
      imagePath = req.file.path;
    } else if (imagePath && imagePath.startsWith('blob:')) {
      // Replace blob URLs with placeholder
      imagePath = '/images/placeholder.jpg';
    }
    
    // Validate required fields
    const {
      name,
      originalPrice,
      discountedPrice,
      description,
      category,
    } = req.body;

    if (
      !name ||
      originalPrice === undefined ||
      discountedPrice === undefined ||
      !imagePath ||
      !description ||
      !category
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate numeric fields
    if (isNaN(originalPrice) || isNaN(discountedPrice)) {
      return res.status(400).json({ message: "Prices must be valid numbers" });
    }

    const productData = {
      name,
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      image: imagePath,
      description,
      category
    };

    const savedProduct = await Product.create(productData);

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // If image was uploaded, use Cloudinary URL, otherwise use provided image URL
    let imagePath = req.body.image;
    
    if (req.file) {
      // Image was uploaded to Cloudinary
      imagePath = req.file.path;
    } else if (imagePath && imagePath.startsWith('blob:')) {
      // Replace blob URLs with placeholder
      imagePath = '/images/placeholder.jpg';
    }
    
    // Validate required fields
    const {
      name,
      originalPrice,
      discountedPrice,
      description,
      category,
    } = req.body;

    if (
      !name ||
      originalPrice === undefined ||
      discountedPrice === undefined ||
      !imagePath ||
      !description ||
      !category
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate numeric fields
    if (isNaN(originalPrice) || isNaN(discountedPrice)) {
      return res.status(400).json({ message: "Prices must be valid numbers" });
    }

    const updateData = {
      name,
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      image: imagePath,
      description,
      category,
      updatedAt: new Date()
    };

    const [updatedRowsCount, updatedProducts] = await Product.update(updateData, {
      where: { id },
      returning: true
    });
    const updatedProduct = updatedProducts[0];
    
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attempting to delete product with ID:", id);
    
    // Check if ID is valid
    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    const deletedProduct = await Product.findByPk(id);
    if (deletedProduct) {
      await Product.destroy({ where: { id } });
    }
    
    if (!deletedProduct) {
      console.log("Product not found with ID:", id);
      return res.status(404).json({ message: "Product not found" });
    }
    
    console.log("Product deleted successfully:", deletedProduct._id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};