const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const Groq = require('groq-sdk');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SHOPS_FILE = path.join(DATA_DIR, 'shops.json');
const KNOWLEDGE_BASE_FILE = path.join(DATA_DIR, 'knowledge-base.json');

const SYSTEM_PROMPT = `You are OmniCart Assistant, a friendly shopping guide.
Use the provided context to answer questions about products, shops, owners, or reviews.
Rules:
- Keep every answer concise, between 50 and 60 words.
- Avoid markdown emphasis and do not mention raw URLs or link syntax.
- Describe the most relevant product first, including name, price, stock, rating, and seller when available.
- Never mention or list sources, citations, or raw paths (such as /products/...).
- Do not ask the shopper if they want to continue; simply offer a clear recommendation.
- Mention similar options briefly only when helpful, without listing more than two.
- If information is missing, say: "I don’t have that info right now. Please check the product page."
- Do NOT invent details that are not in the context.
Context:
{{ retrieved_chunks }}`;

const SUPPORTED_GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'gemma2-9b-it',
];
const GROQ_MODEL = process.env.GROQ_MODEL || SUPPORTED_GROQ_MODELS[0];
const EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';

let groqClient = null;
let embeddingPipelinePromise = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

async function getEmbeddingPipeline() {
  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return pipeline('feature-extraction', EMBEDDING_MODEL);
    })();
  }
  return embeddingPipelinePromise;
}

async function readJson(filePath, fallback) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

async function writeKnowledgeBase(payload) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(KNOWLEDGE_BASE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
}

function buildProductChunk(product) {
  const lines = [
    `Product Name: ${product.name}`,
    `Product ID: ${product.product_id}`,
    `Description: ${product.description}`,
    `Category: ${product.category}`,
    `Price: ${product.price} ${product.currency}`,
    `Tags: ${product.tags.join(', ')}`,
    `Shop: ${product.shop_name || 'Unknown'} (${product.shop_id || 'N/A'})`,
    `Owner: ${product.owner_name || 'Unknown'}`,
    `Location: ${product.location || 'Unknown'}`,
    `Average Rating: ${product.avg_rating}`,
    `Reviews: ${(product.reviews || []).join(' | ') || 'No reviews available.'}`,
    `Similar Products: ${(product.similar_product_details || [])
      .map((item) => `${item.name || item.product_id} (${item.url || item.product_id})`)
      .join(', ') || 'None listed.'}`,
    `URL: ${product.url}`,
    `In Stock: ${product.in_stock ? 'Yes' : 'No'}`,
    `Last Updated: ${product.last_updated}`,
  ];

  return {
    id: `product:${product.product_id}`,
    type: 'product',
    metadata: {
      id: product.product_id,
      name: product.name,
      url: product.url,
      price: product.price,
      currency: product.currency,
      image: product.image,
      in_stock: product.in_stock,
      rating: product.avg_rating,
      tags: product.tags,
      shop_id: product.shop_id,
      shop_name: product.shop_name,
      shop_url: product.shop_url,
      similar_products: product.similar_product_details,
    },
    text: lines.join('\n'),
    hash: crypto.createHash('sha256').update(JSON.stringify(product)).digest('hex'),
  };
}

function buildShopChunk(shop) {
  const lines = [
    `Shop Name: ${shop.name}`,
    `Shop ID: ${shop.shop_id}`,
    `Owner: ${shop.owner}`,
    `Description: ${shop.description}`,
    `Location: ${shop.location}`,
    `Rating: ${shop.rating}`,
    `Total Products: ${shop.total_products}`,
    `Top Products: ${(shop.top_products || []).join(', ') || 'No products listed.'}`,
    `URL: ${shop.url}`,
  ];

  return {
    id: `shop:${shop.shop_id}`,
    type: 'shop',
    metadata: {
      id: shop.shop_id,
      name: shop.name,
      url: shop.url,
      owner: shop.owner,
      location: shop.location,
      rating: shop.rating,
      top_products: shop.top_products,
    },
    text: lines.join('\n'),
    hash: crypto.createHash('sha256').update(JSON.stringify(shop)).digest('hex'),
  };
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dot / (magnitudeA * magnitudeB);
}

async function embedText(text) {
  try {
    const embedder = await getEmbeddingPipeline();
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    const vector = Array.isArray(result) ? result : Array.from(result.data || result);
    return vector;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error.message);
    throw error;
  }
}

async function buildKnowledgeEntries() {
  const [productsData, shopsData] = await Promise.all([
    readJson(PRODUCTS_FILE, { products: [] }),
    readJson(SHOPS_FILE, { shops: [] }),
  ]);

  const productChunks = (productsData.products || []).map(buildProductChunk);
  const shopChunks = (shopsData.shops || []).map(buildShopChunk);

  return [...productChunks, ...shopChunks];
}

async function refreshKnowledgeBase() {
  try {
    const entries = await buildKnowledgeEntries();
    const existing = await readJson(KNOWLEDGE_BASE_FILE, { entries: [] });
    const embeddingMap = new Map((existing.entries || []).map((entry) => [entry.id, entry]));

    const updatedEntries = [];
    for (const entry of entries) {
      const existingEntry = embeddingMap.get(entry.id);
      if (existingEntry && existingEntry.hash === entry.hash && Array.isArray(existingEntry.embedding)) {
        updatedEntries.push(existingEntry);
      } else {
        const embedding = await embedText(entry.text);
        updatedEntries.push({ ...entry, embedding });
      }
    }

    const payload = {
      generated_at: new Date().toISOString(),
      embedding_model: EMBEDDING_MODEL,
      entries: updatedEntries,
    };

    await writeKnowledgeBase(payload);
    return payload;
  } catch (error) {
    console.error('⚠️  Failed to refresh knowledge base:', error.message);
    throw error;
  }
}

async function loadKnowledgeBase() {
  const knowledgeBase = await readJson(KNOWLEDGE_BASE_FILE, { entries: [] });
  return knowledgeBase.entries || [];
}

function buildContextSection(entries) {
  if (!entries.length) {
    return 'No relevant context was retrieved from the knowledge base.';
  }

  return entries
    .map((entry) => {
      const header = entry.type === 'product' ? 'Product' : 'Shop';
      return `${header} Insight:\n${entry.text}`;
    })
    .join('\n\n');
}

function extractKeywords(message) {
  if (!message) return [];
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'from', 'shop', 'store', 'me', 'my', 'show', 'list', 'give', 'need', 'want', 'please', 'product', 'products', 'some', 'options', 'with']);
  return (message.toLowerCase().match(/\b[a-z0-9]+\b/g) || [])
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function extractShopQuery(message) {
  if (!message) return null;
  const match = message.toLowerCase().match(/from\s+([^.,!?]+?)\s+(?:shop|store)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function productMatchesKeywords(productMeta, keywords) {
  if (!keywords.length) return true;
  const haystack = [
    productMeta?.name,
    ...(productMeta?.tags || []),
    productMeta?.category,
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase())
    .join(' ');

  return keywords.some((keyword) => haystack.includes(keyword));
}

function findProductsByShop(entries, shopQuery, keywords) {
  const matches = [];
  if (!shopQuery) return matches;
  const normalizedShop = shopQuery.toLowerCase();

  entries.forEach((entry) => {
    if (entry.type !== 'product') return;
    const meta = entry.metadata || {};
    const shopName = (meta.shop_name || '').toLowerCase();
    if (!shopName.includes(normalizedShop)) return;

    if (!productMatchesKeywords(meta, keywords)) return;

    matches.push({ entry, meta });
  });

  return matches;
}

function findProductsByKeywords(entries, keywords) {
  const matches = [];
  entries.forEach((entry) => {
    if (entry.type !== 'product') return;
    const meta = entry.metadata || {};
    if (!productMatchesKeywords(meta, keywords)) return;
    matches.push({ entry, meta });
  });
  return matches;
}

function sanitizeReply(answer) {
  if (!answer) return '';

  let text = answer
    .replace(/\*\*|__/g, '')
    .replace(/\[[^\]]*\]\([^\)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/http[s]?:\/\/[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  text = text.replace(/Sources?:[\s\S]*$/i, '').trim();

  const words = text.split(' ');
  if (words.length > 60) {
    text = words.slice(0, 60).join(' ');
  }

  return text.trim();
}

function buildProductSuggestions(entries) {
  const suggestions = [];
  const seen = new Set();

  for (const { entry } of entries) {
    if (!entry || entry.type !== 'product') continue;
    const meta = entry.metadata || {};
    const id = meta.id || entry.id?.replace('product:', '');
    if (!id || seen.has(id)) continue;
    seen.add(id);

    suggestions.push({
      id,
      name: meta.name || 'Product',
      url: meta.url || `/products/${id}`,
      price: meta.price,
      currency: meta.currency,
      image: meta.image,
      inStock: typeof meta.in_stock === 'boolean' ? meta.in_stock : true,
      rating: meta.rating,
      shopId: meta.shop_id,
      shopName: meta.shop_name,
      shopUrl: meta.shop_url,
    });
  }

  return suggestions.slice(0, 5);
}

function buildShopSuggestions(entries) {
  const suggestions = [];
  const seen = new Set();

  for (const { entry } of entries) {
    if (!entry || entry.type !== 'shop') continue;
    const meta = entry.metadata || {};
    const id = meta.id || entry.id?.replace('shop:', '');
    if (!id || seen.has(id)) continue;
    seen.add(id);

    suggestions.push({
      id,
      name: meta.name || 'Shop',
      url: meta.url || `/shops/${id}`,
      owner: meta.owner,
      rating: meta.rating,
      location: meta.location,
      topProducts: meta.top_products,
    });
  }

  return suggestions.slice(0, 5);
}

function inferIntent(message, products, shops) {
  const text = (message || '').toLowerCase();

  if (products?.length && /compare|similar/.test(text)) {
    return 'recommend_similar';
  }

  if (/(buy|purchase|shop for|need a|looking for|recommend)/.test(text)) {
    return 'find_products';
  }

  if (/(shop|store|seller|owner)/.test(text)) {
    return 'find_shops';
  }

  if (/(order|track|status)/.test(text)) {
    return 'order_status';
  }

  if (/(return|refund)/.test(text)) {
    return 'return_policy';
  }

  if (/(profile|account|address|update info)/.test(text)) {
    return 'update_profile';
  }

  if (/(support|help|contact|agent)/.test(text)) {
    return 'contact_support';
  }

  return 'general';
}

function buildActions(intent, products, shops) {
  const actions = [];
  const addAction = (action) => {
    const key = `${action.type}|${action.href || ''}|${action.label}`;
    if (!actions.find((a) => `${a.type}|${a.href || ''}|${a.label}` === key)) {
      actions.push(action);
    }
  };

  (products || []).slice(0, 3).forEach((product) => {
    if (product.url) {
      addAction({
        type: 'navigate',
        label: `View ${product.name}`,
        href: product.url,
        data: { productId: product.id },
      });
    }
    if (product.shopUrl) {
      addAction({
        type: 'navigate',
        label: `Visit ${product.shopName || 'shop'} for ${product.name}`,
        href: product.shopUrl,
        data: { shopId: product.shopId },
      });
    }
  });

  (shops || []).slice(0, 3).forEach((shop) => {
    if (shop.url) {
      addAction({
        type: 'navigate',
        label: `Visit ${shop.name}`,
        href: shop.url,
        data: { shopId: shop.id },
      });
    }
  });

  switch (intent) {
    case 'find_products':
      if (!products?.length) {
        addAction({ type: 'navigate', label: 'Browse all products', href: '/products' });
      }
      break;
    case 'find_shops':
      if (!shops?.length) {
        addAction({ type: 'navigate', label: 'Browse featured shops', href: '/shop' });
      }
      break;
    case 'order_status':
      addAction({ type: 'navigate', label: 'View my orders', href: '/orders' });
      break;
    case 'update_profile':
      addAction({ type: 'navigate', label: 'Update profile', href: '/profile' });
      break;
    case 'contact_support':
      addAction({ type: 'navigate', label: 'Contact support', href: '/support' });
      break;
    case 'return_policy':
      addAction({ type: 'navigate', label: 'Return & refund policy', href: '/support/returns' });
      break;
    default:
      break;
  }

  return actions;
}

function composeProductReply(products, shopQuery) {
  if (!products?.length) {
    return '';
  }

  const [primary, ...rest] = products;
  const priceLabel = typeof primary.price === 'number'
    ? `${primary.currency || 'USD'} ${primary.price}`
    : 'a listed price';
  const stockLabel = typeof primary.inStock === 'boolean'
    ? (primary.inStock ? 'currently in stock' : 'currently unavailable')
    : 'available';
  const shopLabel = primary.shopName ? `from ${primary.shopName}` : '';
  const ratingLabel = typeof primary.rating === 'number' && primary.rating > 0
    ? `It carries an average rating of ${primary.rating.toFixed(1)}.`
    : '';

  const intro = `${primary.name} ${shopLabel} is priced at ${priceLabel} and is ${stockLabel}. ${ratingLabel}`.trim();

  const companions = rest.slice(0, 2).map((product) => {
    const price = typeof product.price === 'number'
      ? `${product.currency || 'USD'} ${product.price}`
      : 'a listed price';
    return `${product.name} (${price})`;
  });

  let suggestion = '';
  if (companions.length) {
    suggestion = `You can also consider ${companions.join(' or ')}.`;
  }

  if (shopQuery && !primary.shopName) {
    suggestion += ' This result matches your requested shop search.';
  }

  const combined = `${intro} ${suggestion}`.replace(/\s+/g, ' ').trim();
  const words = combined.split(' ');
  if (words.length > 60) {
    return words.slice(0, 60).join(' ');
  }
  return combined;
}

async function generateResponse(message) {
  const groq = getGroqClient();
  if (!groq) {
    return {
      reply: 'The AI assistant is not configured yet. Please contact support to enable it.',
      sources: [],
      products: [],
      shops: [],
      actions: [],
      intent: 'configuration_error',
    };
  }

  let entries = await loadKnowledgeBase();
  if (!entries.length) {
    await refreshKnowledgeBase();
    entries = await loadKnowledgeBase();
  }

  if (!entries.length) {
    return {
      reply: 'I do not have enough data to answer that right now. Please try again later.',
      sources: [],
      products: [],
      shops: [],
      actions: [],
      intent: 'no_data',
    };
  }

  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));

  let queryEmbedding;
  try {
    queryEmbedding = await embedText(message);
  } catch (error) {
    return {
      reply: 'I ran into an issue understanding that question. Please try rephrasing it.',
      sources: [],
      products: [],
      shops: [],
      actions: [],
      intent: 'embedding_error',
    };
  }

  const scored = entries
    .filter((entry) => Array.isArray(entry.embedding))
    .map((entry) => ({
      entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const relevantEntries = scored.filter((item) => item.score > 0.2).map((item) => item.entry);

  const keywords = extractKeywords(message);
  const shopQuery = extractShopQuery(message);
  const lowerMessage = (message || '').toLowerCase();
  const wantsList = /(list|show|give|recommend|options|suggest|display|find)/.test(lowerMessage);

  const finalProductEntries = new Map();
  const finalProducts = [];

  const addProductFromMeta = (meta, entry) => {
    const id = meta.id || entry.id?.replace('product:', '');
    if (!id) return;
    finalProducts.push({
      id,
      name: meta.name || 'Product',
      url: meta.url || `/products/${id}`,
      price: meta.price,
      currency: meta.currency,
      image: meta.image,
      inStock: typeof meta.in_stock === 'boolean' ? meta.in_stock : true,
      rating: meta.rating,
      shopId: meta.shop_id,
      shopName: meta.shop_name,
      shopUrl: meta.shop_url,
    });
    if (entry) {
      finalProductEntries.set(entry.id, entry);
    }
  };

  if (shopQuery) {
    const matches = findProductsByShop(entries, shopQuery, keywords);
    matches.slice(0, 3).forEach(({ entry, meta }) => addProductFromMeta(meta, entry));
  } else if (wantsList && keywords.length) {
    const matches = findProductsByKeywords(entries, keywords);
    matches.slice(0, 3).forEach(({ entry, meta }) => addProductFromMeta(meta, entry));
  }

  if (!finalProducts.length) {
    const vectorSuggestions = buildProductSuggestions(scored);
    const primary = vectorSuggestions.length ? [vectorSuggestions[0]] : [];
    primary.forEach((product) => {
      addProductFromMeta(
        {
          id: product.id,
          name: product.name,
          url: product.url,
          price: product.price,
          currency: product.currency,
          image: product.image,
          in_stock: product.inStock,
          rating: product.rating,
          shop_id: product.shopId,
          shop_name: product.shopName,
          shop_url: product.shopUrl,
        },
        entryMap.get(`product:${product.id}`)
      );
    });
  }

  const uniqueShops = new Map();
  finalProducts.forEach((product) => {
    if (product.shopId && !uniqueShops.has(product.shopId)) {
      uniqueShops.set(product.shopId, {
        id: product.shopId,
        name: product.shopName || 'Shop',
        url: product.shopUrl || `/shops/${product.shopId}`,
      });
    }
  });
  const finalShops = Array.from(uniqueShops.values());

  let intent = shopQuery
    ? 'list_products_by_shop'
    : wantsList && keywords.length
    ? 'list_products'
    : inferIntent(message, finalProducts, finalShops);

  const actions = buildActions(intent, finalProducts, finalShops);

  if (finalProducts.length) {
    const reply = composeProductReply(finalProducts, shopQuery);
    return {
      reply: reply || 'Here are the closest matches I found for your request.',
      sources: [],
      intent,
      actions,
      products: finalProducts,
      shops: finalShops,
    };
  }

  const contextEntriesMap = new Map(relevantEntries.map((entry) => [entry.id, entry]));
  finalProductEntries.forEach((entry, id) => {
    if (!contextEntriesMap.has(id)) {
      contextEntriesMap.set(id, entry);
    }
  });
  const finalContextEntries = Array.from(contextEntriesMap.values());
  const context = buildContextSection(finalContextEntries);

  let systemMessage = SYSTEM_PROMPT.replace('{{ retrieved_chunks }}', context);

  const optionLines = [];
  finalProducts.slice(0, 3).forEach((product, index) => {
    const priceLabel = typeof product.price === 'number'
      ? `${product.currency || 'USD'} ${product.price}`
      : 'Price unavailable';
    optionLines.push(`Product ${index + 1}: ${product.name} (${priceLabel})`);
  });

  if (optionLines.length) {
    systemMessage += `\n\nCandidate options available to assist the shopper:\n${optionLines.join('\n')}\nWhen relevant, describe these options and encourage the shopper to use the provided buttons.`;
  }

  try {
    const primaryModel = GROQ_MODEL;
    const modelsToTry = [primaryModel, ...SUPPORTED_GROQ_MODELS.filter((m) => m !== primaryModel)];

    for (const candidate of modelsToTry) {
      try {
        const response = await groq.chat.completions.create({
          model: candidate,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: message },
          ],
          temperature: 0.2,
        });

        const rawAnswer = response.choices?.[0]?.message?.content?.trim()
          || 'I could not find enough information to answer that. Please try the product page.';

        const formattedReply = sanitizeReply(rawAnswer);

        if (candidate !== primaryModel) {
          console.warn(`⚠️  Switched Groq model from ${primaryModel} to ${candidate} due to availability.`);
        }

        return {
          reply: formattedReply,
          sources: [],
          intent,
          actions,
          products: finalProducts,
          shops: finalShops,
        };
      } catch (candidateError) {
        const code = candidateError?.response?.data?.error?.code;
        const messageText = candidateError?.response?.data?.error?.message || candidateError.message;
        console.warn(`⚠️  Groq model ${candidate} failed: ${messageText}`);

        if (code !== 'model_decommissioned' && code !== 'model_not_found') {
          throw candidateError;
        }
      }
    }

    throw new Error('No available Groq model could satisfy the request.');
  } catch (error) {
    console.error('❌ Groq chat error:', error?.response?.data || error.message || error);

    const friendlyMessage = error?.response?.data?.error?.message
      || error.message
      || 'The AI assistant is temporarily unavailable. Please try again later.';

    return {
      reply: friendlyMessage,
      sources: [],
      products: [],
      shops: [],
      actions: [],
      intent: 'error',
    };
  }
}

module.exports = {
  refreshKnowledgeBase,
  generateResponse,
};