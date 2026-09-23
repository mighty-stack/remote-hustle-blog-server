# Remote Hustle Blog — Backend (Express + MongoDB)

## Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```
   cp .env.example .env
   ```
   - `MONGODB_URI` — your MongoDB connection string
   - `JWT_SECRET` — a long random string for JWT signing
   - `PORT` — defaults to 5000
   - `CLIENT_URL` — your frontend URL (for CORS)

3. Seed the database with an admin user and sample content:
   ```
   npm run seed
   ```
   This creates an admin user: **admin@remotehustle.com / adminpassword123**

4. Start the server:
   ```
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Current user | Yes |
| POST | /api/auth/register | Create user | Yes |
| PUT | /api/auth/profile | Update profile | Yes |
| GET | /api/posts | List published posts | No |
| GET | /api/posts/admin/all | List all posts | Yes |
| GET | /api/posts/slug/:slug | Get post by slug | No |
| GET | /api/posts/:id | Get post by ID | Yes |
| GET | /api/posts/:id/related | Get related posts | No |
| POST | /api/posts | Create post | Yes |
| PUT | /api/posts/:id | Update post | Yes |
| DELETE | /api/posts/:id | Delete post | Yes |
| PATCH | /api/posts/:id/featured | Toggle featured | Yes |
| GET | /api/categories | List categories | No |
| POST | /api/categories | Create category | Yes |
| PUT | /api/categories/:id | Update category | Yes |
| DELETE | /api/categories/:id | Delete category | Yes |
| GET | /api/tags | List tags | No |
| POST | /api/tags | Create tag | Yes |
| DELETE | /api/tags/:id | Delete tag | Yes |
| POST | /api/contact | Submit contact form | No |
| GET | /api/contact | List messages | Yes |
| PATCH | /api/contact/:id/read | Mark read | Yes |
| DELETE | /api/contact/:id | Delete message | Yes |
| POST | /api/upload | Upload image | Yes |
| GET | /api/seo/sitemap.xml | XML sitemap | No |
| GET | /api/seo/robots.txt | Robots.txt | No |

## Creating an Admin User

Run the seed script:
```
npm run seed
```

Or manually via API:
1. Login with existing admin
2. POST to `/api/auth/register` with name, email, password, and role

## How to Publish Articles

1. Go to `/admin/login` and sign in with your admin credentials
2. Click "New Post" in the top right
3. Fill in the title, content (supports Markdown-style formatting)
4. Set category, tags, and SEO fields in the sidebar
5. Upload a featured image
6. Click "Save Draft" or "Publish"
