import Customer from "../Models/Customer.js";
import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const route = express.Router();
dotenv.config();

// Function to generate a JWT token
const generateToken = (customerId) => {
    return jwt.sign(
        { 
            userId: customerId,  // Changed from 'id' to 'userId' to match auth middleware
            type: 'customer'     // Add user type for additional security
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '2h' }    // Increased token expiry time
    );
};

// Register a new user
route.post('/register', async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;

        // Check if user already exists
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const customer = new Customer({ name, email, password, phoneNumber });
        await customer.save();

        res.status(201).json({ message: 'User registered successfully', customer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login a user
route.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isMatch = await customer.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate a token
        const token = generateToken(customer._id);

        // Return more detailed response
        res.status(200).json({ 
            message: 'Login successful',
            token,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default route;
