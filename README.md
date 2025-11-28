# 🎄 Christmas Wishlist

A beautiful, modern Christmas wishlist app with AI-powered features, smart image processing, and a stunning animated blizzard background.

![Christmas Wishlist](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)

## ✨ Features

- 🎨 **Modern Dark UI** - Beautiful dark theme with gold accents and animated snowfall
- 🎁 **Smart Gift Cards** - Hover effects, priority badges, and smooth animations
- 🖼️ **Intelligent Image Processing** - Automatically detects product background colors and replaces black/transparent pixels
- 🔍 **AI-Powered Deal Finder** - Find the best prices and deals using Google Gemini AI
- 🤖 **AI Gift Generator** - Auto-fill gift details with product name
- 🔐 **Password-Protected Admin Panel** - Secure management of gifts
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- ❄️ **Animated Blizzard Effect** - Immersive winter background animation
- 🚀 **Optimized Performance** - Fast loading with React memoization and optimized image processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Redis for persistent storage
- (Optional) Google Gemini API key for AI features

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd christmas-list
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the project root:

```env
# Admin password - change this in production!
ADMIN_PASSWORD=christmas2024

# JWT secret - use a strong random string in production
JWT_SECRET=your-super-secret-jwt-key-change-this

# Redis URL (optional - for persistent storage)
# If not set, the app will use in-memory storage (resets on restart)
REDIS_URL=redis://localhost:6379
# Or for Vercel KV:
# REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379

# Google Gemini API Key (optional - for AI features)
# Get a free API key at: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# Image Search API Keys (optional - for automatic product images)
# The app will work without these, but images will be lower quality
# Get Pexels API key (free, 200 requests/hour): https://www.pexels.com/api/
PEXELS_API_KEY=your-pexels-api-key-here
# Get Unsplash API key (free tier available): https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Viewing the Wishlist

- Visit the home page to see all gifts
- Click on any gift card to view full details
- Use the "Find Deals with AI" button to get price comparisons and deals

### Admin Panel

1. Go to `/admin` or click "Admin Panel" in the footer
2. Enter your admin password (set in `ADMIN_PASSWORD` environment variable)
3. Add, edit, or delete gifts
4. Customize page settings (emoji, title, subtitle)

### AI Features

**Auto-Fill Gift Details:**
- In the admin panel, enter a product name
- Click the "🪄 Auto-Fill" button
- AI will generate name, description, price, priority, and store links

**Find Deals:**
- Click any gift to open the modal
- Click "🔍 Find Deals with AI"
- Get price comparisons, deals, and alternative suggestions

## 🚀 Deploying

### Option 1: Deploy to Vercel (Easiest)

#### Via Vercel CLI

1. **Install Vercel CLI** (if not already installed)

```bash
npm install -g vercel
```

2. **Login to Vercel**

```bash
vercel login
```

3. **Deploy to production**

```bash
# Build and deploy
npm run build
vercel --prod
```

Or deploy directly:

```bash
vercel --prod --yes
```

### Option 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**

   In the Vercel project settings, add these environment variables:

   | Variable | Description | Required |
   |----------|-------------|----------|
| `ADMIN_PASSWORD` | Admin panel password | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens | ✅ Yes |
| `REDIS_URL` | Redis connection URL | ❌ Optional |
| `GEMINI_API_KEY` | Google Gemini API key | ❌ Optional |
| `PEXELS_API_KEY` | Pexels API key for product images | ❌ Optional |
| `UNSPLASH_ACCESS_KEY` | Unsplash API key for product images | ❌ Optional |

4. **Deploy**

   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `your-project.vercel.app`

### Setting up Redis (Optional but Recommended)

For persistent storage, you can use:

1. **Upstash Redis** (Free tier available)
   - Sign up at [upstash.com](https://upstash.com)
   - Create a Redis database
   - Copy the `REDIS_URL` and add it to Vercel environment variables

2. **Redis Cloud** (Free tier available)
   - Sign up at [redis.com/try-free](https://redis.com/try-free)
   - Create a database
   - Copy the connection URL

3. **Self-hosted Redis**
   - Set up your own Redis instance
   - Add the connection URL to environment variables

**Note:** Without Redis, data will reset on each deployment. Redis is recommended for production.

### Setting up Gemini AI (Optional)

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key (free tier available)

2. **Add to Vercel**
   - Go to your project settings → Environment Variables
   - Add `GEMINI_API_KEY` with your key
   - Redeploy the project

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **UI Library:** [React 19](https://react.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Styling:** CSS Modules + Custom CSS Variables
- **Authentication:** [jose](https://github.com/panva/jose) for JWT
- **Storage:** Redis (via `redis` package) or in-memory fallback
- **AI:** [Google Gemini AI](https://ai.google.dev/) for deal finding and gift generation
- **Deployment:** [Vercel](https://vercel.com)

## 📁 Project Structure

```
christmas-list/
├── app/
│   ├── admin/          # Admin panel page
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── deals/      # AI deal finder
│   │   ├── gifts/      # Gift CRUD operations
│   │   ├── login/      # Login/logout
│   │   └── settings/    # Page settings
│   ├── globals.css     # Global styles
│   ├── layout.js       # Root layout
│   └── page.js         # Home page
├── components/
│   ├── Background.jsx   # Animated blizzard effect
│   ├── GiftCard.jsx    # Gift card component
│   ├── GiftForm.jsx    # Admin gift form
│   └── GiftModal.jsx   # Gift detail modal
├── lib/
│   ├── auth.js         # Authentication utilities
│   └── store.js        # Data storage (Redis/in-memory)
├── data/
│   └── gifts.json      # Fallback data (if no Redis)
└── public/             # Static assets
```

## 🎨 Features in Detail

### Smart Image Processing

The app automatically:
- Detects the background color of product images
- Replaces black pixels with the detected background color
- Replaces transparent pixels with white
- Optimizes images for faster loading

### AI Deal Finder

Powered by Google Gemini AI:
- Finds best prices across multiple retailers
- Provides current deals and discount tips
- Suggests alternative products
- Generates comprehensive shopping summaries

### Performance Optimizations

- React.memo for component memoization
- useCallback for stable function references
- Optimized image processing (downscaled canvases)
- Parallel API calls
- Reduced animated elements for better performance

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ADMIN_PASSWORD` | Password for admin panel | - | ✅ Yes |
| `JWT_SECRET` | Secret for JWT token signing | - | ✅ Yes |
| `REDIS_URL` | Redis connection URL | - | ❌ No |
| `GEMINI_API_KEY` | Google Gemini API key | - | ❌ No |
| `NODE_ENV` | Environment (development/production) | `development` | ❌ No |

## 🐛 Troubleshooting

### Images not processing correctly

- Check browser console for CORS errors
- Some image domains don't allow cross-origin canvas access
- Try using images from CORS-enabled domains

### Redis connection issues

- Verify `REDIS_URL` is correct
- Check Redis server is running (if self-hosted)
- App will fall back to in-memory storage if Redis fails

### AI features not working

- Verify `GEMINI_API_KEY` is set correctly
- Check API key has proper permissions
- Ensure you haven't exceeded API rate limits

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❄️ and 🎄 for the holidays!
