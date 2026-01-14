# ExamPro CMS - Exam Question Management System

## Overview

ExamPro CMS is a content management system for managing past questions and answers for national exams. The application allows administrators to create and organize exams, subjects, and questions with a hierarchical structure. It supports bulk uploading of questions via spreadsheets and provides a dashboard for monitoring content statistics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite for development and production builds

The frontend follows a page-based architecture with shared components. Authentication state is managed through a custom `useAuth` hook that queries the backend. The app uses a sidebar layout with navigation to different content sections (Dashboard, Exams, Subjects, Questions, Bulk Upload).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

The backend exposes RESTful API endpoints under `/api/` for CRUD operations on exams, subjects, questions, and answers. All data routes are protected with authentication middleware. The server serves the built frontend in production or uses Vite middleware in development.

### Data Model
The database schema follows a hierarchical structure:
- **Exams**: Top-level entities representing national exams (e.g., JAMB, WAEC)
- **Subjects**: Categories within each exam (e.g., Mathematics, English)
- **Questions**: Individual exam questions with metadata (year, difficulty, topic)
- **Answers**: Multiple choice answers for each question with correct answer marking

### Authentication Flow
The application uses Replit Auth for user authentication. Sessions are stored in PostgreSQL, and user data is persisted in a users table. The auth system is integrated as middleware that protects API routes and provides user context to the frontend.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store for all application data
- **Drizzle ORM**: Type-safe database queries and schema management
- **drizzle-kit**: Database migration tooling (uses `db:push` command)

### Authentication
- **Replit Auth**: OAuth/OpenID Connect provider for user authentication
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **express-session**: Session management with PostgreSQL store

### Third-Party Libraries
- **xlsx**: Spreadsheet parsing for bulk question upload feature
- **zod**: Runtime validation for API requests and form data
- **TanStack Query**: Data fetching and caching for the frontend

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: Replit Auth OIDC issuer URL (defaults to https://replit.com/oidc)
- `REPL_ID`: Replit environment identifier