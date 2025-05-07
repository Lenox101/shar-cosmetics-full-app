import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminInfoSchema = new mongoose.Schema({
  adminId: {
    type: String, // Store as a string to ensure leading zeros are preserved
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        // Ensure the value is exactly 5 digits
        return /^\d{5}$/.test(value);
      },
      message: props => `${props.value} is not a valid 5-digit admin ID!`,
    },
  },
  email: {
    type: [String],
    default: [],
    validate: {
      validator: function (emails) {
        // Validate each email in the array
        return emails.every(email => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });
      },
      message: props => `${props.value} contains invalid email addresses!`,
    },
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'], // Define possible roles
    default: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving to the database
adminInfoSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password for login
adminInfoSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const AdminInfo = mongoose.model('AdminInfo', adminInfoSchema);

export default AdminInfo;