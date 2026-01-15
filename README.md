# Bitterrock - E-commerce Management System

A modern full-stack web application for KiddyCare - maternity and baby products management, built with Next.js 14 (App Router), TypeScript, PostgreSQL, and AWS S3/R2 storage.

## 🏗️ Project Structure

```
Bitterrock/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Next.js API Routes)
│   │   ├── attributes/           # Attribute management API
│   │   ├── attribute-values/     # Attribute value management API
│   │   ├── categories/           # Category CRUD API
│   │   ├── inventory/            # Inventory management API
│   │   ├── product-variants/     # Product variant management API
│   │   ├── products/             # Product CRUD API
│   │   ├── r2-objects/          # R2 storage objects API
│   │   ├── sub_categories/       # Subcategory management API
│   │   ├── upload/               # File upload handler API
│   │   └── warehouses/          # Warehouse management API
│   ├── categories/               # Categories management page
│   ├── inventory/                # Inventory management page
│   ├── orders/                   # Orders management page
│   ├── products/                 # Products management page
│   ├── warehouse-stock/           # Warehouse stock page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # UI Components
│   ├── ui/                       # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── modal.tsx
│   │   ├── navigation.tsx
│   │   ├── responsive-image.tsx
│   │   ├── select.tsx
│   │   ├── sidebar.tsx
│   │   └── table.tsx
│   └── utils/
│       └── cn.ts                 # Class name utility
│
├── src/                           # Source code
│   └── store/                     # Zustand state management
│       └── products.ts
│
├── database/                      # Database configuration
│   ├── schemas/                  # Database schemas
│   │   └── schema.sql           # Complete DB schema
│   ├── connection.ts             # Database connection utility
│   ├── db.ts                     # Database helper functions
│   └── test-db-connection.js     # Connection test script
│
├── public/                        # Static assets
│   ├── fonts/                    # Custom fonts (LINE Seed Sans TH)
│   ├── KiddyCareLogo.png         # Logo
│   └── uploads/                  # Uploaded files
│
├── environment/                   # Environment configuration
│   ├── .env.local                # Local environment variables (DO NOT COMMIT)
│   └── .env.example              # Environment template
│
├── types/                         # TypeScript type definitions
│   └── radix-select.d.ts
│
├── package.json                   # Project dependencies
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── next.config.js                 # Next.js configuration
├── components.json                # Shadcn UI configuration
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** 
- **npm 8+** or **yarn**
- **PostgreSQL 16+** database
- **AWS S3/R2** account (for file storage)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Bitterrock
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy environment template
   cp environment/.env.example environment/.env.local
   
   # Edit environment/.env.local with your credentials
   # Required variables:
   # - Database connection (PostgreSQL)
   # - AWS S3/R2 credentials
   ```

4. **Set up the database:**
   ```bash
   # Run database schema
   psql -U your_user -d your_database -f database/schemas/schema.sql
   
   # Or use the connection test script
   node database/test-db-connection.js
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at:
- **Application**: http://localhost:3001
- **API Routes**: http://localhost:3001/api/*

### 🐳 Docker Installation (Alternative)

สำหรับการใช้งาน Docker:

1. **สร้างไฟล์ environment:**
   ```bash
   cp .docker.env.example .docker.env
   # แก้ไข .docker.env ตามต้องการ
   ```

2. **เริ่มต้นด้วย Docker:**
   ```bash
   # Production mode
   docker-compose --env-file .docker.env up --build -d
   
   # Development mode
   docker-compose -f docker-compose.dev.yml --env-file .docker.env up --build
   ```

3. **หรือใช้สคริปต์ที่เตรียมไว้:**
   ```bash
   # Linux/Mac
   chmod +x docker-start.sh docker-stop.sh
   ./docker-start.sh
   
   # Windows (Git Bash)
   bash docker-start.sh
   ```

ดูรายละเอียดเพิ่มเติมใน [DOCKER.md](./DOCKER.md)

## 📋 Available Scripts

### Development
- `npm run dev` - Start Next.js development server (http://localhost:3001)
- `npm run build` - Build application for production
- `npm run start` - Start production server

### Database
- Test database connection: `node database/test-db-connection.js`
- Run schema: `psql -U user -d database -f database/schemas/schema.sql`

## 🔧 Technology Stack

### Frontend & Framework
- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5.5.4 (strict mode)
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.10 with custom utilities
- **UI Components:** Shadcn UI patterns with Radix UI primitives
- **State Management:** Zustand 4.5.2
- **Icons:** Lucide React

### Backend (API Routes)
- **API Framework:** Next.js API Routes (built-in)
- **Language:** TypeScript
- **Database Driver:** PostgreSQL via `pg` 8.16.3
- **File Storage:** AWS S3/R2 via `@aws-sdk/client-s3`

### Database
- **Database:** PostgreSQL 16+
- **Connection:** Native `pg` driver with connection pooling
- **Schema:** Custom SQL schema in `database/schemas/schema.sql`

### Utilities & Libraries
- **Excel Export:** xlsx 0.18.5
- **PDF Generation:** jspdf 3.0.3, html2canvas 1.4.1
- **Class Utilities:** clsx, tailwind-merge, class-variance-authority
- **Environment:** dotenv 16.6.1

## 🔐 Environment Variables

Create `environment/.env.local` with the following variables:

```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_SSL=false

# AWS S3/R2 Configuration (for file storage)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=your-r2-endpoint
R2_PUBLIC_URL=your-public-url

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Note:** Never commit `.env.local` files. Use `environment/.env.example` as a template.

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

### Core Tables
- **categories** - Product categories (hierarchical structure)
- **sub_categories** - Product subcategories (3-character codes)
- **products** - Product catalog with base SKU and pricing
- **productvariants** - Product variants with attributes
- **attributes** - Product attributes (size, color, etc.)
- **attributevalues** - Attribute values (S, M, L, Red, Blue, etc.)
- **inventory** - Stock management with warehouse tracking
- **warehouses** - Warehouse locations and information

### Additional Tables
- **orders** - Order management
- **order_items** - Order line items
- **customers** - Customer information
- **payments** - Payment processing
- **shipping** - Delivery tracking
- **product_reviews** - Product reviews
- **search_history** - User search tracking
- **search_results** - Search result caching
- **sales_summary** - Sales analytics
- **discounts** - Discount management
- **sessions** - User sessions
- **users** - User accounts

See `database/schemas/schema.sql` for complete schema definition.

## ✨ Key Features

### Product Management
- ✅ Full CRUD operations for products
- ✅ Product variant management with attributes
- ✅ Image upload and storage (R2)
- ✅ Base SKU auto-generation
- ✅ Price display: "ราคาเริ่มต้น : [price] ฿"
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
- ✅ Export functionality (Excel, PDF)

## 🛡️ Security Features

- Environment variables for sensitive data
- SQL injection prevention with parameterized queries
- Secure file upload handling
- Input validation
- Type-safe API routes with TypeScript

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Setup
- Set production environment variables in `environment/.env.local`
- Configure PostgreSQL database connection
- Set up AWS S3/R2 credentials for file storage
- Configure reverse proxy (nginx) if needed
- Set up SSL certificates for HTTPS
- Configure domain and DNS settings

### Docker Deployment
```bash
# Build and start with Docker
docker-compose --env-file .docker.env up --build -d

# View logs
docker-compose --env-file .docker.env logs -f

# Stop containers
docker-compose --env-file .docker.env down
```

ดูรายละเอียดเพิ่มเติมใน [DOCKER.md](./DOCKER.md)

### Deployment Platforms
- **Docker** (recommended for self-hosted)
- **Vercel** (recommended for Next.js)
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**
- **Self-hosted** with Node.js

## 📝 Development Guidelines

1. **Code Organization:** Follow the established folder structure
   - Pages in `app/[page-name]/page.tsx`
   - API routes in `app/api/[route-name]/route.ts`
   - Components in `components/ui/`
   - Utilities in `components/utils/`

2. **TypeScript:** Use strict TypeScript configuration
   - All files should be `.ts` or `.tsx`
   - Define types for all data structures
   - Use type-safe API responses

3. **Database:** 
   - Use parameterized queries to prevent SQL injection
   - Connection pooling via `database/connection.ts`
   - Schema changes should be documented in `database/schemas/schema.sql`

4. **Environment:** 
   - Never commit `.env.local` files
   - Use `environment/.env.example` as template
   - Document new environment variables in README

5. **API Routes:**
   - Follow RESTful conventions
   - Return consistent response format: `{ ok: boolean, items?: T[], error?: string }`
   - Handle errors gracefully with try-catch

6. **UI Components:**
   - Use Shadcn UI patterns
   - Follow responsive design principles
   - Maintain consistent styling with Tailwind CSS

7. **Documentation:** 
   - Update README when adding new features
   - Update `PHASE_ONE_SNAPSHORT.md` for major changes
   - Document API endpoints and their usage

## 📚 API Routes

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories` - Update category
- `DELETE /api/categories` - Delete category

### Products
- `GET /api/products` - List products (optional `?category_id=` and `?limit=` filters)
- `POST /api/products` - Create product
- `PUT /api/products` - Update product
- `DELETE /api/products` - Delete product

### Inventory
- `GET /api/inventory` - List inventory items (optional `?limit=` filter)
- `POST /api/inventory` - Create inventory entry
- `PUT /api/inventory` - Update inventory entry
- `DELETE /api/inventory` - Delete inventory entry

### File Management
- `GET /api/r2-objects` - List R2 storage objects
- `POST /api/upload` - Upload file to R2 storage

See `PHASE_ONE_SNAPSHORT.md` for complete API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the development guidelines
4. Test your changes thoroughly
5. Update documentation if needed
6. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Last Updated:** November 2025  
**Version:** 0.1.0  
**Status:** Phase One - Active Development