# WorkScheduleTracker

## Overview

WorkScheduleTracker is a full-stack web application for managing employee work schedules. It provides a comprehensive solution for tracking shifts, managing employees and positions, and generating reports. The application features a modern React frontend with TypeScript, a Node.js/Express backend, and PostgreSQL database integration.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Custom component library built with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (via Neon serverless)
- **API Design**: RESTful API endpoints with proper error handling
- **Development**: Hot reloading with tsx for development server

### Database Schema

- **employees**: Core employee information with status tracking
- **positions**: Job positions with department categorization
- **shiftTypes**: Configurable shift templates with time ranges and color coding
- **shifts**: Individual shift assignments linking employees, positions, and shift types

## Key Components

### Data Management

- **Storage Layer**: Abstracted storage interface with PostgreSQL implementation
- **Schema Validation**: Zod schemas for runtime type checking and validation
- **Type Safety**: End-to-end TypeScript types shared between client and server

### User Interface

- **Calendar View**: Primary interface for visualizing and managing shifts
- **Employee Management**: CRUD operations for employee data
- **Position Management**: Department and role organization
- **Shift Type Configuration**: Customizable shift templates
- **Reporting**: Employee hours and scheduling analytics
- **Organizational Chart**: Visual representation of company structure

### API Endpoints

- **Employees**: `/api/employees` - Full CRUD operations
- **Positions**: `/api/positions` - Position management
- **Shift Types**: `/api/shift-types` - Shift template configuration
- **Shifts**: `/api/shifts` - Shift scheduling and retrieval
- **Reports**: `/api/reports/*` - Analytics and reporting endpoints

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data
2. **API Layer**: Express routes handle requests and validate input
3. **Business Logic**: Storage layer processes operations with proper error handling
4. **Database**: Drizzle ORM executes type-safe SQL operations against PostgreSQL
5. **Response**: JSON responses with proper error codes and validation feedback
6. **UI Updates**: React Query manages cache invalidation and optimistic updates

## External Dependencies

### Core Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **@radix-ui/\***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation

### Development Tools

- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling
- **drizzle-kit**: Database migrations and schema management

## Deployment Strategy

### Development

- **Command**: `npm run dev` starts both frontend and backend in development mode
- **Port**: Application runs on port 5000 with hot reloading
- **Database**: Requires DATABASE_URL environment variable for PostgreSQL connection

### Production Build

- **Frontend**: `vite build` compiles React app to static assets
- **Backend**: `esbuild` bundles server code with external dependencies
- **Start**: `npm run start` runs the production server

### Database Management

- **Schema**: Shared schema definition in `shared/schema.ts`
- **Migrations**: `npm run db:push` applies schema changes
- **Configuration**: Drizzle config points to PostgreSQL dialect

### Replit Configuration

- **Modules**: nodejs-20 and web modules enabled
- **Deployment**: Autoscale deployment target configured
- **Build Process**: Automated build and start commands
- **Port Mapping**: Internal port 5000 mapped to external port 80

## Changelog

- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
