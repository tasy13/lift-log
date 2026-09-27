# Lift Log

A private workout tracker built with React, Node.js, Express, MongoDB, and Mongoose. Create an account, sign in, and manage your own workout log. Passwords are hashed, sessions use an HTTP-only cookie, and each workout belongs to its signed-in user.

## Run locally in VS Code

1. Install Node.js LTS.
2. Open this project folder in VS Code and open **Terminal → New Terminal**.
3. Install dependencies once with `npm install`.
4. Copy `.env.example` to a new file named `.env`.
5. In `.env`, set `MONGODB_URI` to your MongoDB Atlas connection string and set `JWT_SECRET` to a long, private random value. In Atlas, create a database user and allow your current IP under Network Access.
6. Start the project with `npm run dev` and open the Vite URL (usually `http://localhost:5173`).
7. Choose **Create an account**. You need a working MongoDB connection to register and sign in.

Keep the `.env` file private. It is excluded from Git by `.gitignore`.

## Deploy from GitHub

Connect this repository to a Render Web Service. Set the build command to `npm install && npm run build`, the start command to `npm start`, and add `MONGODB_URI`, `JWT_SECRET`, and `NODE_ENV=production` as Render environment variables. In Atlas Network Access, allow the outbound IP ranges shown for your Render service. Never commit `.env` or publish database credentials.

## API

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — check the current session
- `POST /api/auth/logout` — sign out
- `GET /api/workouts` — list the signed-in user's workouts; supports `from`, `to`, and `category`
- `POST /api/workouts` — add a workout
- `PUT /api/workouts/:id` — edit one of your workouts
- `DELETE /api/workouts/:id` — delete one of your workouts
- `GET /api/health` — server status

## Project map

- `src/` — React interface and styling
- `server/models/` — Mongoose user and workout models
- `server/routes/` — authentication and workout API endpoints
- `server/middleware/` — sign-in verification
- `server/index.js` — Express server, MongoDB connection, and production static hosting
