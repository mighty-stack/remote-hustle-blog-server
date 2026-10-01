import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import { upload, uploadDir } from './middleware/upload.js';
import { seed } from './seed.js';

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://remotehustle-blog.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// SEO routes (sitemap, robots)
app.use('/api/seo', seoRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/posts', postRoutes);
app.use('/posts', postRoutes);

app.use('/api/categories', categoryRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/tags', tagRoutes);
app.use('/tags', tagRoutes);

app.use('/api/contact', contactRoutes);
app.use('/contact', contactRoutes);

app.use('/api/seo', seoRoutes);
app.use('/seo', seoRoutes);

// Image upload
const uploadImage = (req, res, next) => {
  if (!req.file) {
    res.status(400);
    return res.json({ error: 'No file uploaded' });
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ error: 'Image uploads are not configured' });
  }

  cloudinary.uploader
    .upload_stream({ folder: 'remote-hustle' }, (error, result) => {
      if (error) return next(error);
      if (!result?.secure_url) return next(new Error('Image upload failed'));
      res.json({ url: result.secure_url });
    })
    .end(req.file.buffer);
};

app.post('/api/upload', upload.single('image'), uploadImage);
app.post('/upload', upload.single('image'), uploadImage);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT;
const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_ADMIN;
const adminPassword = process.env.ADMIN_PASSWORD || process.env.EMAIL_PASSWORD;

connectDB()
  .then(async () => {
    await seed({ skipConnection: true });
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
