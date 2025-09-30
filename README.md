# Bitterrock - Full-Stack E-commerce Application

A modern full-stack web application for KiddyCare - maternity and baby products, built with Next.js, Express.js, and PostgreSQL.

## 🏗️ Project Structure

```
Bitterrock/
├── frontend/                 # Next.js React application
│   ├── app/                  # App Router pages and components
│   ├── components/           # Reusable UI components
│   ├── src/                  # Source code and stores
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── tsconfig.json         # TypeScript configuration
│
├── backend/                  # Express.js API server
│   ├── src/                  # Backend source code
│   │   ├── controllers/      # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
├── database/                 # Database configuration and scripts
│   ├── schemas/             # Database schemas
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Database seed data
│   ├── connection.ts        # Database connection utility
│   ├── package.json        # Database dependencies
│   └── *.sql               # SQL scripts
│
├── environment/             # Environment configuration
│   ├── .env.local          # Local environment variables (DO NOT COMMIT)
│   └── .env.example        # Environment template
│
├── packages/               # Shared packages and utilities
│
├── package.json           # Root package.json with workspace scripts
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- PostgreSQL database

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd Bitterrock
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp environment/.env.example environment/.env.local
   # Edit environment/.env.local with your database credentials
   ```

3. **Set up the database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📋 Available Scripts

### Root Level Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start both frontend and backend in production mode
- `npm run install:all` - Install dependencies for all workspaces
- `npm run clean` - Clean node_modules and build artifacts

### Frontend Scripts
- `npm run dev:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend for production
- `npm run start:frontend` - Start frontend production server

### Backend Scripts
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend for production
- `npm run start:backend` - Start backend production server

### Database Scripts
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

## 🔧 Technology Stack

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5.5.4
- **Styling:** Tailwind CSS 3.4.10
- **State Management:** Zustand 4.5.2
- **UI Components:** Custom components with Shadcn UI patterns

### Backend
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL with pg driver
- **Authentication:** JWT tokens
- **Validation:** Joi
- **Security:** Helmet, CORS

### Database
- **Database:** PostgreSQL 16
- **ORM:** Native pg driver
- **Migrations:** Custom migration scripts
- **Connection Pooling:** pg Pool

## 🔐 Environment Variables

Create `environment/.env.local` with the following variables:

```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=your-database-port
DB_NAME=your-database-name
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_SSL=false

# Backend Configuration
PORT=3001
JWT_SECRET=your-jwt-secret
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Categories** - Product categories
- **Products** - Product catalog
- **Customers** - Customer information
- **Orders** - Order management
- **Order Items** - Order line items
- **Inventory** - Stock management
- **Payments** - Payment processing
- **Shipping** - Delivery tracking
- **Reviews** - Product reviews
- **Search History** - User search tracking

## 🛡️ Security Features

- Environment variables for sensitive data
- SQL injection prevention with parameterized queries
- CORS configuration
- Helmet security headers
- Password hashing with bcrypt
- JWT token authentication
- Input validation with Joi

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Set production environment variables
- Configure database connection
- Set up reverse proxy (nginx)
- Configure SSL certificates

## 📝 Development Guidelines

1. **Code Organization:** Follow the established folder structure
2. **TypeScript:** Use strict TypeScript configuration
3. **Database:** Use migrations for schema changes
4. **Environment:** Never commit `.env.local` files
5. **Testing:** Write tests for critical functionality
6. **Documentation:** Update README when adding new features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.