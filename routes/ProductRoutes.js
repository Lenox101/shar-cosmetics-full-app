import express from 'express';
import Product from '../Models/Product.js';

const route = express.Router();
 
 //Get all products with images displayed
route.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Get Product by ID
route.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get all products for shop display
route.get('/shop/products', async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } }); // Only get products in stock
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get featured products (one from each category)
route.get('/featured-products', async (req, res) => {
  try {
    // Get one product from each category with stock > 0
    const featuredProducts = await Product.aggregate([
      { $match: { stock: { $gt: 0 } } },
      { $sort: { createdAt: -1 } }, // Get the newest products
      { $group: {
          _id: '$category',
          product: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$product' } },
      { $limit: 3 } // Limit to 3 featured products
    ]);

    res.status(200).json(featuredProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get products by category
route.get('/shop/products/:category', async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.category,
      stock: { $gt: 0 }
    });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default route;