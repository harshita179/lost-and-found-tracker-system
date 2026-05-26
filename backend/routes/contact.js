const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const verifyToken = require('../middleware/auth');

// User: Send message to admin
router.post('/', verifyToken, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (subject.length > 100) {
      return res.status(400).json({ message: 'Subject must be less than 100 characters' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message must be less than 2000 characters' });
    }

    const newContact = new Contact({
      userId: req.userId,
      subject,
      message
    });

    await newContact.save();

    res.status(201).json({ 
      message: 'Message sent to admin successfully!',
      contact: newContact
    });
  } catch (err) {
    console.log('CONTACT POST ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// User: Get own messages
router.get('/my-messages', verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({ contacts });
  } catch (err) {
    console.log('CONTACT GET ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// User: Get single message
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });

    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ contact });
  } catch (err) {
    console.log('CONTACT GET ONE ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get all messages
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all messages' });
    }

    const contacts = await Contact.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({ contacts });
  } catch (err) {
    console.log('ADMIN CONTACT GET ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Reply to message
router.post('/:id/reply', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reply to messages' });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    contact.adminReply = reply;
    contact.status = 'replied';
    contact.repliedAt = new Date();

    await contact.save();

    res.json({ 
      message: 'Reply sent successfully!',
      contact
    });
  } catch (err) {
    console.log('ADMIN REPLY ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Mark as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can mark messages as read' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    ).populate('userId', 'username email');

    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ contact });
  } catch (err) {
    console.log('MARK READ ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;