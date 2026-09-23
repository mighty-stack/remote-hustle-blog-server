import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const buildQuery = (q) => {
  const query = {};
  if (q.status) query.status = q.status;
  if (q.category) query.category = q.category;
  if (q.tag) query.tags = q.tag;
  if (q.featured) query.featured = q.featured === 'true';
  if (q.search) {
    query.$text = { $search: q.search };
  }
  return query;
};

// Public: published posts
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const query = { status: 'published', ...buildQuery(req.query) };
    delete query.status;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .populate('author', 'name bio avatar')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    res.json({
      posts,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  })
);

// Admin: all posts (any status)
router.get(
  '/admin/all',
  protect,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const query = buildQuery(req.query);

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .populate('author', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    res.json({ posts, page, pages: Math.ceil(total / limit), total });
  })
);

// Public: single post by slug
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name bio avatar');
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    res.json(post);
  })
);

// Admin: single post by id (any status)
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email role');
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    res.json(post);
  })
);

// Public: related posts
router.get(
  '/:id/related',
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    const related = await Post.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [{ category: post.category }, { tags: { $in: post.tags } }],
    })
      .populate('category', 'name slug')
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1 })
      .limit(3);
    res.json(related);
  })
);

// Admin: create post
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      imageAlt,
      category,
      tags,
      status,
      scheduledAt,
      featured,
      seoTitle,
      metaDescription,
      canonicalUrl,
      ogImage,
    } = req.body;

    if (!title || !content) {
      res.status(400);
      throw new Error('Title and content are required');
    }

    // Process tags: create new ones if needed
    let tagIds = [];
    if (tags && Array.isArray(tags)) {
      const Tag = (await import('../models/Tag.js')).default;
      tagIds = await Promise.all(
        tags.map(async (t) => {
          if (typeof t === 'string' && t.length === 24) return t;
          const name = typeof t === 'string' ? t : t.name;
          const slug = typeof t === 'object' ? t.slug : undefined;
          let tag = await Tag.findOne({ name });
          if (!tag) {
            const slugify = (await import('slugify')).default;
            tag = await Tag.create({ name, slug: slug || slugify(name, { lower: true, strict: true }) });
          }
          return tag._id;
        })
      );
    }

    const post = await Post.create({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      imageAlt,
      category: category || null,
      tags: tagIds,
      author: req.user._id,
      status: status || 'draft',
      scheduledAt: scheduledAt || null,
      featured: featured || false,
      seoTitle,
      metaDescription,
      canonicalUrl,
      ogImage,
    });

    const populated = await post.populate([
      { path: 'category', select: 'name slug' },
      { path: 'tags', select: 'name slug' },
      { path: 'author', select: 'name email role' },
    ]);
    res.status(201).json(populated);
  })
);

// Admin: update post
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      imageAlt,
      category,
      tags,
      status,
      scheduledAt,
      featured,
      seoTitle,
      metaDescription,
      canonicalUrl,
      ogImage,
    } = req.body;

    // Process tags
    let tagIds = [];
    if (tags && Array.isArray(tags)) {
      const Tag = (await import('../models/Tag.js')).default;
      tagIds = await Promise.all(
        tags.map(async (t) => {
          if (typeof t === 'string' && t.length === 24) return t;
          const name = typeof t === 'string' ? t : t.name;
          const slugVal = typeof t === 'object' ? t.slug : undefined;
          let tag = await Tag.findOne({ name });
          if (!tag) {
            const slugify = (await import('slugify')).default;
            tag = await Tag.create({ name, slug: slugVal || slugify(name, { lower: true, strict: true }) });
          }
          return tag._id;
        })
      );
    }

    post.title = title ?? post.title;
    post.slug = slug ?? post.slug;
    post.excerpt = excerpt ?? post.excerpt;
    post.content = content ?? post.content;
    post.featuredImage = featuredImage ?? post.featuredImage;
    post.imageAlt = imageAlt ?? post.imageAlt;
    post.category = category ?? post.category;
    post.tags = tagIds.length ? tagIds : post.tags;
    post.status = status ?? post.status;
    post.scheduledAt = scheduledAt ?? post.scheduledAt;
    post.featured = featured ?? post.featured;
    post.seoTitle = seoTitle ?? post.seoTitle;
    post.metaDescription = metaDescription ?? post.metaDescription;
    post.canonicalUrl = canonicalUrl ?? post.canonicalUrl;
    post.ogImage = ogImage ?? post.ogImage;

    // Set publishedAt when transitioning to published
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    const updated = await post.save();
    await updated.populate([
      { path: 'category', select: 'name slug' },
      { path: 'tags', select: 'name slug' },
      { path: 'author', select: 'name email role' },
    ]);
    res.json(updated);
  })
);

// Admin: delete post
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  })
);

// Admin: toggle featured
router.patch(
  '/:id/featured',
  protect,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    post.featured = !post.featured;
    await post.save();
    res.json({ featured: post.featured });
  })
);

// Public: stats
router.get(
  '/stats/overview',
  asyncHandler(async (req, res) => {
    const [totalPosts, totalCategories, featuredPosts] = await Promise.all([
      Post.countDocuments({ status: 'published' }),
      Category.countDocuments(),
      Post.countDocuments({ status: 'published', featured: true }),
    ]);
    res.json({ totalPosts, totalCategories, featuredPosts });
  })
);

export default router;
