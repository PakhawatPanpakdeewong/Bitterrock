# Bitterrock Repository Snapshot

**Date:** December 2024  
**Status:** Active Development  
**Type:** Full-Stack Web Application (Frontend-focused)

## Project Overview

Bitterrock is a web application built with Next.js that displays product categories in a table format. The application uses modern React patterns with TypeScript and Tailwind CSS for styling.

## Architecture

### Frontend Stack
- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5.5.4
- **Styling:** Tailwind CSS 3.4.10
- **State Management:** Zustand 4.5.2
- **UI Components:** Custom table components
- **Utilities:** clsx, tailwind-merge

### Backend
- Currently empty (`backend/` directory exists but contains no files)

## Project Structure

```
Bitterrock/
├── frontend/                    # Next.js application
│   ├── app/                     # App Router directory
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Main page component
│   ├── components/             # Reusable components
│   │   ├── ui/
│   │   │   └── table.tsx       # Table component system
│   │   └── utils/
│   │       └── cn.ts           # Class name utility
│   ├── src/
│   │   └── store/
│   │       └── products.ts     # Zustand store (categories)
│   ├── package.json            # Dependencies and scripts
│   ├── tailwind.config.ts      # Tailwind configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── postcss.config.js       # PostCSS configuration
├── backend/                    # Backend directory (empty)
├── README.md                   # Project documentation
└── LICENSE                     # MIT License
```

## Key Features

### Category Management System
- **Data Model:** Categories with ID, name, description, and creation date
- **Display:** Responsive table with 4 columns
- **Mock Data:** 4 predefined baby product categories

### UI Components
- **Table System:** Modular table components (Table, THead, TBody, TR, TH, TD)
- **Styling:** Tailwind CSS with hover effects and responsive design
- **Accessibility:** Proper semantic HTML and ARIA attributes

## Data Structure

### Category Type
```typescript
type Category = {
  category_id: number;
  category_name: string;
  description: string;
  created_date: string;
};
```

### Mock Categories
1. **Baby Feeding** - Bottles, pacifiers, and feeding accessories
2. **Diapering** - Diapers, wipes, and changing essentials
3. **Baby Gear** - Strollers, car seats, and travel accessories
4. **Nursing & Pumping** - Breast pumps, nursing bras, and feeding supplies

## Development Setup

### Prerequisites
- Node.js (version not specified)
- npm/yarn package manager

### Installation & Running
```bash
cd frontend
npm install
npm run dev    # Development server on port 3000
npm run build  # Production build
npm run start  # Production server on port 3000
```

## Dependencies

### Production Dependencies
- `next`: ^14.2.5 - React framework
- `react`: ^18.3.1 - UI library
- `react-dom`: ^18.3.1 - DOM rendering
- `zustand`: ^4.5.2 - State management
- `class-variance-authority`: ^0.7.0 - Component variants
- `clsx`: ^2.1.1 - Conditional class names
- `tailwind-merge`: ^2.5.2 - Tailwind class merging

### Development Dependencies
- `autoprefixer`: ^10.4.20 - CSS vendor prefixes
- `postcss`: ^8.4.41 - CSS processing
- `tailwindcss`: ^3.4.10 - Utility-first CSS framework
- `@types/node`: ^20.14.10 - Node.js type definitions
- `@types/react`: ^18.3.3 - React type definitions
- `@types/react-dom`: ^18.3.0 - React DOM type definitions
- `typescript`: ^5.5.4 - TypeScript compiler

## Current State

### Working Features
- ✅ Category table display
- ✅ Responsive design
- ✅ TypeScript type safety
- ✅ Component-based architecture
- ✅ State management with Zustand

### Pending Development
- 🔄 Backend API integration
- 🔄 Database connection
- 🔄 CRUD operations for categories
- 🔄 User authentication
- 🔄 Additional UI components

## Recent Changes

1. **Table Component Creation** - Built custom table components to resolve import errors
2. **Category Store Implementation** - Converted from product store to category store
3. **UI Updates** - Updated page to display categories instead of products
4. **Mock Data Addition** - Added 4 realistic baby product categories

## Technical Notes

- Uses Next.js App Router (not Pages Router)
- Implements 'use client' directive for client-side components
- Custom table components with forwardRef for proper ref handling
- Tailwind CSS with custom utility function for class merging
- TypeScript strict mode enabled
- No backend integration currently implemented

## Next Steps

1. Implement backend API endpoints
2. Add database integration
3. Implement CRUD operations
4. Add form components for category management
5. Add user authentication
6. Implement product management within categories
7. Add search and filtering capabilities

---

*This snapshot represents the current state of the Bitterrock repository as of December 2024.*
