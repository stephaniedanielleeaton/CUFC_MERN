# CUFC MERN Stack Application

Columbus United Fencing Club management application built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

```
CUFC-MERN/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Express backend (TypeScript)
├── packages/
│   └── shared/      # Shared types between client and server
└── package.json     # Root package.json for workspaces
```

## Prerequisites

- Node.js 20.x
- MongoDB instance (local or Atlas)
- Auth0 account for authentication
- Square account for payment integration (optional)

## Environment Variables

### Server (`server/.env`)

Copy `server/.env.example` to `server/.env` and fill in the values:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/cufc

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-audience

# Square (optional)
SQUARE_ACCESS_TOKEN=
SQUARE_SIGNATURE_KEY=
SQUARE_RETAIL_LOCATION_ID=

# App Config
PORT=5000
APP_TIMEZONE=America/New_York
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

Copy `client/.env.example` to `client/.env` and fill in the values:

```env
# Auth0
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience

# API
VITE_API_URL=http://localhost:5000

# App Config
VITE_APP_TIMEZONE=America/New_York
```

## Installation

1. Install dependencies from the root directory:

```bash
npm install
```

This will install dependencies for all workspaces (client, server, and packages/shared).

2. Build the shared package:

```bash
npm run build --workspace=@cufc/shared
```

## Development

Run both client and server in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Server only (port 5000)
npm run dev:server

# Client only (port 5173)
npm run dev:client
```

## API Endpoints

### Attendance
- `GET /api/attendance/members` - Get all members with check-in status
- `POST /api/attendance/checkin` - Toggle member check-in
- `GET /api/attendance/recent` - Get recent attendance (admin only)

### Members
- `GET /api/members/me` - Get current user's profile
- `POST /api/members/me` - Create current user's profile

### Auth
- `GET /api/auth/roles` - Get user roles from token

### Admin
- `GET /api/admin/members` - Get all members (admin only)
- `PATCH /api/admin/members/:id` - Update a member (admin only)
- `DELETE /api/admin/members/:id` - Delete a member (admin only)

### Intro Classes
- `GET /api/intro-class-offerings` - Get intro class offerings from Square

### Checkout
- `POST /api/checkout/intro` - Create checkout link for intro class

## Auth0 Configuration

1. Create a Single Page Application in Auth0 for the React client
2. Create an API in Auth0 for the Express server
3. Configure the following in Auth0:
   - Allowed Callback URLs: `http://localhost:5173`
   - Allowed Logout URLs: `http://localhost:5173`
   - Allowed Web Origins: `http://localhost:5173`
4. Add custom claims for roles using Auth0 Actions or Rules:
   - Namespace: `https://cufc.app/roles`

## Building for Production

```bash
npm run build
```

This builds both client and server.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Auth0 React SDK

### Backend
- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- Auth0 JWT validation
- Square SDK

### Shared
- TypeScript types shared between frontend and backend

## Migration from Next.js

This project was converted from a Next.js application. Key changes:
- API routes moved from Next.js App Router to Express
- Auth0 integration changed from `@auth0/nextjs-auth0` to `@auth0/auth0-react` (client) and `express-oauth2-jwt-bearer` (server)
- Tailwind configuration preserved with same custom colors
- Environment variables adapted for Vite (VITE_ prefix for client)
