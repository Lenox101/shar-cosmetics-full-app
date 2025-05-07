import express from 'express';
import Product from '../Models/Product.js';
import Customer from '../Models/Customer.js';
import Order from '../Models/Order.js';

const route = express.Router();

// Place order
route.post('/orders', async (req, res) => {
    try {
        const { phoneNumber, email, products, totalAmount } = req.body;
        const customerId = req.user.userId;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (!phoneNumber || !email || !products || !totalAmount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const orderItems = [];
        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ message: `Product not found: ${item.productId}` });
            }

            orderItems.push({
                product: item.productId,
                quantity: item.quantity,
                priceAtPurchase: product.price
            });
        }

        const order = new Order({
            customerId,
            customerName: customer.name,
            phoneNumber,
            email,
            products: orderItems,
            totalAmount,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();

        res.status(201).json({
            message: 'Order received successfully',
            order: await order.populate('products.product')
        });

    } catch (err) {
        console.error('Order error:', err);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

//Get order by ID
route.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('products.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// View my orders
route.get('/my-orders', async (req, res) => {
    try {
        const customerId = req.user.userId;

        const orders = await Order.find({ customerId }).populate('products.product');
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default route;
