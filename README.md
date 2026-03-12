# Frontend Application

The frontend is a [Next.js](https://nextjs.org/) application that serves as the user interface for the GWALK project. It communicates with the backend via a middleware proxy.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- **Backend**: Must be running (see [Backend Setup](../backend/README.md))
- **Database**: Must be running (see [Database Setup](../database/README.md))

## Getting Started

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   **Important:** Open `.env` and fill in your authentication secrets, database URL, and Google OAuth credentials.

4. Run Database Migrations (if not done in backend):
   The frontend also uses Prisma for authentication models.
   ```bash
   npx prisma generate
   ```

5. Start the Development Server:
   ```bash
   npm run dev
   ```

   The application will be available at **http://localhost:3000**.

## Project Structure

- `src/app`: App Router pages and layouts.
- `src/components`: Reusable UI components (Shadcn UI).
- `src/utils/api*.ts`: API client functions (calls `/backend/...`).
- `src/middleware.ts`: Proxies requests starting with `/backend` to the actual Backend API.

## Scripts

- `npm run dev`: Starts the dev server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint.
