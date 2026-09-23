import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Tag from '../models/Tag.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
  })
);

router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { name, slug } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('Tag name is required');
    }
    const tag = await Tag.create({ name, slug });
    res.status(201).json(tag);
  })
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      res.status(404);
      throw new Error('Tag not found');
    }
    await tag.deleteOne();
    res.json({ message: 'Tag deleted' });
  })
);

export default router;
