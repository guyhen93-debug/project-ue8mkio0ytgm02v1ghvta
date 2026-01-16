# Piterno - Project Map

## Overview

**Piterno** is a quarry delivery order management system for Piter Noufi Ltd., designed for managing construction material orders in the Eilat region and surrounding areas. The system supports both managers (who handle order fulfillment) and clients (who place orders).

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v6
- **State Management**: React Context API + TanStack Query
- **Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **i18n**: Custom context-based (Hebrew/English with RTL/LTR support)

### Backend
- **Runtime**: Deno (serverless functions)
- **Backend-as-a-Service**: SuperDev Platform (@superdevhq packages)
- **API Pattern**: RESTful endpoints in `/functions` directory
- **Authentication**: SuperDev Auth with JWT tokens
- **Database**: SuperDev entities (abstracted database layer)

---

## Application Screens

### Manager Routes (require `manager` role)

#### 1. Manager Dashboard (`/manager-dashboard`)
- **File**: `src/pages/ManagerDashboard.tsx`
- **Purpose**: Main management dashboard with analytics and pending orders
- **Features**:
  - Total orders count and status breakdown
  - Pending orders requiring attention
  - Quick stats (total tons, active clients, deliveries)
  - Orders by delivery method and region charts
  - 30-day trend graph
  - Top clients list
- **Data Used**: Orders, Analytics, Clients, Sites

#### 2. Manager Orders (`/orders`)
- **File**: `src/pages/ManagerOrders.tsx`
- **Purpose**: Comprehensive order management interface
- **Features**:
  - Full order list with filters (status, delivery date, client, site)
  - Order status updates (approve/reject/in transit/completed)
  - Delivery tracking and confirmation
  - Export to Excel
  - Delete orders
- **Data Used**: Orders, Clients, Sites, Products

#### 3. Reports (`/reports`)
- **File**: `src/pages/Reports.tsx`
- **Purpose**: Analytics and reporting dashboard
- **Features**:
  - Visual charts and graphs
  - Filterable by date range, client, status
  - Export capabilities
- **Data Used**: Orders, Analytics

#### 4. Admin Panel (`/admin`)
- **File**: `src/pages/AdminPanel.tsx`
- **Purpose**: System configuration and entity management
- **Features**:
  - User Management (view, edit roles)
  - Client Management (create, edit, deactivate)
  - Site Management (create, edit, deactivate)
  - Product Management (create, edit, deactivate)
- **Components Used**:
  - `src/components/admin/UserManagement.tsx`
  - `src/components/admin/ClientManagement.tsx`
  - `src/components/admin/SiteManagement.tsx`
  - `src/components/admin/ProductManagement.tsx`

#### 5. Admin Data Cleanup (`/admin-data-cleanup`)
- **File**: `src/pages/AdminDataCleanup.tsx`
- **Purpose**: Data integrity tools for fixing orphaned references
- **Features**:
  - Detect orphaned orders (missing client/site references)
  - Fix broken relationships
  - Data validation reports
- **Data Used**: Orders, Clients, Sites

### Client Routes

#### 6. Client Dashboard (`/client-dashboard`)
- **File**: `src/pages/ClientDashboard.tsx`
- **Purpose**: Client view of their orders and quick stats
- **Features**:
  - Recent orders list
  - Order status tracking
  - Quick order creation
  - Statistics specific to client
- **Data Used**: Orders (filtered by client_id)

### Shared Routes (authenticated)

#### 7. Create Order (`/create-order`)
- **File**: `src/pages/CreateOrder.tsx`
- **Purpose**: Order creation form with validation
- **Features**:
  - Multi-step form (client/site selection, product selection, delivery details)
  - Real-time validation (quantities, dates, delivery windows)
  - Business rule enforcement
  - Notes and special instructions
- **Components Used**:
  - `src/components/order/ClientSelector.tsx`
  - `src/components/order/ProductSelector.tsx`
  - `src/components/order/DeliverySection.tsx`
- **Data Used**: Clients, Sites, Products
- **Validation Hook**: `src/hooks/useOrderValidation.tsx`

#### 8. Order History (`/order-history`)
- **File**: `src/pages/OrderHistory.tsx`
- **Purpose**: List and filter user's orders
- **Features**:
  - Filterable by status, date, site
  - Sortable columns
  - Order details view
  - Client confirmation for delivered orders
  - Rating system (1-5 stars)
- **Data Used**: Orders, Clients, Sites, Products

#### 9. Inbox (`/inbox`)
- **File**: `src/pages/Inbox.tsx`
- **Purpose**: Internal messaging system
- **Features**:
  - Message threads
  - New message composition
  - Order-linked messages
  - Read/unread status
- **Components Used**:
  - `src/components/messaging/MessageList.tsx`
  - `src/components/messaging/MessageThread.tsx`
  - `src/components/messaging/NewMessageForm.tsx`
- **Data Used**: Messages, Users

#### 10. Notifications (`/notifications`)
- **File**: `src/pages/Notifications.tsx`
- **Purpose**: System notifications center
- **Features**:
  - List of notifications
  - Mark as read/unread
  - Order-linked notifications
  - Auto-refresh
- **Data Used**: Notifications

#### 11. Profile (`/profile`)
- **File**: `src/pages/Profile.tsx`
- **Purpose**: User profile settings
- **Features**:
  - Update name, phone, company
  - Language selection (Hebrew/English)
  - Reminder preferences
- **Data Used**: User

### Special Routes

#### 12. Home Redirect (`/`)
- **File**: `src/pages/HomeRedirect.tsx`
- **Purpose**: Redirects based on user role
- **Logic**:
  - Manager → `/manager-dashboard`
  - Client → `/client-dashboard`

#### 13. Not Found (`*`)
- **File**: `src/pages/NotFound.tsx`
- **Purpose**: 404 error page

---

## Data Models & Schema

### Core Entities

All entities are defined in `/entities/*.json` and accessed through `/src/entities/*.ts` wrappers.

### 1. Order Entity

**File**: `entities/Order.json`, `src/entities/Order.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  order_number: string;              // Sequential number (2001, 2002, ...)

  // Relationships
  client_id: string;                 // FK → clients.id
  site_id: string;                   // FK → sites.id
  product_id: string;                // FK → products.id
  created_by: string;                // User email

  // Order Details
  quantity_tons: number;             // Order quantity
  delivery_date: string;             // ISO date string
  delivery_window: 'morning' | 'afternoon';
  delivery_method: 'self' | 'external';
  supplier: 'shifuli_har' | 'maavar_rabin';
  status: 'pending' | 'approved' | 'in_transit' | 'rejected' | 'completed';
  notes?: string;

  // Delivery Tracking
  is_delivered?: boolean;
  delivered_at?: string;             // Timestamp
  actual_delivery_date?: string;     // May differ from delivery_date
  delivered_quantity_tons?: number;  // Actual delivered (may differ from ordered)
  delivery_note_number?: string;
  driver_name?: string;
  delivery_notes?: string;
  truck_access_space?: boolean;

  // Client Confirmation
  is_client_confirmed?: boolean;
  client_confirmed_at?: string;

  // Rating
  rating?: number;                   // 1-5 stars
  rating_comment?: string;
  rated_at?: string;

  // Metadata
  created_at: string;                // ISO timestamp

  // Legacy Support
  unlinked_site?: boolean;           // For historical data without site
}
```

**Business Rules**:
- No past dates allowed
- No same-day orders after 5 PM
- External delivery: minimum 20 tons, must be multiples of 20
- Outside Eilat external delivery: minimum 40 tons
- Sequential order numbers generated automatically

### 2. Client Entity

**File**: `entities/Client.json`, `src/entities/Client.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  name: string;                      // Client name
  is_active: boolean;                // Soft delete flag
  created_by: string;                // User email who created
}
```

**Relationships**:
- **One-to-Many** with Sites (one client has multiple sites)
- **One-to-Many** with Orders (one client has multiple orders)

### 3. Site Entity

**File**: `entities/Site.json`, `src/entities/Site.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  client_id: string;                 // FK → clients.id
  site_name: string;                 // Site name/location
  region_type: 'eilat' | 'outside_eilat';
  contact_name?: string;             // Site contact person
  contact_phone?: string;            // Site contact phone
  is_active: boolean;                // Soft delete flag
}
```

**Relationships**:
- **Many-to-One** with Client (many sites belong to one client)
- **One-to-Many** with Orders (one site receives multiple orders)

### 4. Product Entity

**File**: `entities/Product.json`, `src/entities/Product.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  product_id: string;                // Business ID (e.g., "SAND_20", "GRANITE_40")
  name_he: string;                   // Hebrew name
  name_en: string;                   // English name
  size: string;                      // Product size (e.g., "0-20", "40-80")
  supplier: 'shifuli_har' | 'maavar_rabin';
  image_url?: string;                // Product image
  is_active: boolean;                // Soft delete flag
}
```

**Default Products**:
- Sand 0-20mm (חול)
- Sesame 20-40mm (שומשום)
- Lentil 40-80mm (עדשים)
- Polia 80-150mm (פוליה)
- Granite 80-200mm (גרניט)

**Relationships**:
- **One-to-Many** with Orders (one product in multiple orders)

### 5. User Entity

**File**: `entities/User.json`, `src/entities/User.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  email: string;                     // Unique email (from auth)
  name?: string;                     // Display name
  phone?: string;                    // Contact phone
  company?: string;                  // Company name
  role: 'client' | 'manager';        // User role
  language: 'en' | 'he';             // Preferred language
  reminders_enabled?: boolean;       // Email reminders
  reminders_delay_hours?: 24 | 48;  // Reminder timing
}
```

**Relationships**:
- **One-to-Many** with Orders (as creator - created_by)
- **One-to-Many** with Clients (as creator - created_by)
- **Many-to-Many** with Messages (as sender/recipient)

### 6. Message Entity

**File**: `entities/Message.json`, `src/entities/Message.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  sender_email: string;              // FK → users.email
  recipient_email: string;           // FK → users.email
  subject: string;                   // Message subject
  content: string;                   // Message body
  is_read: boolean;                  // Read status
  thread_id: string;                 // For grouping conversations
  order_id?: string;                 // Related order (optional)
  parent_message_id?: string;        // For reply threading
  created_at: string;                // ISO timestamp
}
```

**Relationships**:
- **Many-to-One** with User (sender)
- **Many-to-One** with User (recipient)
- **Many-to-One** with Order (optional)
- **Self-referential** (parent_message_id for threads)

### 7. Notification Entity

**File**: `entities/Notification.json`, `src/entities/Notification.ts`

**Schema**:
```typescript
{
  id: string;                        // Primary key (UUID)
  recipient_email: string;           // FK → users.email
  type: string;                      // Notification type
  message: string;                   // Notification text
  is_read: boolean;                  // Read status
  order_id?: string;                 // Related order (optional)
  created_at: string;                // ISO timestamp
}
```

**Relationships**:
- **Many-to-One** with User (recipient)
- **Many-to-One** with Order (optional)

---

## Data Relationships Diagram

```
┌──────────────┐
│     User     │
│ (SuperDev)   │
└──────┬───────┘
       │ created_by
       │
       ↓
┌──────────────┐
│    Client    │
│              │
└──────┬───────┘
       │ client_id
       │
       ↓
┌──────────────┐
│     Site     │
│              │
└──────┬───────┘
       │ site_id
       │
       ↓
┌──────────────┐         ┌──────────────┐
│    Order     │────────→│   Product    │
│              │ product_id              │
└──────┬───────┘         └──────────────┘
       │
       │ order_id
       │
       ├──────────→ ┌──────────────┐
       │            │ Notification │
       │            └──────────────┘
       │
       └──────────→ ┌──────────────┐
                    │   Message    │
                    └──────────────┘

┌─────────────────────────────────┐
│  Message (also references)      │
│  - sender_email → User          │
│  - recipient_email → User       │
│  - parent_message_id → Message  │
└─────────────────────────────────┘
```

### Key Relationships:

1. **User → Client**: One-to-Many
   - A manager creates multiple clients
   - Tracked via `created_by` field

2. **Client → Site**: One-to-Many
   - A client has multiple delivery sites
   - Enforced via `client_id` foreign key

3. **Site → Order**: One-to-Many
   - A site receives multiple orders over time
   - Enforced via `site_id` foreign key

4. **Client → Order**: One-to-Many (direct)
   - Orders also directly reference client
   - Provides redundancy for data integrity

5. **Product → Order**: One-to-Many
   - A product appears in many orders
   - Referenced via `product_id`

6. **Order → Notification**: One-to-Many
   - An order generates multiple notifications (creation, status changes)
   - Linked via `order_id`

7. **Order → Message**: One-to-Many
   - Messages can reference orders for context
   - Linked via `order_id`

8. **User ↔ Message**: Many-to-Many
   - Users send and receive messages
   - Dual relationship via `sender_email` and `recipient_email`

### Data Integrity Features:

- **Soft Deletes**: Entities use `is_active` flags instead of hard deletes
- **Orphaned Reference Detection**: `DataService` includes methods to detect broken relationships
- **Legacy Support**: `unlinked_site` flag for historical orders without sites
- **Data Cleanup Tools**: Admin interface for fixing data integrity issues

---

## Backend Functions (API Endpoints)

All backend functions are serverless Deno functions in `/functions/` directory.

### 1. Orders API (`functions/orders-api.ts`)

**Base Path**: `/functions/orders-api`

**Endpoints**:

#### `GET /functions/orders-api`
- **Purpose**: List and filter orders
- **Query Params**:
  - `status` - Filter by status
  - `client_id` - Filter by client
  - `site_id` - Filter by site
  - `delivery_date` - Filter by date
  - `created_by` - Filter by creator (auto-applied for clients)
- **Returns**: Array of Order objects
- **Access**: All authenticated users (clients see only their orders)

#### `POST /functions/orders-api`
- **Purpose**: Create new order
- **Body**: Order data (without id, order_number, created_at)
- **Business Logic**:
  1. Validates delivery date (no past dates, no same-day after 5 PM)
  2. Validates delivery window
  3. Validates quantities (min 20 tons for external, 40 for outside Eilat)
  4. Generates sequential order number
  5. Creates order record
  6. Creates notifications for all managers
- **Returns**: Created order object
- **Access**: All authenticated users

#### `PUT /functions/orders-api/:id`
- **Purpose**: Update order (status changes, delivery tracking)
- **Body**: Partial order data
- **Logic**:
  - Managers can update any field
  - Clients can only confirm delivery and rate
- **Returns**: Updated order object
- **Access**: Authenticated users (role-based field restrictions)

#### `DELETE /functions/orders-api/:id`
- **Purpose**: Delete order
- **Logic**: Also deletes related notifications and messages
- **Returns**: Success message
- **Access**: Managers only

### 2. Clients & Sites API (`functions/clients-sites-api.ts`)

**Base Path**: `/functions/clients-sites-api`

**Client Endpoints**:

#### `GET /functions/clients-sites-api/clients`
- **Purpose**: List all clients
- **Query Params**: `is_active` - Filter by active status
- **Returns**: Array of Client objects
- **Access**: All authenticated users

#### `POST /functions/clients-sites-api/clients`
- **Purpose**: Create new client
- **Body**: `{ name: string }`
- **Returns**: Created client object
- **Access**: Managers only

#### `PUT /functions/clients-sites-api/clients/:id`
- **Purpose**: Update client
- **Body**: Partial client data
- **Returns**: Updated client object
- **Access**: Managers only

#### `DELETE /functions/clients-sites-api/clients/:id`
- **Purpose**: Soft delete client (sets `is_active: false`)
- **Returns**: Success message
- **Access**: Managers only

**Site Endpoints**:

#### `GET /functions/clients-sites-api/sites`
- **Purpose**: List all sites
- **Query Params**:
  - `client_id` - Filter by client
  - `is_active` - Filter by active status
- **Returns**: Array of Site objects
- **Access**: All authenticated users

#### `POST /functions/clients-sites-api/sites`
- **Purpose**: Create new site
- **Body**: Site data with `client_id`
- **Returns**: Created site object
- **Access**: Managers only

#### `PUT /functions/clients-sites-api/sites/:id`
- **Purpose**: Update site
- **Body**: Partial site data
- **Returns**: Updated site object
- **Access**: Managers only

#### `DELETE /functions/clients-sites-api/sites/:id`
- **Purpose**: Soft delete site (sets `is_active: false`)
- **Returns**: Success message
- **Access**: Managers only

**Initialization**:
- First request auto-creates default clients and sites if none exist

### 3. Messages API (`functions/messages-api.ts`)

**Base Path**: `/functions/messages-api`

#### `GET /functions/messages-api`
- **Purpose**: List user's messages (sent or received)
- **Query Params**: `thread_id` - Filter by thread
- **Returns**: Array of Message objects
- **Access**: Authenticated users (see only their messages)

#### `GET /functions/messages-api/count`
- **Purpose**: Get unread message count
- **Returns**: `{ count: number }`
- **Access**: Authenticated users

#### `GET /functions/messages-api/thread/:threadId`
- **Purpose**: Get all messages in a thread
- **Returns**: Array of Message objects (sorted by date)
- **Access**: Authenticated users (only if they're part of thread)

#### `POST /functions/messages-api`
- **Purpose**: Send new message
- **Body**:
  ```typescript
  {
    recipient_email: string;
    subject: string;
    content: string;
    order_id?: string;
    parent_message_id?: string;
  }
  ```
- **Logic**: Generates thread_id if new conversation
- **Returns**: Created message object
- **Access**: Authenticated users

#### `PUT /functions/messages-api/:id`
- **Purpose**: Mark message as read
- **Body**: `{ is_read: true }`
- **Returns**: Updated message object
- **Access**: Message recipient only

#### `DELETE /functions/messages-api/:id`
- **Purpose**: Delete message
- **Returns**: Success message
- **Access**: Message sender or recipient

### 4. Notifications API (`functions/notifications-api.ts`)

**Base Path**: `/functions/notifications-api`

#### `GET /functions/notifications-api`
- **Purpose**: List user's notifications
- **Query Params**: `is_read` - Filter by read status
- **Returns**: Array of Notification objects (sorted by date)
- **Access**: Authenticated users (see only their notifications)

#### `GET /functions/notifications-api/count`
- **Purpose**: Get unread notification count
- **Returns**: `{ count: number }`
- **Access**: Authenticated users

#### `POST /functions/notifications-api`
- **Purpose**: Create notification (system use)
- **Body**:
  ```typescript
  {
    recipient_email: string;
    type: string;
    message: string;
    order_id?: string;
  }
  ```
- **Returns**: Created notification object
- **Access**: Authenticated users

#### `PUT /functions/notifications-api/:id`
- **Purpose**: Mark notification as read
- **Body**: `{ is_read: true }`
- **Returns**: Updated notification object
- **Access**: Notification recipient only

#### `POST /functions/notifications-api/mark-all-read`
- **Purpose**: Bulk mark all user's notifications as read
- **Returns**: Success message with count
- **Access**: Authenticated users

#### `DELETE /functions/notifications-api/:id`
- **Purpose**: Delete notification
- **Returns**: Success message
- **Access**: Notification recipient only

### 5. Products API (`functions/products-api.ts`)

**Base Path**: `/functions/products-api`

#### `GET /functions/products-api`
- **Purpose**: List all products
- **Query Params**:
  - `is_active` - Filter by active status
  - `supplier` - Filter by supplier
- **Returns**: Array of Product objects
- **Access**: All authenticated users

#### `POST /functions/products-api`
- **Purpose**: Create new product
- **Body**: Product data
- **Returns**: Created product object
- **Access**: Managers only

#### `PUT /functions/products-api/:id`
- **Purpose**: Update product
- **Body**: Partial product data
- **Returns**: Updated product object
- **Access**: Managers only

#### `DELETE /functions/products-api/:id`
- **Purpose**: Soft delete product (sets `is_active: false`)
- **Returns**: Success message
- **Access**: Managers only

**Initialization**:
- First request auto-creates default products if none exist

### 6. Analytics API (`functions/analytics-api.ts`)

**Base Path**: `/functions/analytics-api`

#### `GET /functions/analytics-api/dashboard`
- **Purpose**: Get dashboard analytics
- **Returns**:
  ```typescript
  {
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    rejectedOrders: number;
    completedOrders: number;
    ordersByStatus: Array<{ status: string; count: number }>;
    ordersByDeliveryMethod: Array<{ delivery_method: string; count: number }>;
    ordersByRegion: Array<{ region_type: string; count: number }>;
    last30DaysTrend: Array<{ date: string; count: number }>;
    topClients: Array<{ client_name: string; order_count: number; total_tons: number }>;
    totalQuantityTons: number;
  }
  ```
- **Access**: Managers only

---

## State Management Architecture

### Global State (Context Providers)

#### 1. AuthContext (`src/contexts/AuthContext.tsx`)
- **Purpose**: Manages authentication state and user session
- **Provides**:
  - `user`: Current user object
  - `loading`: Auth loading state
  - `isManager`: Boolean helper for role check
  - `logout()`: Logout function
  - `refreshUser()`: Reload user data
  - `viewAsClient`: Special demo mode flag
- **Initialization**: Auto-loads user on app mount via `User.me()`
- **Used By**: All components via `useAuth()` hook

#### 2. DataContext (`src/contexts/DataContext.tsx`)
- **Purpose**: Global cache for reference data (products, sites, clients)
- **Provides**:
  - `products`: Array of all products
  - `sites`: Array of all sites
  - `clients`: Array of all clients
  - `productsMap`: Map<id, Product> for O(1) lookups
  - `sitesMap`: Map<id, Site> for O(1) lookups
  - `clientsMap`: Map<id, Client> for O(1) lookups
  - `loading`: Data loading state
  - `refreshData()`: Reload all data
- **Initialization**: Loads all data once on app mount
- **Used By**: Forms, lists, and display components via `useData()` hook

#### 3. LanguageContext (`src/contexts/LanguageContext.tsx`)
- **Purpose**: Manages application language (Hebrew/English)
- **Provides**:
  - `language`: Current language ('en' | 'he')
  - `setLanguage(lang)`: Change language
  - Translation helper functions
- **Persistence**: Saves to localStorage
- **Used By**: All components via `useLanguage()` hook

### Component-Level State

#### Form State Management
- **Library**: React Hook Form
- **Validation**: Zod schemas
- **Custom Hooks**: `useOrderValidation` for business rules

#### Server State Management
- **Library**: TanStack Query (React Query)
- **Used For**: Data fetching with caching, background refetching
- **Configuration**: `src/lib/queryClient.ts`

#### Local UI State
- **Method**: React `useState` hooks
- **Used For**: Modal visibility, form dialogs, filters, etc.

---

## Data Flow Architecture

### Read Flow (Example: Loading Orders)

```
┌─────────────────────┐
│   Page Component    │
│  (ManagerOrders)    │
└──────────┬──────────┘
           │
           │ Order.list()
           ↓
┌─────────────────────┐
│  Entity Wrapper     │
│ (src/entities/      │
│   Order.ts)         │
└──────────┬──────────┘
           │
           │ GET /functions/orders-api
           ↓
┌─────────────────────┐
│  Backend Function   │
│ (functions/         │
│   orders-api.ts)    │
└──────────┬──────────┘
           │
           │ entities.Order.list()
           ↓
┌─────────────────────┐
│  SuperDev Platform  │
│    (Database)       │
└──────────┬──────────┘
           │
           │ Response
           ↓
┌─────────────────────┐
│   Page Component    │
│  (renders data)     │
└─────────────────────┘
```

### Write Flow (Example: Creating an Order)

```
┌─────────────────────┐
│   CreateOrder Page  │
│  (form submission)  │
└──────────┬──────────┘
           │
           │ Order.create(data)
           ↓
┌─────────────────────┐
│  Entity Wrapper     │
│ (src/entities/      │
│   Order.ts)         │
└──────────┬──────────┘
           │
           │ POST /functions/orders-api
           ↓
┌─────────────────────┐
│  Backend Function   │
│  Business Logic:    │
│  1. Validate date   │
│  2. Check quantity  │
│  3. Generate number │
│  4. Create order    │
│  5. Notify managers │
└──────────┬──────────┘
           │
           │ entities.Order.create()
           ↓
┌─────────────────────┐
│  SuperDev Platform  │
│    (Database)       │
└──────────┬──────────┘
           │
           │ Success
           ↓
┌─────────────────────┐
│  Notification.      │
│  create() × N       │
│  (for each manager) │
└──────────┬──────────┘
           │
           │ Response
           ↓
┌─────────────────────┐
│   CreateOrder Page  │
│  (success message,  │
│   redirect)         │
└─────────────────────┘
```

### State Update Flow

```
┌─────────────────────┐
│    User Action      │
│  (button click)     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   API Call via      │
│   Entity            │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Success Response   │
└──────────┬──────────┘
           │
           ├──→ ┌─────────────────────┐
           │    │  Context Refresh    │
           │    │  (DataContext.      │
           │    │   refreshData())    │
           │    └─────────────────────┘
           │
           └──→ ┌─────────────────────┐
                │  Local State Update │
                │  (component         │
                │   re-render)        │
                └─────────────────────┘
```

---

## Key Services & Utilities

### Data Services

#### DataService (`src/services/dataService.ts`)
- **Purpose**: Core data operations with retry logic and error handling
- **Key Functions**:
  - `fetchOrders()`: Get all orders for user
  - `fetchAllOrdersForManager()`: Get all orders (manager only)
  - `fetchSites()`: Get sites with client data
  - `enrichOrderWithRelations()`: Populate order with client/site/product data
  - `detectOrphanedOrders()`: Find orders with missing references
  - `unlinkOrder()`: Mark order as unlinked from site
- **Features**:
  - Retry logic (3 attempts with 1s delay)
  - Automatic relation enrichment
  - Data integrity checking
  - Defensive null handling

#### OrderService (`src/services/orderService.ts`)
- **Purpose**: Order-specific business logic
- **Key Functions**:
  - Validation helpers
  - Order status workflows
  - Delivery tracking logic

#### MockDataService (`src/services/mockDataService.ts`)
- **Purpose**: Demo data for development and testing
- **Used**: Demo client account

### Custom Hooks

#### useOrderValidation (`src/hooks/useOrderValidation.tsx`)
- **Purpose**: Centralized order validation logic
- **Validates**:
  - Delivery dates (no past dates, no same-day after 5 PM)
  - Delivery windows (morning: 6-12, afternoon: 12-18)
  - Quantities (minimum 20 tons for external, 40 for outside Eilat, multiples of 20)
  - Business day rules
- **Returns**: Validation error messages

#### useNotifications (`src/hooks/useNotifications.tsx`)
- **Purpose**: Manage notifications state and actions
- **Features**:
  - Auto-refresh every 30 seconds
  - Unread count tracking
  - Mark as read functionality

### Utility Libraries

#### SuperDev Client (`src/lib/superdev/client.ts`)
- **Purpose**: Initialize and configure SuperDev client
- **Exports**: `superdevClient` singleton

#### Order Utils (`src/lib/orderUtils.ts`)
- **Purpose**: Order display formatting and helpers
- **Functions**:
  - `formatOrderNumber()`: Format order number display
  - `getStatusColor()`: Get color for order status
  - `getDeliveryMethodLabel()`: Get localized delivery method label

---

## Key Features & Business Logic

### 1. Order Management

#### Order Creation Workflow
1. User fills form with client, site, product, delivery details
2. Frontend validates via `useOrderValidation` hook
3. On submit, API validates again (defense in depth)
4. API generates sequential order number (2001, 2002, ...)
5. API creates order record in database
6. API creates notifications for all managers
7. Frontend shows success message and redirects

#### Order Status Lifecycle
```
pending → approved → in_transit → completed
   ↓
rejected (terminal state)
```

#### Delivery Tracking
- Manager marks order as "in transit" when shipped
- Manager records delivery details (date, quantity, driver, notes)
- Client confirms receipt and can rate the delivery (1-5 stars)
- System tracks if client confirmed delivery separately from manager marking delivered

### 2. Role-Based Access Control

#### Manager Permissions
- View all orders, clients, sites
- Create/edit/delete clients, sites, products
- Approve/reject orders
- Update order status
- Access analytics and reports
- Manage users

#### Client Permissions
- View only their own orders
- Create new orders
- Confirm delivery and rate orders
- Send/receive messages
- View their notifications

#### Enforcement
- Frontend: `ProtectedRoute` component checks user role
- Backend: Each API endpoint validates user role and applies filters

### 3. Business Rule Validation

#### Delivery Date Rules
- No past dates
- No same-day orders after 5 PM
- Business days only (no weekends if configured)

#### Quantity Rules
- Self delivery: Any quantity
- External delivery (Eilat): Minimum 20 tons, multiples of 20
- External delivery (Outside Eilat): Minimum 40 tons, multiples of 20

#### Supplier Rules
- Different products available from different suppliers
- Supplier assignment based on product selection

### 4. Communication System

#### Internal Messaging
- Thread-based conversations
- Order-linked messages
- Read/unread tracking
- Bi-directional (clients ↔ managers)

#### System Notifications
- Order status changes
- Delivery confirmations
- System announcements
- Auto-generated on key events
- Real-time unread count in UI

### 5. Multi-Language Support

#### Languages
- Hebrew (RTL layout)
- English (LTR layout)

#### Implementation
- LanguageContext for global language state
- Component-level translation objects
- Automatic layout direction switching
- Persisted to localStorage

### 6. Data Integrity Tools

#### Orphaned Reference Detection
- Identifies orders with missing client references
- Identifies orders with missing site references
- Provides report in Admin Data Cleanup page

#### Cleanup Actions
- Unlink orders from deleted sites
- Flag problematic records
- Admin UI for manual intervention

#### Defensive Coding
- All display components handle missing references gracefully
- Fallback to "Unknown Client" or "Unknown Site" labels
- Prevents UI crashes from data inconsistencies

---

## Project Directory Structure

```
/home/user/project-ue8mkio0ytgm02v1ghvta/
│
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── admin/               # Admin management components
│   │   │   ├── ClientManagement.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   ├── SiteManagement.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── messaging/           # Messaging components
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageThread.tsx
│   │   │   └── NewMessageForm.tsx
│   │   ├── notifications/       # Notification components
│   │   ├── order/              # Order form components
│   │   │   ├── ClientSelector.tsx
│   │   │   ├── DeliverySection.tsx
│   │   │   └── ProductSelector.tsx
│   │   └── ui/                 # shadcn/ui components (Button, Card, etc.)
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── DataContext.tsx     # Global data cache
│   │   └── LanguageContext.tsx # i18n state
│   │
│   ├── entities/               # Entity access layer
│   │   ├── Client.ts
│   │   ├── Message.ts
│   │   ├── Notification.ts
│   │   ├── Order.ts
│   │   ├── Product.ts
│   │   ├── Site.ts
│   │   └── User.ts
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useNotifications.tsx
│   │   └── useOrderValidation.tsx
│   │
│   ├── integrations/           # SuperDev integrations
│   │   └── superdev/
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── superdev/
│   │   │   └── client.ts       # SuperDev client init
│   │   ├── orderUtils.ts       # Order formatting utilities
│   │   ├── queryClient.ts      # React Query setup
│   │   └── utils.ts            # General utilities
│   │
│   ├── pages/                  # Page components (routes)
│   │   ├── AdminDataCleanup.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── ClientDashboard.tsx
│   │   ├── CreateOrder.tsx
│   │   ├── HomeRedirect.tsx
│   │   ├── Inbox.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── ManagerOrders.tsx
│   │   ├── NotFound.tsx
│   │   ├── Notifications.tsx
│   │   ├── OrderHistory.tsx
│   │   ├── Profile.tsx
│   │   └── Reports.tsx
│   │
│   ├── services/               # Data service layer
│   │   ├── dataService.ts      # Core data operations
│   │   ├── mockDataService.ts  # Demo data
│   │   └── orderService.ts     # Order business logic
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── (type definition files)
│   │
│   ├── utils/                  # Utility functions
│   │
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
│
├── functions/                  # Backend API functions (Deno)
│   ├── analytics-api.ts        # Analytics endpoints
│   ├── clients-sites-api.ts    # Clients & sites CRUD
│   ├── messages-api.ts         # Messaging endpoints
│   ├── notifications-api.ts    # Notifications CRUD
│   ├── orders-api.ts           # Orders CRUD & business logic
│   └── products-api.ts         # Products CRUD
│
├── entities/                   # Entity schema definitions (JSON)
│   ├── Client.json
│   ├── Message.json
│   ├── Notification.json
│   ├── Order.json
│   ├── Product.json
│   ├── Site.json
│   └── User.json
│
├── public/                     # Static assets
│   └── (images, icons, etc.)
│
├── index.html                  # HTML entry point
├── package.json                # NPM dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite build config
├── tailwind.config.js          # Tailwind CSS config
└── README.md                   # Project documentation
```

---

## Development & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend Functions
- Deployed as serverless functions on SuperDev platform
- Automatic deployment on push to main branch
- Environment variables managed in SuperDev dashboard

### Database
- Managed by SuperDev platform
- Schema defined in `/entities/*.json` files
- No manual database setup required

---

## Summary

**Piterno** is a production-ready, bilingual quarry order management system with:

- **13 main screens** covering all aspects of order management
- **7 core data models** with well-defined relationships
- **6 backend API modules** handling all business logic
- **Role-based access control** (manager vs client)
- **Multi-language support** (Hebrew RTL / English LTR)
- **Comprehensive validation** (frontend + backend)
- **Real-time communication** (messages + notifications)
- **Data integrity tools** (orphan detection, cleanup)
- **Analytics and reporting** for managers
- **Mobile-first responsive design**

The architecture follows modern best practices with clear separation of concerns:
- **Presentation Layer**: React components with shadcn/ui
- **State Management**: Context API for global state, React Query for server state
- **Business Logic**: Services layer with validation and data enrichment
- **Data Access**: Entity wrappers providing type-safe API access
- **Backend**: Serverless Deno functions with SuperDev BaaS

All data relationships are properly structured with foreign keys, soft deletes for data retention, and defensive coding to handle missing references gracefully.
