# 🛍️ AJIO Clone — Production-Ready MERN E-commerce App

A full-stack e-commerce application inspired by AJIO, built with the **MERN stack** (MongoDB, Express, React, Node.js). Features JWT auth, product search/filtering, cart, checkout, order tracking, admin panel, Docker support, and AWS deployment.

---

## 📸 Features at a Glance

| Feature | Details |
|---|---|
| **Auth** | JWT login/register, bcrypt hashing, role-based (admin/user) |
| **Products** | Listing, search, category/price filters, pagination, reviews & ratings |
| **Cart** | Persistent server-side cart + local guest cart |
| **Checkout** | Address form, multi-payment mock (COD, Card, UPI, NetBanking) |
| **Orders** | Place, track, cancel, order history, status timeline |
| **Admin** | Full CRUD products, manage orders with status updates, manage users |
| **Wishlist** | Save/remove products, persisted per user |
| **Security** | Helmet, CORS, rate limiting, input validation, NoSQL injection protection |
| **Images** | Cloudinary upload support, fallback URLs |
| **Docker** | Multi-stage builds, docker-compose for full stack |
| **AWS** | EC2 deployment scripts, ECR push scripts |

---

## 🗂️ Project Structure

```
ajio-clone/
├── backend/                    # Express + Node.js API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/            # Route logic (MVC)
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect + authorize
│   │   ├── errorMiddleware.js  # Global error handler
│   │   └── validateMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── Cart.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── userRoutes.js
│   │   └── uploadRoutes.js
│   ├── utils/
│   │   ├── AppError.js         # Custom error class
│   │   ├── asyncHandler.js     # Async try/catch wrapper
│   │   ├── APIFeatures.js      # Filter/sort/paginate helper
│   │   └── seeder.js           # DB seed script
│   ├── server.js               # Express entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, Footer, AdminLayout, MainLayout
│   │   │   ├── product/        # ProductCard
│   │   │   └── common/         # Spinner, Skeleton, Pagination, Badges
│   │   ├── context/
│   │   │   ├── authStore.js    # Zustand auth store
│   │   │   └── cartStore.js    # Zustand cart store
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   ├── OrderDetailPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── WishlistPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       ├── AdminProductForm.jsx
│   │   │       ├── AdminOrders.jsx
│   │   │       └── AdminUsers.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios client + all API methods
│   │   ├── App.jsx             # Routes + guards
│   │   └── main.jsx
│   ├── nginx.conf              # Nginx config (SPA + API proxy)
│   ├── Dockerfile
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docker-compose.yml          # Full-stack compose
├── docker-compose.prod.yml     # Production overrides
├── deploy-aws.sh               # EC2 deployment script
├── push-to-ecr.sh              # ECR image push script
├── mongo-init.js               # MongoDB init script
└── README.md
```

---

## 🔌 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, returns JWT |
| GET | `/me` | 🔒 | Get current user + wishlist |
| PUT | `/profile` | 🔒 | Update name/phone |
| PUT | `/password` | 🔒 | Change password |
| POST | `/address` | 🔒 | Add shipping address |
| DELETE | `/address/:id` | 🔒 | Remove address |

### Products — `/api/products`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | List with filters: `search`, `category`, `sort`, `minPrice`, `maxPrice`, `page`, `limit` |
| GET | `/:id` | — | Product detail + related |
| GET | `/categories` | — | Category list with counts |
| POST | `/` | 🔐 Admin | Create product |
| PUT | `/:id` | 🔐 Admin | Update product |
| DELETE | `/:id` | 🔐 Admin | Soft-delete product |
| POST | `/:id/reviews` | 🔒 | Add review |
| DELETE | `/:id/reviews` | 🔒 | Delete own review |

### Cart — `/api/cart`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | Get user's cart |
| POST | `/` | 🔒 | Add item `{productId, quantity, size, color}` |
| PUT | `/:itemId` | 🔒 | Update item quantity |
| DELETE | `/:itemId` | 🔒 | Remove item |
| DELETE | `/` | 🔒 | Clear cart |

### Orders — `/api/orders`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | 🔒 | Place order from cart |
| GET | `/my` | 🔒 | User's order history |
| GET | `/:id` | 🔒 | Order detail |
| PUT | `/:id/cancel` | 🔒 | Cancel Pending/Processing order |
| GET | `/` | 🔐 Admin | All orders with stats |
| PUT | `/:id/status` | 🔐 Admin | Update order status |

### Users — `/api/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔐 Admin | List all users |
| GET | `/:id` | 🔐 Admin | User detail |
| PUT | `/:id` | 🔐 Admin | Update role/status |
| DELETE | `/:id` | 🔐 Admin | Deactivate user |
| POST | `/wishlist/:productId` | 🔒 | Toggle wishlist item |

---

## 🏃 Local Development Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or MongoDB Atlas URI)
- Git

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/ajio-clone.git
cd ajio-clone

# 2. Setup Backend
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, etc.
npm install
npm run seed          # Populate sample products & users
npm run dev           # Starts on http://localhost:5000

# 3. Setup Frontend (new terminal)
cd frontend
npm install
npm run dev           # Starts on http://localhost:5173
```

**Test credentials (after seeding):**
- Admin: `admin@ajio.com` / `Admin@123`
- User:  `user@ajio.com` / `User@123`

---

## 🐳 Docker Development

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with your values

# 2. Build and start all services
docker compose up --build

# Access:
# Frontend: http://localhost
# Backend:  http://localhost:5000/api
# MongoDB:  mongodb://localhost:27017

# 3. Seed the database
docker compose exec backend node utils/seeder.js

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down
```

---

## ☁️ AWS EC2 Deployment

### Prerequisites on AWS
1. Launch an **EC2 instance** (Amazon Linux 2023 or Ubuntu 22.04)
2. Security Group inbound rules:
   - Port **22** (SSH) from your IP
   - Port **80** (HTTP) from anywhere
   - Port **443** (HTTPS) from anywhere (optional)
   - Port **5000** can be kept private (Nginx proxies `/api`)
3. Allocate and attach an **Elastic IP**
4. (Optional) Point a domain A record to the Elastic IP

### Deploy in 3 steps

```bash
# Step 1: SSH into your EC2 instance
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Step 2: Download and run the deploy script
curl -O https://raw.githubusercontent.com/yourusername/ajio-clone/main/deploy-aws.sh
chmod +x deploy-aws.sh
DOMAIN=YOUR_EC2_IP_OR_DOMAIN ./deploy-aws.sh

# Step 3: App is live at http://YOUR_EC2_IP
```

### Using AWS ECR (Elastic Container Registry)

```bash
# Configure AWS CLI first
aws configure  # Enter Access Key, Secret, Region (e.g. ap-south-1)

# Push images to ECR
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=ap-south-1
chmod +x push-to-ecr.sh
./push-to-ecr.sh

# On EC2, update docker-compose.yml to use ECR image URIs:
# image: 123456789012.dkr.ecr.ap-south-1.amazonaws.com/ajio-clone-backend:latest
```

### HTTPS with Let's Encrypt (Optional)

```bash
# Install Certbot on Ubuntu
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renew (already configured by Certbot)
sudo certbot renew --dry-run
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcryptjs (salt rounds: 12) |
| JWT tokens | 30-day expiry, Bearer auth |
| Rate limiting | 100 req/15min global; 20 req/15min for auth |
| HTTP headers | Helmet.js (XSS, HSTS, CSP, etc.) |
| CORS | Configurable origin whitelist |
| NoSQL injection | express-mongo-sanitize |
| Input validation | express-validator on all POST routes |
| Soft deletes | Users & products not hard-deleted |
| Role-based access | `protect` + `authorize('admin')` middleware |

---

## 🧪 Database Models

### User
```
name, email, password (hashed), role (user|admin), avatar, phone,
addresses[], wishlist[], isActive, createdAt
```

### Product
```
name, description, price, discountPrice, category, subCategory, brand,
images[], sizes[{size, stock}], colors[], stock, rating, numReviews,
reviews[], tags[], isFeatured, isActive, createdBy
```

### Order
```
user, orderItems[], shippingAddress, paymentMethod, itemsPrice,
shippingPrice, taxPrice, totalPrice, discountAmount, orderStatus,
statusHistory[], isPaid, isDelivered, trackingNumber
```

### Cart
```
user, items[{product, name, image, price, quantity, size, color}],
couponCode, discountAmount
(virtuals: totalItems, subtotal, total)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| State | Zustand, TanStack Query |
| Routing | React Router v6 |
| Backend | Node.js 20, Express 4 |
| Database | MongoDB 7, Mongoose 8 |
| Auth | JSON Web Tokens, bcryptjs |
| Validation | express-validator |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |
| Images | Cloudinary |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx (reverse proxy + SPA) |
| Cloud | AWS EC2, ECR |

---

## 📄 License

MIT — free to use and modify.
