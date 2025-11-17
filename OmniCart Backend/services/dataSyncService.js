const fs = require('fs/promises');
const path = require('path');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SHOPS_FILE = path.join(DATA_DIR, 'shops.json');

async function ensureDataDirectory() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureDataDirectory();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function buildProductEntry(product, shop, similarProductIds = []) {
  const productId = product._id.toString();
  const shopId = shop ? shop._id.toString() : null;
  return {
    product_id: productId,
    name: product.title,
    description: product.description,
    category: product.tags?.[0] || 'General',
    price: product.price,
    currency: 'USD',
    tags: product.tags || [],
    shop_id: shopId,
    shop_name: shop ? shop.name : null,
    owner_name: shop ? shop.ownerName : null,
    location: shop ? shop.address : null,
    avg_rating: typeof product.rating === 'number' ? product.rating : 0,
    reviews: product.reviews || [],
    similar_products: similarProductIds,
    similar_product_details: [],
    url: `/products/${productId}`,
    shop_url: shopId ? `/shops/${shopId}` : null,
    image: product.image || null,
    in_stock: true,
    last_updated: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
  };
}

function buildShopEntry(shop, shopProducts = []) {
  const totalProducts = shopProducts.length;
  const averageRating = totalProducts > 0
    ? shopProducts.reduce((sum, product) => sum + (product.avg_rating || 0), 0) / totalProducts
    : 0;

  const topProducts = shopProducts
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 5)
    .map((product) => product.product_id);

  const description = shop.description
    || `Trusted retailer operated by ${shop.ownerName} located at ${shop.address}.`;

  return {
    shop_id: shop._id.toString(),
    name: shop.name,
    owner: shop.ownerName,
    description,
    location: shop.address,
    rating: Number(averageRating.toFixed(2)) || 0,
    total_products: totalProducts,
    url: `/shops/${shop._id.toString()}`,
    top_products: topProducts,
  };
}

async function syncProductsJson() {
  const products = await Product.find().populate('shopId');
  const shopsMap = new Map();

  const productEntries = products.map((product) => {
    const shop = product.shopId || null;
    if (shop) {
      shopsMap.set(shop._id.toString(), shop);
    }
    return buildProductEntry(product, shop);
  });

  const productEntryMap = new Map(productEntries.map((entry) => [entry.product_id, entry]));

  // Build quick lookup for similarity scoring
  productEntries.forEach((entry) => {
    const similar = productEntries
      .filter((candidate) => candidate.product_id !== entry.product_id)
      .map((candidate) => {
        const sharedTags = candidate.tags.filter((tag) => entry.tags.includes(tag));
        const sameShop = candidate.shop_id === entry.shop_id;
        const score = sharedTags.length * 2 + (sameShop ? 1 : 0);
        return {
          id: candidate.product_id,
          score,
        };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((candidate) => candidate.id);

    entry.similar_products = similar;
    entry.similar_product_details = similar.map((id) => {
      const match = productEntryMap.get(id);
      return match
        ? { product_id: match.product_id, name: match.name, url: match.url, price: match.price, currency: match.currency }
        : { product_id: id };
    });
  });

  const payload = {
    generated_at: new Date().toISOString(),
    products: productEntries,
  };

  await writeJson(PRODUCTS_FILE, payload);
  return payload;
}

async function syncShopsJson(existingProductsPayload) {
  const shops = await Shop.find();
  const productsPayload = existingProductsPayload || await syncProductsJson();

  const productsByShop = productsPayload.products.reduce((acc, product) => {
    if (!product.shop_id) return acc;
    if (!acc[product.shop_id]) {
      acc[product.shop_id] = [];
    }
    acc[product.shop_id].push(product);
    return acc;
  }, {});

  const shopEntries = shops.map((shop) => {
    const shopProducts = productsByShop[shop._id.toString()] || [];
    return buildShopEntry(shop, shopProducts);
  });

  const payload = {
    generated_at: new Date().toISOString(),
    shops: shopEntries,
  };

  await writeJson(SHOPS_FILE, payload);
  return payload;
}

async function syncAllData() {
  const productsPayload = await syncProductsJson();
  await syncShopsJson(productsPayload);
}

module.exports = {
  syncProductsJson,
  syncShopsJson,
  syncAllData,
};
