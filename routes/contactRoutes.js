import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Contact from '../models/Contact.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public: submit contact form
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      res.status(400);
      throw new Error('Name, email and message are required');
    }
    const contact = await Contact.create({ name, email, subject: subject || '', message });
    res.status(201).json({ message: 'Message sent successfully' });
  })
);

// Admin: list messages
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  })
);

// Admin: mark as read
router.patch(
  '/:id/read',
  protect,
  asyncHandler(async (req, res) => {
    const msg = await Contact.findById(req.params.id);
    if (!msg) {
      res.status(404);
      throw new Error('Message not found');
    }
    msg.read = true;
    await msg.save();
    res.json({ read: true });
  })
);

// Admin: delete message
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const msg = await Contact.findById(req.params.id);
    if (!msg) {
      res.status(404);
      throw new Error('Message not found');
    }
    await msg.deleteOne();
    res.json({ message: 'Message deleted' });
  })
);

export default router;
