# OmniCart Backend API

A comprehensive Node.js backend API for the OmniCart E-commerce Platform with role-based access control, authentication, and complete product, order, and shop management.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Customer, Manager, Super Admin)
  - Secure password hashing with bcrypt

- **User Management**
  - User registration and login
  - Profile management
  - Password updates

- **Shop Management**
  - CRUD operations for shops
  - Revenue tracking
  - Manager assignment

- **Product Management**
  - Full CRUD operations
  - Search and filtering (by shop, tags, price range, text search)
  - Product ratings and reviews

- **Order Management**
  - Order creation with multiple items
  - Order status tracking (Processing → Packed → Shipped → Out for Delivery → Delivered)
  - Automated tracking steps generation
  - Revenue updates for shops

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd "OmniCart Backend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/omnicart
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows with MongoDB as a service
   net start MongoDB
   
   # On Mac/Linux
   mongod
   ```

5. **Seed the database** (Optional but recommended)
   ```bash
   npm run seed
   ```
   This will populate the database with sample shops, users, products, and an order.

6. **Start the server**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer", // customer | manager | super-admin
  "shopId": "shopId" // Required only for manager role
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Password
```http
PUT /api/auth/updatepassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword"
}
```

### Shop Endpoints

#### Get All Shops
```http
GET /api/shops
```

#### Get Single Shop
```http
GET /api/shops/:id
```

#### Create Shop (Super Admin only)
```http
POST /api/shops
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Shop",
  "ownerName": "Jane Doe",
  "email": "shop@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State 12345"
}
```

#### Update Shop (Manager or Super Admin)
```http
PUT /api/shops/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Shop Name"
}
```

#### Delete Shop (Super Admin only)
```http
DELETE /api/shops/:id
Authorization: Bearer <token>
```

#### Get Shop Revenue (Manager or Super Admin)
```http
GET /api/shops/:id/revenue
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products
GET /api/products?shopId=<shopId>
GET /api/products?tags=audio,wireless
GET /api/products?minPrice=50&maxPrice=200
GET /api/products?search=headphones
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product (Manager or Super Admin)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "image": "/path/to/image.jpg",
  "rating": 4.5,
  "tags": ["tag1", "tag2"],
  "shopId": "shopId" // Optional for managers (auto-assigned)
}
```

#### Update Product (Manager or Super Admin)
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Product Name",
  "price": 89.99
}
```

#### Delete Product (Manager or Super Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

#### Get Products by Shop
```http
GET /api/products/shop/:shopId
```

### Order Endpoints

#### Get All Orders
```http
GET /api/orders
Authorization: Bearer <token>
```
- Customers: See only their orders
- Managers: See orders containing their shop's products
- Super Admin: See all orders

#### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Create Order (Customer)
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "productId1",
      "quantity": 2,
      "comment": "Optional comment"
    },
    {
      "productId": "productId2",
      "quantity": 1
    }
  ]
}
```

#### Update Order Status (Manager or Super Admin)
```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped" // processing | packed | shipped | out-for-delivery | delivered
}
```

#### Get My Orders (Customer)
```http
GET /api/orders/user/me
Authorization: Bearer <token>
```

#### Delete Order (Super Admin only)
```http
DELETE /api/orders/:id
Authorization: Bearer <token>
```

### Health Check
```http
GET /api/health
```

## 🔑 Test Credentials

After running the seed script, you can use these credentials:

### Customer Account
- **Email:** customer@example.com
- **Password:** password123

### Manager Accounts

**Audio Hub Manager:**
- **Email:** ava@audiohub.com
- **Password:** password123

**Wearables Co. Manager:**
- **Email:** liam@wearablesco.com
- **Password:** password123

**Adventure Cams Manager:**
- **Email:** noah@adventurecams.com
- **Password:** password123

### Super Admin
- **Email:** admin@omnicart.com
- **Password:** admin123

## 🏗️ Project Structure

```
OmniCart Backend/
├── config/
│   ├── db.js              # Database connection
│   └── jwt.js             # JWT utilities
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── shopController.js  # Shop management
│   ├── productController.js # Product management
│   └── orderController.js # Order management
├── middleware/
│   └── auth.js            # Authentication & authorization middleware
├── models/
│   ├── User.js            # User schema
│   ├── Shop.js            # Shop schema
│   ├── Product.js         # Product schema
│   └── Order.js           # Order schema
├── routes/
│   ├── authRoutes.js      # Authentication routes
│   ├── shopRoutes.js      # Shop routes
│   ├── productRoutes.js   # Product routes
│   └── orderRoutes.js     # Order routes
├── scripts/
│   └── seed.js            # Database seeding script
├── .env                   # Environment variables (create this)
├── .env.example           # Example environment variables
├── .gitignore
├── package.json
├── server.js              # Main application file
└── README.md
```

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Request validation
- Protected routes with middleware
- Secure headers with CORS

## 🧪 Testing with Postman/Thunder Client

1. **Import the API endpoints** from this README
2. **Login first** to get the JWT token
3. **Copy the token** from the response
4. **Add to Authorization header** in subsequent requests:
   ```
   Authorization: Bearer <your_token_here>
   ```

## 📦 Database Models

### User
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: Enum ['customer', 'manager', 'super-admin']
- `shopId`: ObjectId (required for managers)

### Shop
- `name`: String (required)
- `ownerName`: String (required)
- `email`: String (required)
- `phone`: String (required)
- `address`: String (required)
- `totalRevenue`: Number (default: 0)

### Product
- `title`: String (required)
- `description`: String (required)
- `price`: Number (required, min: 0)
- `image`: String (required)
- `rating`: Number (0-5)
- `tags`: Array of Strings
- `shopId`: ObjectId (required)

### Order
- `userId`: ObjectId (required)
- `items`: Array of OrderItems
  - `productId`: ObjectId
  - `quantity`: Number
  - `priceAtPurchase`: Number
  - `shopId`: ObjectId
  - `comment`: String
- `subtotal`: Number (required)
- `status`: Enum ['processing', 'packed', 'shipped', 'out-for-delivery', 'delivered']
- `steps`: Array of TrackingSteps
- `etaBusinessDays`: Number (default: 5)

## 🚀 Deployment

### Production Checklist

1. **Update environment variables** for production
2. **Use a strong JWT secret**
3. **Configure MongoDB Atlas** or your production database
4. **Enable HTTPS**
5. **Set NODE_ENV=production**
6. **Configure proper CORS origins**
7. **Add rate limiting** (recommended)
8. **Set up logging** (recommended)

### Example Production .env
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/omnicart
JWT_SECRET=your_super_strong_production_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 💡 Support

For support, email support@omnicart.com or open an issue in the repository.

## 🙏 Acknowledgments

- Express.js for the web framework
- MongoDB for the database
- JWT for authentication
- bcrypt for password hashing
- All contributors and testers

---

Built with ❤️ for OmniCart E-commerce Platform

