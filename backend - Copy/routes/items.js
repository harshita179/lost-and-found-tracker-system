
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const verifyToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const multer = require('multer');
const { sendMatchNotification, sendRejectionNotification } = require('../utils/emailService');
const { sendMatchNotificationSMS, hasSMSConfig } = require('../utils/smsService');
const { generateQRCode } = require('../utils/qrCode');

// multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// test route
router.get('/test', (req, res) => {
  res.json({ message: 'items route working' });
});

// stats route — only count approved items
router.get('/stats', async (req, res) => {
  try {
    const totalItems = await Item.countDocuments({ approvalStatus: 'approved' });
    const resolvedItems = await Item.countDocuments({ approvalStatus: 'approved', status: 'resolved' });
    const uniqueLocations = await Item.distinct('location', { approvalStatus: 'approved' });
    // For simplicity, avg return time as placeholder
    const avgReturnTime = '2 days'; // Placeholder

    res.json({
      itemsFound: totalItems,
      itemsReturned: resolvedItems,
      campusLocations: uniqueLocations.length,
      avgReturnTime
    });
  } catch (err) {
    console.log('STATS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// get all items — only approved items shown on public dashboard
// Matched items are ONLY visible to the two involved users and admin
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { itemType, status, location, startDate, endDate, keyword } = req.query;
    let filter = { approvalStatus: 'approved' };

    if (itemType) filter.itemType = itemType;
    if (status) filter.status = status;
    if (location) filter.location = new RegExp(location, 'i');
    if (startDate || endDate) {
      filter.dateLost = {};
      if (startDate) filter.dateLost.$gte = startDate;
      if (endDate) filter.dateLost.$lte = endDate;
    }
    if (keyword) {
      filter.$or = [
        { title: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { location: new RegExp(keyword, 'i') }
      ];
    }

    const items = await Item.find(filter).populate('reportedBy', 'username email');

    // Filter out matched items for non-owners / non-admins
    const isAdmin = req.userRole === 'admin';
    const currentUserId = req.userId;

    const visibleItems = items.filter((item) => {
      // Unmatched items are visible to everyone
      if (!item.matchedItemId) return true;

      // Admin can see all matched items
      if (isAdmin) return true;

      // Matched items visible only to the reporter
      if (currentUserId && item.reportedBy && String(item.reportedBy._id) === String(currentUserId)) {
        return true;
      }

      // Hide matched items from everyone else
      return false;
    });

    // Strip contact info from matched items unless user is owner or admin
    const safeItems = visibleItems.map((item) => {
      const itemObj = item.toObject ? item.toObject() : { ...item };

      if (itemObj.matchedItemId) {
        const isOwner = currentUserId && itemObj.reportedBy && String(itemObj.reportedBy._id) === String(currentUserId);
        if (!isAdmin && !isOwner) {
          itemObj.contact = '';
        }
      }

      return itemObj;
    });

    res.json(safeItems);
  } catch (err) {
    console.log('GET ITEMS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// get all pending items — admin only
router.get('/pending', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view pending items' });
    }

    const items = await Item.find({ approvalStatus: 'pending' })
      .populate('reportedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.log('GET PENDING ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// get pending count — admin only
router.get('/pending/count', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view pending count' });
    }

    const count = await Item.countDocuments({ approvalStatus: 'pending' });
    res.json({ count });
  } catch (err) {
    console.log('GET PENDING COUNT ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// approve item — admin only
router.patch('/:id/approve', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve items' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.approvalStatus = 'approved';
    item.adminNote = '';
    const updatedItem = await item.save();
    await updatedItem.populate('reportedBy', 'username email');

    res.json(updatedItem);
  } catch (err) {
    console.log('APPROVE ITEM ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// reject item — admin only
router.patch('/:id/reject', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reject items' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const rejectionReason = (req.body.adminNote || '').trim();
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    item.approvalStatus = 'rejected';
    item.adminNote = rejectionReason;
    const updatedItem = await item.save();
    await updatedItem.populate('reportedBy', 'username email');

    // Send rejection notification email to the user
    let emailSent = false;
    if (updatedItem.reportedBy && updatedItem.reportedBy.email) {
      emailSent = await sendRejectionNotification(
        updatedItem.reportedBy.email,
        updatedItem.reportedBy.username,
        {
          title: updatedItem.title,
          itemType: updatedItem.itemType,
          category: updatedItem.category,
          location: updatedItem.location,
          createdAt: updatedItem.createdAt
        },
        rejectionReason
      );
    }

    res.json({ ...updatedItem.toObject(), rejectionEmailSent: emailSent });
  } catch (err) {
    console.log('REJECT ITEM ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// get single item — matched items restricted to owners + admin
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'username email phone');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const isAdmin = req.userRole === 'admin';
    const currentUserId = req.userId;
    const isOwner = currentUserId && item.reportedBy && String(item.reportedBy._id) === String(currentUserId);
    let isMatchedParticipant = false;

    if (currentUserId && item.matchedItemId && !isOwner && !isAdmin) {
      const counterpartItem = await Item.findOne({
        _id: item.matchedItemId,
        reportedBy: currentUserId,
        matchedItemId: item._id
      }).select('_id');

      isMatchedParticipant = Boolean(counterpartItem);
    }

    // If item is matched, only owner and admin can view it
    if (item.matchedItemId && !isAdmin && !isOwner && !isMatchedParticipant) {
      return res.status(403).json({ message: 'This item has been matched and is no longer publicly visible.' });
    }

    const itemObj = item.toObject();

    // Strip contact from matched items for non-participants/non-admins
    if (itemObj.matchedItemId && !isAdmin && !isOwner && !isMatchedParticipant) {
      itemObj.contact = '';
    }

    res.json(itemObj);
  } catch (err) {
    console.log('GET ITEM ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// create item
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    console.log('POST /items - userId:', req.userId);

    if (!req.body.title || !req.body.location || !req.body.dateLost) {
      return res.status(400).json({ message: 'Missing required fields: title, location, dateLost' });
    }

    const item = new Item({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      category: req.body.category,
      itemType: req.body.itemType,
      dateLost: req.body.dateLost,
      status: req.body.status || 'open',
      reportedBy: req.userId,
      image: req.file ? req.file.path : null,
      sentiments: req.body.sentiments || '',
      rewards: req.body.rewards || '',
      contact: req.body.contact || ''
    });

    const newItem = await item.save();
    
    await newItem.populate('reportedBy', 'username email');

    res.status(201).json(newItem);
  } catch (err) {
    console.log('CREATE ITEM ERROR:', err.message);
    console.log('Full error:', err);
    res.status(400).json({ message: err.message });
  }
});

// update item
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    if (req.body.title) item.title = req.body.title;
    if (req.body.description) item.description = req.body.description;
    if (req.body.location) item.location = req.body.location;
    if (req.body.category) item.category = req.body.category;
    if (req.body.itemType) item.itemType = req.body.itemType;
    if (req.body.status) item.status = req.body.status;
    if (req.body.found !== undefined) item.found = req.body.found;
    if (req.body.image) item.image = req.body.image;

    item.updatedAt = new Date();

    const updatedItem = await item.save();
    await updatedItem.populate('reportedBy', 'username email');

    res.json(updatedItem);
  } catch (err) {
    console.log('UPDATE ITEM ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// delete item
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.log('DELETE ITEM ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// mark found
router.patch('/:id/mark-found', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.found = true;
    item.status = 'resolved';
    item.updatedAt = new Date();

    const updatedItem = await item.save();
    await updatedItem.populate('reportedBy', 'username email');

    res.json(updatedItem);
  } catch (err) {
    console.log('MARK FOUND ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// match items
router.patch('/:id/match/:matchedId', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can match items' });
    }

    const item = await Item.findById(req.params.id);
    const matchedItem = await Item.findById(req.params.matchedId);

    if (!item || !matchedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Validate: one must be Lost and other must be Found
    if (item.itemType === matchedItem.itemType) {
      return res.status(400).json({ message: 'Cannot match two items of the same type' });
    }

    // Both must be approved
    if (item.approvalStatus !== 'approved' || matchedItem.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'Both items must be approved before matching' });
    }

    // Cannot match already matched items
    if (item.matchedItemId || matchedItem.matchedItemId) {
      return res.status(400).json({ message: 'One or both items are already matched' });
    }

    item.matchedItemId = req.params.matchedId;
    item.status = 'resolved';
    item.updatedAt = new Date();
    item.adminNote = req.body.notes || 'Matched by admin';

    matchedItem.matchedItemId = req.params.id;
    matchedItem.status = 'resolved';
    matchedItem.updatedAt = new Date();
    matchedItem.adminNote = req.body.notes || 'Matched by admin';

    await item.save();
    await matchedItem.save();

    await item.populate('reportedBy', 'username email phone');
    await matchedItem.populate('reportedBy', 'username email phone');

    // Send email notifications to both users
    const notificationsSent = [];
    
    if (item.reportedBy && item.reportedBy.email) {
      const sent = await sendMatchNotification(
        item.reportedBy.email,
        item.reportedBy.username,
        { title: item.title, category: item.category, description: item.description, createdAt: item.createdAt },
        {
          title: matchedItem.title,
          category: matchedItem.category,
          description: matchedItem.description,
          createdAt: matchedItem.createdAt,
          reportedByName: matchedItem.reportedBy?.username || 'Unknown user',
          contactNumber: matchedItem.contact || matchedItem.reportedBy?.phone || ''
        }
      );
      notificationsSent.push({ user: item.reportedBy.username, email: item.reportedBy.email, sent });
    }

    if (matchedItem.reportedBy && matchedItem.reportedBy.email) {
      const sent = await sendMatchNotification(
        matchedItem.reportedBy.email,
        matchedItem.reportedBy.username,
        { title: matchedItem.title, category: matchedItem.category, description: matchedItem.description, createdAt: matchedItem.createdAt },
        {
          title: item.title,
          category: item.category,
          description: item.description,
          createdAt: item.createdAt,
          reportedByName: item.reportedBy?.username || 'Unknown user',
          contactNumber: item.contact || item.reportedBy?.phone || ''
        }
      );
      notificationsSent.push({ user: matchedItem.reportedBy.username, email: matchedItem.reportedBy.email, sent });
    }

    const lostItem = item.itemType === 'Lost' ? item : matchedItem;
    const foundItem = item.itemType === 'Found' ? item : matchedItem;

    // Send SMS notifications to both users on their report contact numbers
    const smsResults = await sendMatchNotificationSMS(
      lostItem.reportedBy,
      foundItem.reportedBy,
      lostItem,
      foundItem
    );

    const smsConfigured = hasSMSConfig();

    res.json({ 
      message: smsConfigured
        ? 'Items matched successfully! Both users will be notified.'
        : 'Items matched successfully, but SMS provider is not configured so no real SMS was sent.',
      notifications: notificationsSent,
      smsNotifications: smsResults,
      smsConfigured,
      lostItem,
      foundItem
    });
  } catch (err) {
    console.log('MATCH ITEMS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// get potential matches for an item
router.get('/:id/potential-matches', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view potential matches' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Already matched
    if (item.matchedItemId) {
      return res.json({ message: 'This item is already matched', matches: [] });
    }

    // Find items of opposite type that are not yet matched
    const oppositeType = item.itemType === 'Lost' ? 'Found' : 'Lost';
    const potentialMatches = await Item.find({
      itemType: oppositeType,
      approvalStatus: 'approved',
      matchedItemId: null,
      _id: { $ne: item._id }
    })
    .populate('reportedBy', 'username email')
    .sort({ createdAt: -1 });

    res.json(potentialMatches);
  } catch (err) {
    console.log('POTENTIAL MATCHES ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Generate QR code for an item
router.get('/:id/qrcode', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'username email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const qrCode = await generateQRCode(item);

    if (!qrCode) {
      return res.status(500).json({ message: 'Failed to generate QR code' });
    }

    res.json({
      itemId: item._id,
      title: item.title,
      qrCode: qrCode
    });
  } catch (err) {
    console.log('QR CODE ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
