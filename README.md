# Backend

This is the backend server for the full project, built with Node.js and Express.

## Setup

1. Navigate to the Backend directory:
   ```
   cd Backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Or start the production server:
   ```
   npm start
   ```

The server will run on `http://localhost:3001` by default.

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/pages` - Get all page data
- `GET /api/pages/:page` - Get specific page data (home, about, services, contact)

## Project Structure

- `server.js` - Main server file
- `routes/api.js` - API routes
- `package.json` - Dependencies and scripts