import express from 'express'
import AdminInfo from '../Models/AdminInfo.js';
import jwt from 'jsonwebtoken';

const generateToken = (adminId) => {
  return jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const route = express.Router();

route.post('/admin/register', async (req, res) => {
    try {
        const { adminId, email, password, role, permissions } = req.body;

        // Check if adminId is already registered
        const existingAdmin = await AdminInfo.findOne({ adminId });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin ID is already registered' });
        }

        // Create a new admin
        const adminInfo = new AdminInfo({ adminId, email, password, role, permissions });
        await adminInfo.save();

        res.status(201).json({ message: 'Admin registered successfully', adminInfo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login as an admin
route.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email (since email is an array, use $in)
        const admin = await AdminInfo.findOne({ email: { $in: email } });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if the user has admin privileges
        if (!admin.role || !['admin', 'superadmin'].includes(admin.role)) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        // Generate JWT token
        const token = generateToken(admin._id);

        // Return success response (exclude sensitive data)
        const { password: _, ...adminData } = admin.toObject();
        res.status(200).json({
            message: 'Admin login successful',
            admin: adminData,
            token,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


export default route;
