## Tech Stack Snapshot (2025-10-01)

### Runtime & Framework
- Next.js 14 (App Router), React 18, TypeScript 5
- Tailwind CSS 3, tailwindcss-animate

### UI Components
- Custom `Table` system (`Table`, `THead`, `TBody`, `TR`, `TH`, `TD`)
- shadcn/ui patterns with Radix:
  - `@radix-ui/react-select` integrated via `components/ui/select.tsx`
  - `Button`, `Card`, `Label`, `Modal`, `Input`, `Textarea` in `components/ui/`

### State & Utils
- Local component state for page logic
- Utility `cn` in `components/utils/cn.ts`

### API Routes (app/api)
- `categories/route.ts`
  - GET: discover categories table and return mapped list
  - POST/PUT/DELETE: CRUD on `categories`
- `sub_categories/route.ts`
  - GET: list subcategories; optional filter by `?category_id=`

### Database (PostgreSQL)
- Schema defined in `database/schemas/schema.sql`
  - `categories(category_id, category_name, description, created_date ...)`
  - `sub_categories(sub_category_id CHAR(3) PK, category_id FK, sub_category_name, description)`
  - Additional tables: `products`, `product_variants`, `orders`, `order_items`, `inventory`, `customers`, `payments`, `shipping`, `product_reviews`, `search_history`, `search_results`, `sales_summary`, `discounts`, `sessions`, `users`
- Connection: `database/connection.ts` using `pg` + env (`.env.local` or `environment/.env.local`)

### Current UI Pages
- `app/categories/page.tsx`
  - Shows Subcategories table (code, name, parent category, description)
  - Filter by Category using shadcn Select (values: specific `category_id` or `all`)
  - No DB connection info card shown

### Public Assets
- Fonts in `public/fonts/` and logo `public/KiddyCareLogo.png`

### Config
- Tailwind: `tailwind.config.ts`
- PostCSS: `postcss.config.js`
- TS: `tsconfig.json` (strict, bundler module resolution)

### Notable Conventions
- API responses: `{ success, data?, error?, details? }`
- Subcategory keys: `sub_category_id` is 3-char code (e.g., BBR, DIA, HMT)

### Next Steps (Suggested)
- Add CRUD APIs for `sub_categories`
- Add toasts and form validation for subcategory management
- Seed data scripts for categories/subcategories

