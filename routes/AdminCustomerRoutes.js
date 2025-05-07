import express from 'express'
import Customer from '../Models/Customer.js';

const route = express.Router();

//Get Customer Details
route.get('/admin/customers', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Update Customer Details
route.put('/admin/update-customer/:id', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        customer.name = name || customer.name;
        customer.email = email || customer.email;
        await customer.save();
        res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Delete Customer Details
route.delete('/admin/delete-customer/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        await Customer.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


export default route;