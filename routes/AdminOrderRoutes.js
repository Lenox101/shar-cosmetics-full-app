import express from 'express'
import Order from '../Models/Order.js';

const route = express.Router();

// Get all orders
route.get('/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('customerId');
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update order status
route.put('/admin/update-order-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        // Validate status
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ message: 'Failed to update order status', error: err.message });
    }
});

// Update payment status
route.put('/admin/update-payment-status/:id', async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const orderId = req.params.id;

        if (!paymentStatus) {
            return res.status(400).json({ message: 'Payment status is required' });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            message: 'Payment status updated successfully',
            order
        });
    } catch (err) {
        console.error('Update payment status error:', err);
        res.status(500).json({
            message: 'Failed to update payment status',
            error: err.message
        });
    }
});

// Delete an order
route.delete('/admin/delete-order/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//View order details
route.get('/admin/order/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId')
            .populate('products.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            ...order._doc,
            customer: order.customerId // Flatten customer data
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get monthly sales data
route.get('/admin/sales-data', async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const salesData = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lte: new Date(currentYear, 11, 31)
            },
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            sales: { $sum: "$totalAmount" }
          }
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            sales: 1
          }
        },
        { $sort: { month: 1 } }
      ]);
  
      // Convert month numbers to names
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedData = salesData.map(item => ({
        name: monthNames[item.month - 1],
        sales: item.sales
      }));
  
      res.json(formattedData);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Get order status distribution
  route.get('/admin/order-status-data', async (req, res) => {
    try {
      const statusData = await Order.aggregate([
        {
          $group: {
            _id: "$status",
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            value: 1
          }
        }
      ]);
  
      res.json(statusData);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

export default route;