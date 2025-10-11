# 🎯 Complete Setup Guide - MongoDB Atlas Edition

Your **"Failed to fetch"** error is because the **backend server is not running**. Follow these steps to fix it!

---

## 🔧 What You Need to Do

### BACKEND SETUP (Do This First!)

#### 1. Create Backend .env File

**Location:** `OmniCart Backend/.env`

**Content:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/omnicart?retryWrites=true&w=majority
JWT_SECRET=omnicart_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**⚠️ Replace:**
- `your-username` → Your MongoDB Atlas database username
- `your-password` → Your MongoDB Atlas database password  
- `your-cluster` → Your cluster name from Atlas

**📝 Example:**
```env
MONGODB_URI=mongodb+srv://johnsmith:mySecurePass123@cluster0.abc123.mongodb.net/omnicart?retryWrites=true&w=majority
```

#### 2. Get Your MongoDB Atlas Connection String

**Where to find it:**
1. Login to https://cloud.mongodb.com/
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. **Important:** Add `/omnicart` after `.net/` like shown above

#### 3. Whitelist Your IP Address

**In MongoDB Atlas:**
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **Confirm**

#### 4. Install Backend Dependencies

```bash
cd "c:\Users\Just\Documents\Aurizzle Products\OmniCart Backend"
npm install
```

#### 5. Test Connection (Recommended!)

```bash
npm run test-connection
```

**If successful, you'll see:**
```
✅ SUCCESS! Connected to MongoDB Atlas
```

**If failed, the script will tell you exactly what's wrong!**

#### 6. Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
╔════════════════════════════════════════╗
║     OmniCart Backend API Server        ║
║  Status: Running                       ║
║  Port: 5000                            ║
╚════════════════════════════════════════╝

✅ MongoDB Connected: cluster0...
```

**✅ BACKEND IS NOW RUNNING!**

#### 7. Verify Backend Works

Open browser: `http://localhost:5000/api/health`

Should show:
```json
{
  "success": true,
  "message": "OmniCart API is running"
}
```

---

### FRONTEND SETUP

#### 1. Create Frontend .env.local File

**Location:** `OmniCart Ecommerce/.env.local`

**Content:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note:** Create this file manually if it doesn't exist!

#### 2. Install Frontend Dependencies (if not done)

```bash
cd "c:\Users\Just\Documents\Aurizzle Products\OmniCart Ecommerce"
npm install
```

#### 3. Start Frontend

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## ✅ Test Your Signup!

1. **Make sure both servers are running:**
   - Backend: Terminal showing "OmniCart Backend API Server"
   - Frontend: Terminal showing "Ready in..."

2. **Go to:** `http://localhost:3000/signup`

3. **Fill in:**
   - Name: Your Name
   - Email: youremail@example.com
   - Password: password123 (minimum 6 characters)

4. **Click "Sign up"**

5. **Success!** You should be logged in and redirected to home page! 🎉

---

## 🐛 Troubleshooting

### Error: "Cannot connect to server"

**Cause:** Backend is not running

**Fix:**
1. Open new terminal
2. `cd "OmniCart Backend"`
3. `npm run dev`
4. Wait for "MongoDB Connected" message
5. Try signup again

### Error: "Authentication failed" (in backend terminal)

**Cause:** Wrong MongoDB credentials

**Fix:**
1. Check your MongoDB Atlas **Database Access**
2. Make sure you're using DATABASE USER password (not your Atlas login)
3. Update `.env` file with correct credentials
4. Restart backend

### Error: "MongooseServerSelectionError" or "timed out"

**Cause:** IP not whitelisted OR wrong connection string

**Fix:**
1. Go to MongoDB Atlas → **Network Access**
2. Add IP: 0.0.0.0/0 (Allow all) for development
3. Verify connection string format in `.env`
4. Restart backend

### Frontend Still Shows "Failed to fetch"

**Checklist:**
- [ ] Backend terminal shows "Running on Port 5000"?
- [ ] Can you open `http://localhost:5000/api/health`?
- [ ] `.env.local` exists in frontend folder?
- [ ] `.env.local` has correct API URL?
- [ ] Did you restart frontend after creating `.env.local`?

---

## 📁 File Structure Check

Make sure you have these files:

```
Aurizzle Products/
├── OmniCart Backend/
│   ├── .env                 ← YOU NEED TO CREATE THIS!
│   ├── server.js
│   ├── package.json
│   └── ...
│
└── OmniCart Ecommerce/
    ├── .env.local          ← YOU NEED TO CREATE THIS!
    ├── package.json
    └── ...
```

---

## 🎯 Quick Checklist

Before testing signup:

**Backend:**
- [ ] `.env` file created in `OmniCart Backend`
- [ ] MongoDB Atlas connection string in `.env`
- [ ] IP whitelisted in MongoDB Atlas
- [ ] `npm install` completed
- [ ] `npm run test-connection` shows success
- [ ] `npm run dev` running (don't close terminal!)
- [ ] `http://localhost:5000/api/health` works in browser

**Frontend:**
- [ ] `.env.local` file created in `OmniCart Ecommerce`
- [ ] `npm install` completed
- [ ] `npm run dev` running (don't close terminal!)
- [ ] Can access `http://localhost:3000`

---

## 🚀 Next Steps After Signup Works

1. **Create a shop:**
   - Click your profile icon
   - Click "Create Shop"
   - Fill in shop details
   - You become a manager!

2. **Add products:**
   - Go to "Products" in navbar
   - Add product details
   - Your shop now has products!

3. **Test shopping:**
   - Browse products
   - Add to cart
   - Checkout
   - View orders!

---

## 📚 Additional Help

- **Backend Detailed Setup:** `OmniCart Backend/START_HERE.md`
- **MongoDB Atlas Guide:** `OmniCart Backend/MONGODB_ATLAS_SETUP.md`
- **Frontend Setup:** `OmniCart Ecommerce/SETUP.md`
- **API Documentation:** `OmniCart Backend/README.md`

---

## 💡 Pro Tips

1. **Keep both terminals open** - One for backend, one for frontend
2. **Test connection first** - Use `npm run test-connection` before starting server
3. **Check health endpoint** - Always verify `http://localhost:5000/api/health` works
4. **Look at terminal output** - Errors are shown there!
5. **Use strong passwords** - Avoid special characters in MongoDB password (or URL-encode them)

---

## ✅ Success Indicators

**Backend Running:**
```
✅ MongoDB Connected: cluster0...
╔════════════════════════════════════════╗
║     OmniCart Backend API Server        ║
║  Status: Running                       ║
╚════════════════════════════════════════╝
```

**Frontend Running:**
```
Ready - started server on 0.0.0.0:3000
✓ Compiled in X ms
```

**Signup Works:**
- Form submits without errors
- You're redirected to home page
- You see your name in navbar

---

**🎉 You're all set! Happy coding!**

