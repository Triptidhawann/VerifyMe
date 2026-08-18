const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['phone', 'email', 'website'],
      required: true,
    },
    input: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedInput: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
