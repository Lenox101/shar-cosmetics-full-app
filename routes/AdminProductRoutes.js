import express from 'express'
import Product from '../Models/Product.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';  // Add this import for directory creation

const route = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up local storage with absolute path
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Add a new product with image upload
route.post('/admin/add-product', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, stock, category } = req.body;

        // Validate required fields
        if (!name || !price || !description || !stock || !category) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate price and stock are positive numbers
        if (price <= 0 || stock < 0) {
            return res.status(400).json({ message: 'Invalid price or stock value' });
        }

        // Get the image URL - use proper URL format
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Create a new product
        const product = new Product({
            name,
            price: parseFloat(price),
            description,
            stock: parseInt(stock),
            category,
            images: imageUrl ? [imageUrl] : []
        });

        await product.save();

        res.status(201).json({
            message: 'Product added successfully',
            product
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all products
route.get('/admin/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a product
route.put('/admin/update-product/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, stock, category } = req.body;

        // Find product
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update image if new one is uploaded
        if (req.file) {
            const imageUrl = `/uploads/${req.file.filename}`;
            product.images = [imageUrl];
        }

        // Update other fields
        product.name = name || product.name;
        product.price = price ? parseFloat(price) : product.price;
        product.description = description || product.description;
        product.stock = stock ? parseInt(stock) : product.stock;
        product.category = category || product.category;

        await product.save();
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a product
route.delete('/admin/delete-product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default route;