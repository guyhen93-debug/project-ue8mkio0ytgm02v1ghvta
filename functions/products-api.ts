import { createSuperdevClient } from 'npm:@superdevhq/client@0.1.51';

const superdev = createSuperdevClient({ 
  appId: Deno.env.get('SUPERDEV_APP_ID'), 
});

interface ProductData {
  name: string;
  display_name_he: string;
  size_label: string;
  description_en: string;
  description_he: string;
  image_url?: string;
  is_active?: boolean;
}

// Default products data
const DEFAULT_PRODUCTS = [
  {
    name: 'Sand 0-4mm',
    display_name_he: 'חול מחצבה (0-4) מ"מ',
    size_label: '0-4 מ"מ',
    description_en: 'Quarry sand 0-4 mm - high quality, suitable for construction work.',
    description_he: 'חול מחצבה (0-4 מ"מ) - איכותי, מותאם לעבודות בנייה.',
    image_url: '/favicon.ico',
    is_active: true
  },
  {
    name: 'Sesame 4-9.5mm',
    display_name_he: 'שומשום (4-9.5) מ"מ',
    size_label: '4-9.5 מ"מ',
    description_en: 'Sesame aggregate 4-9.5 mm for concrete and construction.',
    description_he: 'אגרגט שומשום 4-9.5 מ"מ לבטון ועבודות בנייה.',
    image_url: '/favicon.ico',
    is_active: true
  },
  {
    name: 'Lentil 9.5-19mm',
    display_name_he: 'עדש (9.5–19) מ"מ',
    size_label: '9.5–19 מ"מ',
    description_en: 'Lentil aggregate 9.5-19 mm for heavy construction.',
    description_he: 'אגרגט עדש 9.5–19 מ"מ לעבודות בנייה כבדות.',
    image_url: '/favicon.ico',
    is_active: true
  },
  {
    name: 'Polia 19-25mm',
    display_name_he: 'פוליה (19-25) מ"מ',
    size_label: '19-25 מ"מ',
    description_en: 'Polia aggregate 19-25 mm for infrastructure projects.',
    description_he: 'אגרגט פוליה 19-25 מ"מ לפרויקטי תשתית.',
    image_url: '/favicon.ico',
    is_active: true
  },
  {
    name: 'Granite 10-60cm',
    display_name_he: 'אבן גרניט (10-60) ס"מ',
    size_label: '10-60 ס"מ',
    description_en: 'Granite stone 10-60 cm for landscaping and construction.',
    description_he: 'אבן גרניט 10-60 ס"מ לגינון ועבודות בנייה.',
    image_url: '/favicon.ico',
    is_active: true
  }
];

// Cache flag to avoid checking DB on every request
let productsInitialized = false;

async function initializeDefaultProducts() {
  // Skip if already initialized in this process
  if (productsInitialized) {
    return;
  }

  try {
    // Check if products already exist
    const existingProducts = await superdev.entities.Product.list('created_at', 1);
    if (existingProducts.length > 0) {
      productsInitialized = true;
      return; // Products already initialized
    }

    // Create default products
    for (const productData of DEFAULT_PRODUCTS) {
      await superdev.entities.Product.create(productData);
    }

    productsInitialized = true;
    console.log('Default products initialized successfully');
  } catch (error) {
    console.error('Error initializing default products:', error);
  }
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    superdev.auth.setToken(token);
    
    const user = await superdev.auth.me();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const method = req.method;
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await req.json() : null;

    // Initialize default products on first request
    await initializeDefaultProducts();

    // GET /products - List all products
    if (method === 'GET' && url.pathname === '/') {
      try {
        // Read parameters from query string for GET requests
        const params = url.searchParams;
        const filter = params.get('filter') ? JSON.parse(params.get('filter')!) : undefined;
        const sort = params.get('sort') || 'name';
        const limit = params.get('limit') ? parseInt(params.get('limit')!) : 100;

        let products;
        if (filter) {
          products = await superdev.entities.Product.filter(filter, sort, limit);
        } else {
          products = await superdev.entities.Product.list(sort, limit);
        }

        return new Response(JSON.stringify({ success: true, data: products }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /products/:id - Get single product
    if (method === 'GET' && url.pathname.startsWith('/')) {
      const productId = url.pathname.slice(1);
      
      try {
        const product = await superdev.entities.Product.get(productId);
        if (!product) {
          return new Response(JSON.stringify({ success: false, error: 'Product not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, data: product }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /products - Create new product (managers only)
    if (method === 'POST' && url.pathname === '/') {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const productData: ProductData = body;

      try {
        // Set default values
        productData.is_active = productData.is_active !== false;
        productData.image_url = productData.image_url || '/favicon.ico';

        const newProduct = await superdev.entities.Product.create(productData);

        return new Response(JSON.stringify({ success: true, data: newProduct }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating product:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /products/:id - Update product (managers only)
    if (method === 'PUT' && url.pathname.startsWith('/')) {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const productId = url.pathname.slice(1);
      const updates = body;

      try {
        const existingProduct = await superdev.entities.Product.get(productId);
        if (!existingProduct) {
          return new Response(JSON.stringify({ success: false, error: 'Product not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const updatedProduct = await superdev.entities.Product.update(productId, updates);

        return new Response(JSON.stringify({ success: true, data: updatedProduct }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error updating product:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /products/:id - Delete product (managers only)
    if (method === 'DELETE' && url.pathname.startsWith('/')) {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const productId = url.pathname.slice(1);

      try {
        const existingProduct = await superdev.entities.Product.get(productId);
        if (!existingProduct) {
          return new Response(JSON.stringify({ success: false, error: 'Product not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if product is used in any orders
        const ordersUsingProduct = await superdev.entities.Order.filter({ product_id: productId });
        if (ordersUsingProduct.length > 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Cannot delete product that is used in existing orders' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await superdev.entities.Product.delete(productId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Products API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});