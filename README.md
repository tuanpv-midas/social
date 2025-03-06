# Blog & Community Platform with Waitlist

A dynamic waitlist platform that blends community engagement with sleek landing page design, enabling startups to manage and grow their potential user base effectively.

## Features

- Next.js frontend with TypeScript
- PostgreSQL database integration
- Responsive design
- Community interaction features
- Authentication system
- Waitlist management

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm (comes with Node.js)
- PostgreSQL database (or use the provided Neon PostgreSQL)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-session-secret
```

## Database Setup

1. **Option 1: Using Replit Database**
   - The database is automatically provisioned when you run the application on Replit
   - Environment variables are automatically set up

2. **Option 2: Local PostgreSQL Setup**
   - Install PostgreSQL on your machine
   - Create a new database
   - Update the `DATABASE_URL` in your `.env` file
   - Run the following commands to set up the database:

   ```bash
   # Install dependencies
   npm install

   # Push the database schema
   npm run db:push
   ```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Application pages
│   │   ├── lib/          # Utility functions
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend application
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── db.ts           # Database configuration
├── shared/              # Shared code between frontend and backend
│   └── schema.ts       # Database schema and types
└── drizzle.config.ts   # Drizzle ORM configuration
```

## Database Schema

The application uses Drizzle ORM with the following main tables:

- `waitlist`: Stores waitlist entries
- `users`: User accounts and profiles
- `articles`: Blog posts
- `comments`: Article comments
- `follows`: User relationships
- `bookmarks`: Saved articles
- `reading_history`: Article view history

## API Routes

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout
- `GET /api/auth/me`: Get current user

### Articles
- `GET /api/articles`: Get all articles
- `POST /api/articles`: Create new article
- `GET /api/articles/:id`: Get specific article
- `GET /api/articles/:id/comments`: Get article comments

### Social Features
- `POST /api/users/:id/follow`: Follow a user
- `POST /api/users/:id/unfollow`: Unfollow a user
- `GET /api/users/:id/followers`: Get user followers
- `GET /api/users/:id/following`: Get followed users

### Waitlist
- `POST /api/waitlist`: Join waitlist
- `GET /api/waitlist/count`: Get waitlist count

## Common Issues & Troubleshooting

1. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Check network connectivity

2. **Build Errors**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. **TypeScript Errors**
   - Run `npm run build` to check for type errors
   - Ensure all required types are properly imported

## Development Guidelines

1. **Code Style**
   - Use TypeScript for type safety
   - Follow the existing project structure
   - Use shadcn UI components for consistency

2. **Database Operations**
   - Always use the storage interface for database operations
   - Add new database operations to `server/storage.ts`
   - Update types in `shared/schema.ts`

3. **API Development**
   - Add new routes to `server/routes.ts`
   - Use proper error handling
   - Validate requests using Zod schemas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
