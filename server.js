import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import auth from './middleware/auth.js';
import dotenv from 'dotenv';
import adminAuth from './middleware/adminAuth.js';
import customerRoutes from './routes/CustomerRoutes.js';
import orderRoutes from './routes/OrdersRoutes.js';
import adminOrderRoutes from './routes/AdminOrderRoutes.js';
import productRoutes from './routes/ProductRoutes.js';
import adminProductRoutes from './routes/AdminProductRoutes.js';
import adminCustomerRoutes from './routes/AdminCustomerRoutes.js';
import adminAuthRoutes from './routes/AdminAuthRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Function to run `serve`
function runServe(name, port) {
  const command = `npx serve -s ${name} -l ${port}`;
  const serveProcess = exec(command);

  serveProcess.stdout.on('data', data => {
    console.log(`[${name}] ${data}`);
  });

  serveProcess.stderr.on('data', data => {
    console.error(`[${name} ERROR] ${data}`);
  });

  return serveProcess;
}

const app = express();
// Middleware
app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? '*' : [
    'https://f13hlq98-8080.uks1.devtunnels.ms',
    'http://localhost:8080',
    'http://localhost:5000',
    'http://localhost:8081',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://192.168.100.116:8080',
    'http://192.168.100.116:8081',
    `http://192.168.100.116:5000`,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Cache-Control',
    'X-Requested-With'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Static files Config
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add MIME type configuration before static file serving
express.static.mime.define({'application/javascript': ['js', 'mjs']});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', auth, orderRoutes);
app.use('/api/admin/customers', adminAuth, adminCustomerRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', adminAuth, adminProductRoutes);
app.use('/api/admin/orders', adminAuth, adminOrderRoutes);
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟡 HTTP Server running on port ${PORT}`);
  
  // Start the frontend servers
  console.log('🚀 Starting frontend servers...');
  const adminProcess = runServe('admin', 8080);
  const clientProcess = runServe('client', 8081);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    adminProcess.kill();
    clientProcess.kill();
    process.exit();
  });
});