const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    itemType: {
      type: String,
      enum: ['Lost', 'Found'],
      required: true,
    },
    dateLost: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    sentiments: {
      type: String,
      default: '',
      trim: true,
    },
    rewards: {
      type: String,
      default: '',
      trim: true,
    },
    contact: {
      type: String,
      default: '',
      trim: true,
    },
    matchedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', ItemSchema);