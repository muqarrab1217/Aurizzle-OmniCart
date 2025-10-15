# Fix for Vercel Directory Space Error

## ❌ **Error Encountered**
```
Error: A Serverless Function has an invalid name: "'OmniCart Ecommerce/___next_launcher.cjs'". 
They must be less than 128 characters long and must not contain any space.
```

## 🔍 **Root Cause**
The directory name "OmniCart Ecommerce" contains a **space**, which causes Vercel to create invalid serverless function names that violate their naming restrictions.

## ✅ **Solutions**

### **Option 1: Configure Vercel Dashboard (Recommended)**

**In your Vercel project settings:**

1. **Go to Settings → General**
2. **Set Root Directory to**: `OmniCart Ecommerce`
3. **Go to Settings → Build & Output Settings**
4. **Set Build Command**: `pnpm install && pnpm run build`
5. **Set Output Directory**: `.next`
6. **Set Install Command**: `pnpm install`
7. **Framework Preset**: Next.js

### **Option 2: Rename Directory (Alternative)**

If Option 1 doesn't work, rename the directory to remove the space:

1. **Rename** `OmniCart Ecommerce` to `omnicart-ecommerce`
2. **Update** any references in configuration files
3. **Redeploy** from Vercel

### **Option 3: Move to Repository Root**

Move the frontend files to the repository root:

1. **Move all files** from `OmniCart Ecommerce/` to repository root
2. **Update** any relative paths
3. **Remove** the subdirectory entirely

## 🎯 **Recommended Action**

**Use Option 1** - Configure Vercel Dashboard settings:

### **Vercel Dashboard Configuration:**
```
Root Directory: OmniCart Ecommerce
Build Command: pnpm install && pnpm run build
Output Directory: .next
Install Command: pnpm install
Framework: Next.js
```

### **Why This Works:**
- Vercel will properly handle the directory name with spaces
- The build will run from the correct directory
- Serverless functions will have valid names
- No code changes required

## 📋 **Steps to Fix**

1. **Open Vercel Dashboard** → Your Project
2. **Settings** → General → Set Root Directory: `OmniCart Ecommerce`
3. **Settings** → Build & Output Settings → Update build commands
4. **Save Settings**
5. **Redeploy** the project

## ✅ **Expected Result**

After proper configuration:
- ✅ **No more serverless function name errors**
- ✅ **Build completes successfully**
- ✅ **Deployment works without 404 errors**
- ✅ **All routes function properly**

## 🚨 **If Still Having Issues**

If the space in the directory name continues to cause problems:

1. **Rename the directory** to `omnicart-ecommerce`
2. **Update Vercel Root Directory** to the new name
3. **Redeploy**

The key is ensuring Vercel knows exactly where to find your Next.js application and can handle the directory name properly.
