import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Category from '../models/Category.js';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public: all categories with post count
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 1 }).lean();
    const withCounts = await Promise.all(
      categories.map(async (c) => ({
        ...c,
        postCount: await Post.countDocuments({ category: c._id, status: 'published' }),
      }))
    );
    res.json(withCounts);
  })
);

// Public: single category by slug
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    res.json(category);
  })
);

// Admin: create category
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { name, description, slug } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('Category name is required');
    }
    const category = await Category.create({ name, description: description || '', slug });
    res.status(201).json(category);
  })
);

// Admin: update category
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    category.name = req.body.name || category.name;
    category.description = req.body.description ?? category.description;
    if (req.body.slug) category.slug = req.body.slug;
    const updated = await category.save();
    res.json(updated);
  })
);

// Admin: delete category
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    // Unset category on posts
    await Post.updateMany({ category: category._id }, { $unset: { category: '' } });
    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  })
);

export default router;
