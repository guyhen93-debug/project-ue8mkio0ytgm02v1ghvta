# ניתוח ארכיטקטורת מערכת - First Principles Analysis

**תאריך:** 16.01.2026
**מבצע:** ניתוח אוטומטי
**סטטוס:** דוח מלא

---

## תקציר מנהלים

המערכת היא אפליקציה לניהול הזמנות חומרי בנייה (אגרגטים) באזור אילת. הניתוח זיהה **12 בעיות קריטיות** ו-**8 פריטי חוב טכני** שדורשים טיפול. הבעיות העיקריות נוגעות לשלמות נתונים (Referential Integrity), טיפול לא מספק בשגיאות בשטח, וכפילות קוד משמעותית.

---

## חלק א': מודל הנתונים והקשרים

### 1. סכמת הישויות (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     CLIENT      │       │      SITE       │       │     ORDER       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ client_id (FK)  │       │ id (PK)         │
│ name            │       │ id (PK)         │◄──────│ site_id (FK)    │
│ is_active       │       │ site_name       │       │ client_id (FK)  │──┐
└─────────────────┘       │ region_type     │       │ product_id (FK) │  │
                          │ contact_name    │       │ order_number    │  │
                          │ contact_phone   │       │ quantity_tons   │  │
                          │ is_active       │       │ delivery_date   │  │
                          └─────────────────┘       │ status          │  │
                                                    └─────────────────┘  │
┌─────────────────┐       ┌─────────────────┐                            │
│    PRODUCT      │       │   NOTIFICATION  │                            │
├─────────────────┤       ├─────────────────┤                            │
│ id (PK)         │◄──────│ order_id (FK)   │                            │
│ name_he         │       │ recipient_email │                            │
│ name_en         │       │ type            │                            │
│ size            │       │ message         │                            │
│ supplier        │       │ is_read         │                            │
│ is_active       │       └─────────────────┘                            │
└─────────────────┘                                                      │
                          ┌─────────────────┐                            │
                          │     MESSAGE     │                            │
                          ├─────────────────┤                            │
                          │ order_id (FK)   │────────────────────────────┘
                          │ sender_email    │
                          │ recipient_email │
                          │ content         │
                          └─────────────────┘
```

### 2. בעיות שלמות נתונים (Referential Integrity) - קריטי 🔴

#### 2.1 אין אכיפת Foreign Keys ברמת הDB

**מיקום:** `entities/*.json`

SuperDev לא מספק FK constraints ברמת בסיס הנתונים. ההגדרות ב-JSON הן descriptive בלבד:

```json
// entities/Order.json:9-16
"client_id": {
  "type": "string",
  "description": "The ID of the client (FK→clients.id)"  // תיעוד בלבד!
}
```

**השלכות:**
- אפשר ליצור הזמנה עם `client_id` שלא קיים
- אפשר למחוק לקוח בעוד יש לו הזמנות פעילות (אם עוקפים את ה-API)
- נתונים יכולים להפוך ל"יתומים" בקלות

#### 2.2 וולידציה חלקית ביצירת Order

**מיקום:** `functions/orders-api.ts:173-252`

```typescript
// POST /orders - Create new order
if (method === 'POST' && url.pathname === '/') {
  const orderData: OrderData = body;

  // ✅ בודק את התאריך
  const dateValidation = validateOrderDate(...);

  // ✅ בודק כמות עבור משלוח חיצוני
  if (orderData.delivery_method === 'external') { ... }

  // ⚠️ בודק אתר רק אם קיים site_id
  if (orderData.site_id) { ... }

  // 🔴 לא בודק אם client_id קיים כלל!
  // 🔴 לא בודק אם product_id קיים!

  const newOrder = await superdev.entities.Order.create(orderData);
}
```

#### 2.3 תרחישים שמייצרים רשומות יתומות

| תרחיש | קובץ | שורה | סיכון |
|--------|------|------|-------|
| יצירת Order עם client_id לא קיים | orders-api.ts | 222 | גבוה |
| יצירת Order עם product_id לא קיים | orders-api.ts | 222 | גבוה |
| מחיקה ישירה מ-DB (bypass API) | - | - | קריטי |
| שגיאה באמצע יצירת notification | orders-api.ts | 225-239 | בינוני |

#### 2.4 מנגנון Workaround קיים - `unlinked_site`

**מיקום:** `src/services/dataService.ts:154-206`

המערכת מכילה מנגנון לזיהוי והתמודדות עם רשומות יתומות:

```typescript
// dataService.ts:159-186
if (order.site_id && !order.unlinked_site) {
  const site = siteMap.get(order.site_id);
  if (site) {
    // ... תקין
  } else {
    // Order references a non-existent site (orphaned reference)
    unlinkedSite = true;
    orphanedReference = true;
    siteName = 'Unlinked (Orphaned)';
    console.warn(`Order ${order.order_number} references non-existent site`);
  }
}
```

**הערכה:** מנגנון תגובתי טוב, אך לא מונע את הבעיה מלכתחילה.

---

## חלק ב': ניתוח טיפול בשגיאות

### 3. Frontend - dataService.ts

#### 3.1 מנגנון Retry - מימוש טוב ✅

**מיקום:** `src/services/dataService.ts:13-42`

```typescript
static async withRetry<T>(
  operation: () => Promise<T>,
  retries: number = this.retryCount  // 3 ניסיונות
): Promise<DataServiceResult<T>> {
  for (let i = 0; i <= retries; i++) {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries) {
        return {
          success: false,
          data: null as T,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, this.retryDelay * (i + 1))
      );
    }
  }
}
```

**יתרונות:**
- Exponential backoff (1s, 2s, 3s)
- מספר ניסיונות מוגדר
- לוגים לכל כישלון

#### 3.2 בעיה: הסתרת שגיאות ב-getOrdersWithRelations 🔴

**מיקום:** `src/services/dataService.ts:129-232`

```typescript
static async getOrdersWithRelations(...): Promise<any[]> {
  try {
    // ...
  } catch (error) {
    console.error('Error in getOrdersWithRelations:', error);
    return [];  // 🔴 מסתיר את השגיאה מהמשתמש!
  }
}
```

**השלכות:**
- המשתמש רואה "אין הזמנות" במקום הודעת שגיאה
- אין אפשרות לזהות בעיות רשת או DB

#### 3.3 בעיה: הסתרת שגיאות ב-DataContext 🔴

**מיקום:** `src/contexts/DataContext.tsx:33-37`

```typescript
const [productsData, sitesData, clientsData] = await Promise.all([
  Product.list('-created_at', 1000).catch(() => []),  // 🔴
  Site.list('-created_at', 1000).catch(() => []),     // 🔴
  Client.list('-created_at', 1000).catch(() => [])    // 🔴
]);
```

**השלכות:**
- אפליקציה עולה עם נתונים חלקיים ללא התרעה
- משתמש עלול לא לראות מוצרים/אתרים קיימים

### 4. Backend - Functions API

#### 4.1 באג: GET Request עם Body 🔴

**מיקום:** `functions/orders-api.ts:119-123`

```typescript
const body = method !== 'GET' ? await req.json() : null;

// GET /orders - List orders with optional filters
if (method === 'GET' && url.pathname === '/') {
  const { filter, sort, limit, includeRelations } = body || {};  // 🔴 body=null!
```

**בעיה:** לפי HTTP spec, GET requests לא אמורים לקבל body. הקוד מנסה לקרוא פרמטרים מ-body שהוא null.

**אותה בעיה קיימת ב:**
- `functions/clients-sites-api.ts:127-129`
- `functions/products-api.ts:108-110`

#### 4.2 בעיה: בליעת שגיאות בוולידציה 🟡

**מיקום:** `functions/orders-api.ts:67-80`

```typescript
async function validateOutsideEilatDelivery(...) {
  try {
    const site = await superdev.entities.Site.get(siteId);
    // ...
  } catch (error) {
    console.error('Error validating site:', error);
    // 🟡 לא מחזיר שגיאה, ממשיך כאילו הכל בסדר
  }
  return { valid: true };  // מחזיר valid גם אם היתה שגיאה!
}
```

#### 4.3 בעיה: Race Condition ב-generateOrderNumber 🟡

**מיקום:** `functions/orders-api.ts:82-100`

```typescript
async function generateOrderNumber(): Promise<string> {
  const orders = await superdev.entities.Order.list('-created_at', 1);
  let nextNumber = 2001;

  if (orders.length > 0 && orders[0].order_number) {
    nextNumber = parseInt(orders[0].order_number) + 1;
  }

  return nextNumber.toString();
}
```

**בעיה:** אין נעילה. שני requests במקביל יקבלו אותו מספר הזמנה.

#### 4.4 Fallback מסוכן 🔴

**מיקום:** `functions/orders-api.ts:97-98`

```typescript
} catch (error) {
  return Date.now().toString();  // 🔴 מספר הזמנה 1737043200000!
}
```

**השלכות:** מספרי הזמנה לא עקביים, קשה לחפש/לזהות.

### 5. סיכום בעיות טיפול בשגיאות

| קטגוריה | בעיה | חומרה | קובץ:שורה |
|----------|------|--------|-----------|
| Frontend | הסתרת שגיאות getOrdersWithRelations | גבוהה | dataService.ts:229-231 |
| Frontend | הסתרת שגיאות DataContext | בינונית | DataContext.tsx:33-37 |
| Backend | GET עם body | גבוהה | orders-api.ts:119,123 |
| Backend | בליעת שגיאות בוולידציה | בינונית | orders-api.ts:75-77 |
| Backend | Race condition מספרי הזמנה | בינונית | orders-api.ts:82-100 |
| Backend | Fallback timestamp | גבוהה | orders-api.ts:98 |

---

## חלק ג': חוב טכני וקוד ישן

### 6. כפילות קוד משמעותית

#### 6.1 mockDataService.ts - 987 שורות כפילות 🔴

**מיקום:** `src/services/mockDataService.ts`

קובץ שלם (987 שורות) שמשכפל את כל הלוגיקה של dataService:
- Validation logic זהה
- Data structures זהות
- CRUD operations זהות

**דוגמה לכפילות:**

```typescript
// mockDataService.ts:476-501 - validateOrderDate
private validateOrderDate(deliveryDate: string, deliveryTime: string) {
  const now = new Date();
  const orderDate = new Date(deliveryDate);
  // ... אותו קוד בדיוק כמו orders-api.ts:30-55
}

// orders-api.ts:30-55
function validateOrderDate(deliveryDate: string, deliveryWindow: string) {
  const now = new Date();
  const orderDate = new Date(deliveryDate);
  // ... אותו קוד
}
```

#### 6.2 שמות שדות לא עקביים 🟡

| Entity | שדה רשמי | שדה ב-Mock | Fallback |
|--------|----------|------------|----------|
| Order | quantity_tons | quantity | order.quantity_tons \|\| order.quantity |
| Order | delivery_window | time_slot | order.delivery_window \|\| order.time_slot |
| Order | delivery_method | delivery_type | order.delivery_method \|\| order.delivery_type |

**מיקום הטיפול:** `dataService.ts:216-218`

```typescript
return {
  ...order,
  quantity_tons: order.quantity_tons || order.quantity || 0,
  delivery_window: order.delivery_window || order.time_slot || 'morning',
  delivery_method: order.delivery_method || order.delivery_type || 'self'
};
```

### 7. בעיות Type Safety

#### 7.1 שימוש מופרז ב-`any` 🟡

```typescript
// DataContext.tsx
const [products, setProducts] = useState<any[]>([]);
const [sites, setSites] = useState<any[]>([]);
const [productsMap, setProductsMap] = useState<Record<string, any>>({});

// dataService.ts
static async createOrder(orderData: any): Promise<DataServiceResult<any>>
static async getOrdersWithRelations(...): Promise<any[]>
```

#### 7.2 DataServiceResult Type Issue 🟡

**מיקום:** `src/services/dataService.ts:3-7`

```typescript
export interface DataServiceResult<T> {
  success: boolean;
  data: T;  // 🟡 יכול להיות null אם success=false
  error?: string;
}

// בשימוש:
return {
  success: false,
  data: null as T,  // Type assertion מסוכן
  error: '...'
};
```

### 8. אין Transactions

#### 8.1 יצירת הזמנה לא אטומית 🟡

**מיקום:** `functions/orders-api.ts:222-239`

```typescript
// 1. יוצר הזמנה
const newOrder = await superdev.entities.Order.create(orderData);

// 2. יוצר notifications - אם נכשל, ההזמנה כבר נוצרה!
try {
  const managers = await superdev.entities.User.filter({ role: 'manager' });
  for (const manager of managers) {
    await superdev.entities.Notification.create({...});
  }
} catch (notificationError) {
  console.error('Error creating notifications:', notificationError);
  // ההזמנה נוצרה, אבל אין התראות
}
```

#### 8.2 מחיקת הזמנה לא אטומית 🟡

**מיקום:** `functions/orders-api.ts:329-342`

```typescript
// 1. מוחק הזמנה
await superdev.entities.Order.delete(orderId);

// 2. מנסה לנקות - אם נכשל, נשארים עם notifications יתומות
try {
  const notifications = await superdev.entities.Notification.filter({...});
  const messages = await superdev.entities.Message.filter({...});
  await Promise.all([...]);
} catch (cleanupError) {
  console.error('Error cleaning up related data:', cleanupError);
}
```

### 9. אין Audit Trail 🟡

- אין לוג של מי שינה מה ומתי
- אין היסטוריה של שינויים בהזמנות
- אין tracking של פעולות admin

### 10. בעיות ביצועים פוטנציאליות

#### 10.1 N+1 Queries

**מיקום:** `functions/orders-api.ts:135-152`

```typescript
// אם includeRelations=true
const enrichedOrders = await Promise.all(orders.map(async (order) => {
  const [client, site] = await Promise.all([
    order.client_id ? superdev.entities.Client.get(order.client_id) : null,
    order.site_id ? superdev.entities.Site.get(order.site_id) : null
  ]);
  // ...
}));
```

**בעיה:** עבור N הזמנות, מבצעים 2N queries נוספים.

#### 10.2 initializeDefaultData בכל Request

**מיקום:** `functions/clients-sites-api.ts:122`

```typescript
Deno.serve(async (req) => {
  // ... auth ...

  // 🟡 נקרא בכל request!
  await initializeDefaultData();

  // ...
});
```

---

## חלק ד': תוכנית עבודה טכנית

### שלב 1: תיקונים קריטיים (טווח מיידי - 1-2 שבועות)

#### 1.1 תיקון וולידציה ביצירת Order

**קובץ:** `functions/orders-api.ts`

```typescript
// להוסיף לפני יצירת Order:
async function validateOrderReferences(orderData: OrderData): Promise<{valid: boolean, error?: string}> {
  // בדוק client_id
  if (orderData.client_id) {
    try {
      const client = await superdev.entities.Client.get(orderData.client_id);
      if (!client) return { valid: false, error: 'client_not_found' };
    } catch {
      return { valid: false, error: 'client_not_found' };
    }
  }

  // בדוק product_id
  if (orderData.product_id) {
    try {
      const product = await superdev.entities.Product.get(orderData.product_id);
      if (!product) return { valid: false, error: 'product_not_found' };
    } catch {
      return { valid: false, error: 'product_not_found' };
    }
  }

  return { valid: true };
}
```

**עדיפות:** קריטי
**מאמץ:** נמוך

#### 1.2 תיקון GET Requests

**קבצים:** כל ה-API functions

```typescript
// במקום:
const body = method !== 'GET' ? await req.json() : null;
const { filter, sort, limit } = body || {};

// לשנות ל:
const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await req.json() : null;
const params = new URL(req.url).searchParams;
const filter = params.get('filter') ? JSON.parse(params.get('filter')!) : undefined;
const sort = params.get('sort') || '-created_at';
const limit = parseInt(params.get('limit') || '50');
```

**עדיפות:** גבוהה
**מאמץ:** בינוני

#### 1.3 תיקון טיפול בשגיאות Frontend

**קובץ:** `src/services/dataService.ts`

```typescript
// במקום להחזיר מערך ריק:
static async getOrdersWithRelations(...): Promise<DataServiceResult<any[]>> {
  try {
    // ...
    return { success: true, data: enrichedOrders };
  } catch (error) {
    console.error('Error in getOrdersWithRelations:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to load orders'
    };
  }
}
```

**עדיפות:** גבוהה
**מאמץ:** נמוך

### שלב 2: שיפורי יציבות (טווח קצר - 2-4 שבועות)

#### 2.1 מניעת Race Condition במספרי הזמנה

**אפשרות א:** Counter Entity

```typescript
// יצירת entity חדש: Counter
interface Counter {
  id: string;
  name: string;  // 'order_number'
  value: number;
}

async function getNextOrderNumber(): Promise<string> {
  const counter = await superdev.entities.Counter.get('order_number');
  const nextValue = (counter?.value || 2000) + 1;
  await superdev.entities.Counter.update('order_number', { value: nextValue });
  return nextValue.toString();
}
```

**אפשרות ב:** UUID-based Order IDs + Sequential Display Number

**עדיפות:** בינונית
**מאמץ:** בינוני

#### 2.2 Caching עבור initializeDefaultData

```typescript
let initialized = false;

async function initializeDefaultData() {
  if (initialized) return;

  const existingClients = await superdev.entities.Client.list('created_at', 1);
  if (existingClients.length > 0) {
    initialized = true;
    return;
  }

  // ... create defaults ...
  initialized = true;
}
```

**עדיפות:** בינונית
**מאמץ:** נמוך

#### 2.3 הוספת Error Boundaries ל-DataContext

```typescript
const [productsData, sitesData, clientsData] = await Promise.all([
  Product.list('-created_at', 1000),
  Site.list('-created_at', 1000),
  Client.list('-created_at', 1000)
]).catch(error => {
  setError('Failed to load application data. Please refresh.');
  throw error;
});
```

**עדיפות:** בינונית
**מאמץ:** נמוך

### שלב 3: הפחתת חוב טכני (טווח בינוני - 1-2 חודשים)

#### 3.1 מיזוג mockDataService עם dataService

**תוכנית:**
1. יצירת interface משותף `IDataService`
2. מימוש `RealDataService` ו-`MockDataService`
3. Dependency Injection לפי environment

```typescript
// src/services/interfaces/IDataService.ts
export interface IDataService {
  loadOrders(userEmail?: string, isAdmin?: boolean): Promise<DataServiceResult<Order[]>>;
  createOrder(orderData: CreateOrderData): Promise<DataServiceResult<Order>>;
  // ...
}

// src/services/dataServiceFactory.ts
export function createDataService(): IDataService {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return new MockDataService();
  }
  return new RealDataService();
}
```

**עדיפות:** בינונית
**מאמץ:** גבוה

#### 3.2 Type Safety Improvements

**תוכנית:**
1. יצירת Zod schemas משותפים
2. הסרת `any` types
3. Strict TypeScript mode

```typescript
// src/types/schemas.ts
import { z } from 'zod';

export const OrderSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  client_id: z.string(),
  site_id: z.string().optional(),
  product_id: z.string(),
  quantity_tons: z.number().positive(),
  delivery_date: z.string(),
  delivery_window: z.enum(['morning', 'afternoon']),
  delivery_method: z.enum(['self', 'external']),
  status: z.enum(['pending', 'approved', 'in_transit', 'rejected', 'completed']),
  // ...
});

export type Order = z.infer<typeof OrderSchema>;
```

**עדיפות:** בינונית
**מאמץ:** בינוני

#### 3.3 תיקון שמות שדות

**תוכנית:**
1. Migration script לעדכון כל ההזמנות הישנות
2. הסרת fallbacks מ-dataService
3. עדכון mockDataService

```typescript
// migration script
async function migrateOrderFields() {
  const orders = await Order.list('-created_at', 10000);

  for (const order of orders) {
    const updates: any = {};

    if (order.quantity && !order.quantity_tons) {
      updates.quantity_tons = order.quantity;
    }
    if (order.time_slot && !order.delivery_window) {
      updates.delivery_window = order.time_slot;
    }
    if (order.delivery_type && !order.delivery_method) {
      updates.delivery_method = order.delivery_type;
    }

    if (Object.keys(updates).length > 0) {
      await Order.update(order.id, updates);
    }
  }
}
```

**עדיפות:** נמוכה
**מאמץ:** בינוני

### שלב 4: שיפורים ארכיטקטוניים (טווח ארוך)

#### 4.1 הוספת Audit Trail

```typescript
// entities/AuditLog.json
{
  "name": "AuditLog",
  "properties": {
    "entity_type": { "type": "string" },
    "entity_id": { "type": "string" },
    "action": { "type": "string", "enum": ["create", "update", "delete"] },
    "user_email": { "type": "string" },
    "changes": { "type": "object" },
    "timestamp": { "type": "string" }
  }
}
```

**עדיפות:** נמוכה
**מאמץ:** בינוני

#### 4.2 Soft Deletes

במקום מחיקה פיזית, להוסיף שדה `deleted_at`:

```typescript
// במקום:
await Order.delete(orderId);

// לשנות ל:
await Order.update(orderId, {
  deleted_at: new Date().toISOString(),
  status: 'deleted'
});
```

**עדיפות:** נמוכה
**מאמץ:** בינוני

#### 4.3 Optimized Queries

```typescript
// להחליף N+1 queries עם batch loading
static async getOrdersWithRelations(...): Promise<any[]> {
  const orders = await this.loadOrders(...);

  // Collect all unique IDs
  const clientIds = new Set(orders.map(o => o.client_id).filter(Boolean));
  const siteIds = new Set(orders.map(o => o.site_id).filter(Boolean));

  // Batch load
  const [clients, sites] = await Promise.all([
    Client.filter({ id: { $in: Array.from(clientIds) } }),
    Site.filter({ id: { $in: Array.from(siteIds) } })
  ]);

  // Create lookup maps
  const clientMap = new Map(clients.map(c => [c.id, c]));
  const siteMap = new Map(sites.map(s => [s.id, s]));

  // Enrich
  return orders.map(order => ({
    ...order,
    client_name: clientMap.get(order.client_id)?.name || 'Unknown',
    site_name: siteMap.get(order.site_id)?.site_name || 'Unknown'
  }));
}
```

**עדיפות:** נמוכה
**מאמץ:** בינוני

---

## סיכום עדיפויות - מעודכן

### קריטי (יש לטפל מיד) ✅ הושלם
1. ✅ וולידציה של client_id ו-product_id ביצירת Order
2. ✅ תיקון GET requests עם body
3. ✅ הסרת timestamp fallback ממספרי הזמנה

### גבוה (שבוע-שבועיים) ✅ הושלם
4. ✅ שיפור טיפול בשגיאות Frontend (DataServiceResult)
5. ✅ הוספת error boundaries ל-DataContext
6. ✅ תיקון בליעת שגיאות בוולידציה

### בינוני (חודש) ✅ הושלם
7. ✅ מניעת race condition במספרי הזמנה (Counter entity)
8. ✅ Type safety improvements (Zod schemas)
9. ✅ IDataService interface (מיזוג חלקי)

### נמוך (טווח ארוך) ✅ הושלם
10. ✅ Audit trail (AuditLog entity + auditService)
11. ✅ Soft deletes (is_deleted, deleted_at, deleted_by)
12. ✅ Query optimization (batch loading)

---

## נספח א': כלים קיימים

### כלי ניקוי נתונים

המערכת מכילה כלי לניקוי רשומות יתומות:

**מיקום:** `/admin/data-cleanup`
**קוד:** `src/pages/AdminDataCleanup.tsx` + `src/utils/fixOrphanedReferences.ts`

**יכולות:**
- סריקה אוטומטית של רשומות יתומות
- תיקון Orders עם client_id/site_id לא קיימים
- מחיקת Notifications/Messages יתומות
- יצירת לקוח "מערכת" לשימור נתונים היסטוריים

### כלי צפייה ב-Audit Logs

**מיקום:** `/admin-audit-logs`
**קוד:** `src/pages/AdminAuditLogs.tsx`

**יכולות:**
- צפייה בכל הפעולות שבוצעו במערכת
- סינון לפי סוג ישות ופעולה
- חיפוש לפי משתמש או מזהה
- הצגת שינויים לפני/אחרי

---

## נספח ב': קבצים שנוספו/עודכנו

### קבצים חדשים
| קובץ | תיאור |
|------|-------|
| `entities/AuditLog.json` | Entity למעקב אחר שינויים |
| `entities/Counter.json` | Entity למספרים רצים |
| `src/services/auditService.ts` | שירות audit logging |
| `src/services/interfaces/IDataService.ts` | Interface לשירותי נתונים |
| `src/utils/migrations/migrateOrderFields.ts` | סקריפט מיגרציה לשדות |
| `src/types/schemas.ts` | Zod validation schemas |
| `src/pages/AdminAuditLogs.tsx` | דף admin לצפייה ב-audit logs |

### קבצים שעודכנו
| קובץ | שינוי |
|------|-------|
| `entities/Order.json` | הוספת soft delete fields |
| `functions/orders-api.ts` | FK validation, soft delete, audit logging |
| `functions/clients-sites-api.ts` | GET params fix, cache |
| `functions/products-api.ts` | GET params fix, cache |
| `src/services/dataService.ts` | Error handling, soft delete filter |
| `src/services/orderService.ts` | Updated return types |
| `src/contexts/DataContext.tsx` | Error tracking |
| `src/types/index.ts` | Schema exports |
| `src/App.tsx` | New route for audit logs |

---

*דוח זה נוצר אוטומטית ע"י ניתוח ארכיטקטורי מקיף של קוד המקור.*
*עודכן לאחרונה: ינואר 2026 - כל הפריטים הושלמו*
