## Phase One Snapshot (2025-11-08)

### Project Overview
**Project Name**: Bitterrock (KiddyCare Frontend)
**Version**: 0.1.0
**Framework**: Next.js 14.2.5 with App Router

---

## 🛠️ Tech Stack

### Runtime & Framework
- **Next.js 14.2.5** (App Router)
- **React 18.3.1**
- **TypeScript 5.5.4** (strict mode)
- **Node.js** (via Next.js runtime)

### Styling & UI
- **Tailwind CSS 3.4.10** with custom utilities
- **tailwindcss-animate 1.0.7** for animations
- **Shadcn UI** component patterns
- **Radix UI** primitives:
  - `@radix-ui/react-select` 2.0.0
  - `@radix-ui/react-slot` 1.2.3

### State Management
- **Zustand 4.5.2** for global state
- Local component state for page-specific logic

### Database & Storage
- **PostgreSQL** via `pg` 8.16.3
- **AWS S3** via `@aws-sdk/client-s3` 3.901.0 (R2 storage)
- Database connection: `database/connection.ts`

### Utilities & Libraries
- **class-variance-authority** 0.7.0 - Component variants
- **clsx** 2.1.1 - Conditional classes
- **tailwind-merge** 2.5.2 - Tailwind class merging
- **lucide-react** 0.263.1 - Icon library
- **xlsx** 0.18.5 - Excel export
- **jspdf** 3.0.3 - PDF generation
- **html2canvas** 1.4.1 - HTML to canvas conversion
- **dotenv** 16.6.1 - Environment variables

---

## 📁 Project Structure

```
app/
├── api/                          # API Routes
│   ├── attributes/              # Attribute management
│   ├── attribute-values/        # Attribute value management
│   ├── categories/              # Category CRUD
│   ├── inventory/               # Inventory management
│   ├── product-variants/        # Product variant management
│   ├── products/                # Product CRUD
│   ├── r2-objects/              # R2 storage objects
│   ├── sub_categories/          # Subcategory management
│   ├── upload/                  # File upload handler
│   └── warehouses/              # Warehouse management
├── categories/                  # Categories page
│   └── page.tsx
├── inventory/                    # Inventory management page
│   └── page.tsx
├── orders/                      # Orders page
│   └── page.tsx
├── products/                    # Products management page
│   └── page.tsx
├── warehouse-stock/             # Warehouse stock page
│   └── page.tsx
├── globals.css                  # Global styles
├── layout.tsx                   # Root layout
└── page.tsx                     # Home page

components/
├── ui/                          # UI Components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── modal.tsx
│   ├── navigation.tsx
│   ├── responsive-image.tsx
│   ├── select.tsx
│   └── table.tsx
└── utils/
    └── cn.ts                    # Class name utility

src/
└── store/
    └── products.ts              # Zustand store

database/
└── connection.ts                # PostgreSQL connection
```

---

## 🎨 UI Components

### Custom Components
- **Table System**: `Table`, `THead`, `TBody`, `TR`, `TH`, `TD`
- **Card System**: `Card`, `CardContent`, `CardHeader`, `CardTitle`
- **Form Components**: `Button`, `Input`, `Textarea`, `Label`, `Select`
- **Layout Components**: `Modal`, `Navigation`
- **Image Component**: `ResponsiveImage` with aspect ratio and hover effects

### Design System
- **Color Palette**: Custom Shadcn UI tokens
- **Typography**: System fonts with consistent scaling
- **Spacing**: Tailwind spacing scale
- **Responsive**: Mobile-first approach

---

## 📄 Pages Implemented

### 1. **Home Page** (`app/page.tsx`)
- Landing page with navigation

### 2. **Categories Page** (`app/categories/page.tsx`)
- Subcategories table display
- Filter by Category using Select component
- CRUD operations for categories and subcategories
- Full category management interface

### 3. **Products Page** (`app/products/page.tsx`)
- **Card View**: Grid display with product cards
- **Picture View**: Image grid layout
- Product information display:
  - Product name (TH/EN)
  - Category/Subcategory
  - Description
  - **SKU display**
  - **Price display**: "ราคาเริ่มต้น : [price] ฿" (below SKU)
- Product CRUD operations:
  - Create product (3-step wizard)
  - Edit product
  - Delete product
  - View product details
- Image upload and management
- Search and filter functionality
- View mode toggle (Card/Picture)

### 4. **Inventory Page** (`app/inventory/page.tsx`)
- Inventory items table
- Stock management:
  - Stock quantity
  - Reserved quantity
  - Available quantity
- Status badges (In Stock, Low Stock, Out of Stock)
- Active status management
- Warehouse assignment
- Expiry date tracking
- Export functionality (Excel, PDF)
- Search and filter by category/status
- Pagination
- CRUD operations with multi-step modals

### 5. **Orders Page** (`app/orders/page.tsx`)
- Order management interface

### 6. **Warehouse Stock Page** (`app/warehouse-stock/page.tsx`)
- Warehouse stock management

---

## 🔌 API Routes

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories` - Update category
- `DELETE /api/categories` - Delete category

### Sub Categories
- `GET /api/sub_categories` - List subcategories (optional `?category_id=` filter)
- `POST /api/sub_categories` - Create subcategory
- `PUT /api/sub_categories` - Update subcategory
- `DELETE /api/sub_categories` - Delete subcategory

### Products
- `GET /api/products` - List products (optional `?category_id=` and `?limit=` filters)
- `POST /api/products` - Create product
- `PUT /api/products` - Update product
- `DELETE /api/products` - Delete product

### Product Variants
- `GET /api/product-variants` - List variants (optional `?product_id=` filter)
- `POST /api/product-variants` - Create variant
- `PUT /api/product-variants` - Update variant
- `DELETE /api/product-variants` - Delete variant

### Inventory
- `GET /api/inventory` - List inventory items (optional `?limit=` filter)
- `POST /api/inventory` - Create inventory entry
- `PUT /api/inventory` - Update inventory entry
- `DELETE /api/inventory` - Delete inventory entry

### Attributes
- `GET /api/attributes` - List attributes (optional `?include_values=true`)
- `POST /api/attributes` - Create attribute
- `PUT /api/attributes` - Update attribute
- `DELETE /api/attributes` - Delete attribute

### Attribute Values
- `GET /api/attribute-values` - List attribute values
- `POST /api/attribute-values` - Create attribute value
- `PUT /api/attribute-values` - Update attribute value
- `DELETE /api/attribute-values` - Delete attribute value

### Warehouses
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses` - Update warehouse
- `DELETE /api/warehouses` - Delete warehouse

### File Management
- `GET /api/r2-objects` - List R2 storage objects (optional `?limit=` filter)
- `POST /api/upload` - Upload file to R2 storage

---

## 🗄️ Database Schema

### Core Tables
- **categories**: Category management
  - `category_id` (PK)
  - `category_name_th`, `category_name_en`
  - `description`, `created_date`, etc.

- **sub_categories**: Subcategory management
  - `sub_category_id` (PK, CHAR(3))
  - `category_id` (FK)
  - `sub_category_name_th`, `sub_category_name_en`
  - `description`

- **products**: Product management
  - `product_id` (PK)
  - `sub_category_id` (FK)
  - `product_name_th`, `product_name_en`
  - `base_sku`, `base_price`
  - `description`

- **productvariants**: Product variants
  - `variantid` (PK)
  - `productid` (FK)
  - `attributevalueid` (FK)
  - `sku`, `price`
  - `isactive`

- **inventory**: Inventory management
  - `inventory_id` (PK)
  - `product_id` (FK)
  - `variant_id` (FK, nullable)
  - `warehouse_id` (FK)
  - `stock_quantity`, `reserved_quantity`, `available_quantity`
  - `expired_date`, `created_date`
  - `is_active`

- **warehouses**: Warehouse management
  - `warehouseid` (PK)
  - `warehousename`
  - `locationaddress`

- **attributes**: Product attributes
  - `attributeid` (PK)
  - `attributenameth`, `attributenameen`

- **attributevalues**: Attribute values
  - `attributevalueid` (PK)
  - `attributeid` (FK)
  - `attributevalueth`, `attributevalueen`

### Additional Tables
- `orders`, `order_items`, `customers`, `payments`, `shipping`
- `product_reviews`, `search_history`, `search_results`
- `sales_summary`, `discounts`, `sessions`, `users`

---

## ✨ Key Features Implemented

### Product Management
- ✅ Product CRUD operations
- ✅ Product variant management
- ✅ Image upload and storage (R2)
- ✅ Base SKU auto-generation
- ✅ Price display: "ราคาเริ่มต้น : [price] ฿" (below SKU)
- ✅ Multi-step product creation wizard
- ✅ Search and filter functionality
- ✅ Dual view modes (Card/Picture)

### Inventory Management
- ✅ Stock tracking (total, reserved, available)
- ✅ Warehouse assignment
- ✅ Expiry date management
- ✅ Status badges and indicators
- ✅ Export to Excel and PDF
- ✅ Advanced filtering and search
- ✅ Pagination
- ✅ Multi-step inventory creation

### Category Management
- ✅ Category CRUD operations
- ✅ Subcategory CRUD operations
- ✅ Category filtering
- ✅ Hierarchical category structure

### UI/UX Features
- ✅ Responsive design (mobile-first)
- ✅ Modal dialogs for CRUD operations
- ✅ Loading states and error handling
- ✅ Form validation
- ✅ Search functionality
- ✅ Filter dropdowns
- ✅ Pagination controls
- ✅ Export functionality

---

## 🎯 Recent Changes (Phase One)

### Products Page Updates
- **Price Display Format**: Changed from simple price display to "ราคาเริ่มต้น : [price] ฿"
- **Layout**: Price now displayed below SKU in a vertical layout
- **Consistency**: Applied to both Card View and Detail Modal

### Implementation Details
- Modified `app/products/page.tsx`:
  - Card View: Changed price display format and layout (lines 640-643)
  - Detail Modal: Updated price display format (lines 903-906)
  - Layout changed from horizontal (`flex-row`) to vertical (`flex-col`)

---

## 📝 API Response Patterns

### Success Response
```typescript
{
  ok: true,
  items?: Array<T>,
  data?: T,
  id?: number
}
```

### Error Response
```typescript
{
  ok: false,
  error: string,
  details?: any
}
```

### Category/Subcategory Response
```typescript
{
  success: boolean,
  data?: Array<T>,
  error?: string
}
```

---

## 🔧 Configuration Files

- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration (strict mode)
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - Shadcn UI configuration
- `.env.local` / `environment/.env.local` - Environment variables

---

## 🚀 Development Status

### ✅ Completed
- Core framework setup (Next.js, TypeScript, Tailwind)
- UI component library (Shadcn UI patterns)
- Database connection (PostgreSQL)
- File storage (AWS S3/R2)
- Product management system
- Inventory management system
- Category management system
- API routes for all major entities
- Responsive design implementation
- Export functionality (Excel, PDF)

### 🔄 In Progress
- Order management
- Warehouse stock management
- Advanced search and filtering

### 📋 Planned
- User authentication
- Advanced reporting
- Dashboard analytics
- Payment integration
- Shipping management

---

## 📌 Notable Conventions

- **API Responses**: Mixed patterns (`{ok, items}` vs `{success, data}`)
- **Subcategory IDs**: 3-character codes (e.g., BBR, DIA, HMT)
- **SKU Format**: `XXX-YYY-ZZ` pattern for base SKU
- **Price Display**: "ราคาเริ่มต้น : [price] ฿" format
- **Thai/English**: Dual language support (TH/EN) for names
- **Status Management**: Boolean `is_active` fields for soft deletes

---

## 🎨 Design Patterns

- **Component Composition**: Shadcn UI patterns
- **State Management**: Zustand for global, local state for pages
- **Form Handling**: Controlled components with validation
- **Data Fetching**: Client-side with `fetch` API
- **Error Handling**: Try-catch with user-friendly messages
- **Loading States**: Conditional rendering with loading indicators

---

## 📦 Dependencies Summary

### Production Dependencies (29 packages)
- Next.js ecosystem (next, react, react-dom)
- UI libraries (radix-ui, lucide-react)
- Styling (tailwindcss, tailwind-merge, clsx)
- Database (pg, @types/pg)
- Storage (@aws-sdk/client-s3)
- Utilities (xlsx, jspdf, html2canvas, dotenv)
- State management (zustand)

### Development Dependencies (7 packages)
- TypeScript and type definitions
- Build tools (autoprefixer, postcss, tailwindcss)

---

## 🔐 Environment Variables

Required environment variables:
- Database connection (PostgreSQL)
- AWS S3/R2 credentials
- Application configuration

---

## 📅 Snapshot Date
**Created**: 2025-11-08
**Phase**: Phase One
**Status**: Active Development

---

## 📝 Notes
- This snapshot represents the current state of Phase One development
- All major CRUD operations are functional
- UI/UX improvements are ongoing
- Database schema is stable but may evolve
- API routes follow RESTful patterns with some variations

