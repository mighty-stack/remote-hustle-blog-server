import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Post from './models/Post.js';
import Tag from './models/Tag.js';

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_ADMIN || 'admin@remotehustle.com';
const adminPassword = process.env.ADMIN_PASSWORD || process.env.EMAIL_PASSWORD || 'adminpassword123';

const seed = async () => {
  await connectDB();

  // Create admin user
  const existingAdmin = await User.findOne({ email: adminEmail });
  let admin;
  if (!existingAdmin) {
    admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      bio: 'Site administrator and editor.',
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    admin = existingAdmin;
    console.log('Admin user already exists');
  }

  // Create categories
  const categories = {};
  const catData = [
    { name: 'Company News', description: 'Announcements and updates from I-REV.' },
    { name: 'Technology', description: 'Technical articles and tutorials.' },
    { name: 'Education', description: 'Educational content and guides.' },
    { name: 'Industry Insights', description: 'Analysis and trends in our industry.' },
  ];
  for (const c of catData) {
    let cat = await Category.findOne({ name: c.name });
    if (!cat) {
      cat = await Category.create(c);
      console.log(`Category created: ${c.name}`);
    }
    categories[c.name] = cat;
  }

  // Create tags
  const tags = {};
  const tagNames = ['announcement', 'tutorial', 'guide', 'news', 'tips'];
  for (const name of tagNames) {
    let tag = await Tag.findOne({ name });
    if (!tag) {
      tag = await Tag.create({ name });
    }
    tags[name] = tag;
  }

  // Create sample posts
  const samplePosts = [
    {
      title: 'Welcome to the I-REV Blog',
      excerpt: 'Learn about our new blog platform and what we have planned for the future.',
      content: `<h2>Our Mission</h2><p>Welcome to the official I-REV blog! We're excited to share insights, news, and educational content with our community.</p><p>This blog will cover a wide range of topics, from company announcements to deep technical guides. Our team is passionate about sharing knowledge and we hope you'll find value in what we publish.</p><h2>What to Expect</h2><p>Here's what you can look forward to:</p><ul><li>Company news and announcements</li><li>Technical tutorials and guides</li><li>Industry analysis and insights</li><li>Educational content for all levels</li></ul><p>Stay tuned for more content coming soon!</p>`,
      category: categories['Company News'],
      tags: [tags['announcement'], tags['news']],
      status: 'published',
      featured: true,
      seoTitle: 'Welcome to the I-REV Blog',
      metaDescription: 'Learn about our new blog platform and what we have planned for the future.',
    },
    {
      title: 'Getting Started with Modern Web Development',
      excerpt: 'A beginner-friendly guide to the essential tools and concepts every web developer should know.',
      content: `<h2>Introduction</h2><p>Web development has evolved significantly over the years. In this guide, we'll cover the fundamental concepts and tools you need to get started.</p><h2>Key Technologies</h2><h3>HTML</h3><p>HTML is the foundation of every website. It provides the structure and content.</p><h3>CSS</h3><p>CSS controls how your website looks — colors, layout, fonts, and responsive design.</p><h3>JavaScript</h3><p>JavaScript adds interactivity and dynamic behavior to your pages.</p><h2>Next Steps</h2><p>Once you understand the basics, you can explore frameworks like React, Vue, or Angular to build more sophisticated applications.</p>`,
      category: categories['Technology'],
      tags: [tags['tutorial'], tags['guide'], tags['tips']],
      status: 'published',
      featured: false,
      seoTitle: 'Getting Started with Modern Web Development',
      metaDescription: 'A beginner-friendly guide to the essential tools and concepts every web developer should know.',
    },
    {
      title: 'Understanding SEO: A Complete Guide for Beginners',
      excerpt: 'Learn the fundamentals of search engine optimization and how to make your content discoverable.',
      content: `<h2>What is SEO?</h2><p>Search Engine Optimization (SEO) is the practice of improving your website's visibility in search engine results.</p><h2>Key Elements</h2><h3>On-Page SEO</h3><p>This includes optimizing your content, meta tags, headings, and URLs for relevant keywords.</p><h3>Technical SEO</h3><p>Site speed, mobile-friendliness, structured data, and crawlability all matter for search rankings.</p><h3>Content Quality</h3><p>Creating valuable, original content that answers your audience's questions is the most important factor.</p><h2>Conclusion</h2><p>SEO is an ongoing process. Focus on creating great content and the rankings will follow.</p>`,
      category: categories['Education'],
      tags: [tags['guide'], tags['tips']],
      status: 'published',
      featured: false,
      seoTitle: 'Understanding SEO: A Complete Guide for Beginners',
      metaDescription: 'Learn the fundamentals of search engine optimization and how to make your content discoverable.',
    },
  ];

  for (const p of samplePosts) {
    const existing = await Post.findOne({ title: p.title });
    if (!existing) {
      await Post.create({ ...p, author: admin._id });
      console.log(`Post created: ${p.title}`);
    }
  }

  console.log('Seed complete!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
