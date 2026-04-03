# Secure-Auth-Api

SecureAuthApi is a full-stack authentication project using:

- Node.js + Express (REST API)
- MongoDB + Mongoose (auth user persistence)
- JWT access/refresh token flow
- Vanilla HTML/CSS/JavaScript frontend

It includes registration, login, email verification token flow, refresh token rotation check, forgot/reset password, logout, and protected user routes.

Detailed team flow guide: see `WORKING_FLOW.md`.

## Features

- Register user with hashed password (`bcryptjs`)
- Login with JWT access token + refresh token
- Refresh access token using stored refresh token
- Email verification token generation and verification endpoint
- Resend verification token endpoint
- Forgot password token generation and reset password endpoint
- Logout endpoint (clears refresh token server-side)
- Google sign-in using Google ID token verification
- Protected routes with `Authorization: Bearer <token>`
- Basic role guard middleware (`restrictTo`)
- Frontend auth page and protected dashboard

## Tech Stack

- Runtime: Node.js
- Backend: Express 5
- Database: MongoDB
- ODM: Mongoose
- Auth: JSON Web Tokens (`jsonwebtoken`)
- Password hashing: `bcryptjs`
- Google OAuth token verification: `google-auth-library`
- Frontend: HTML, CSS, JavaScript (no framework)

## Project Structure

```text
smartAuth/
  frontend/
    index.html
    style.css
    script.js
    dashboard.html
  src/
    app.js
    server.js
    middlewares/
      error.middleware.js
    modules/
      auth/
        auth.model.js
        auth.routes.js
        auth.controller.js
        auth.services.js
        auth.middleware.js
      users/
        users.routes.js
        users.controllers.js
        users.services.js
        data.js
    config/
      googleClient.js
    utils/
      AppError.js
      catchAsync.js
  .env
  package.json
```

## Architecture Notes

- Auth module uses MongoDB (`auth.model.js`) for real user records.
- Auth module supports both local auth and Google-based auth provider records.
- `users` module currently uses in-memory array data (`users/data.js`) and is separate from auth users.
- CORS is currently restricted to `http://127.0.0.1:5500` in `src/app.js`.
- Password reset and email verification links are currently logged in the server console (email sending is not integrated yet).
- Google sign-in uses `src/config/googleClient.js` and requires a valid Google ID token from the frontend.

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB running locally (or cloud URI)

## Environment Variables

Create `smartAuth/.env`:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/authDB
JWT_SECRET=your_access_token_secret
JWT_REFRESH=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Important:
- Use strong random secrets for `JWT_SECRET` and `JWT_REFRESH`.
- Set `GOOGLE_CLIENT_ID` if you want to use the `/google` login route.
- Do not commit real secrets to source control.

## Installation

```bash
cd smartAuth
npm install
```

## Run Backend

```bash
npm start
```

Server default:

```text
http://localhost:4000
```

## Run Frontend

Use a static server (example: VS Code Live Server) and open:

```text
http://127.0.0.1:5500/frontend/index.html
```

This origin matches the current backend CORS config.

## Authentication Flow

1. Register via `/register`
2. Receive `accessToken`, `refreshToken`, `verificationToken`
3. Verify email via `/verify-email/:token` (optional flow available in UI)
4. Login via `/login`
5. Access protected routes using `Authorization: Bearer <accessToken>`
6. Refresh token via `/refresh` when access token expires
7. Logout via `/logout` to clear refresh token in DB

## API Endpoints

Base URL: `http://localhost:4000`

### Auth Routes

1. `POST /register`
- Body:
```json
{
  "username": "John",
  "email": "john@example.com",
  "password": "Secret@123"
}
```
- Success `201`:
```json
{
  "message": "User Registeration Successfull",
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "verificationToken": "<raw-token>",
  "user": {
    "id": "<mongo-id>",
    "username": "John",
    "email": "john@example.com"
  }
}
```

2. `POST /login`
- Body:
```json
{
  "email": "john@example.com",
  "password": "Secret@123"
}
```
- Success `200`:
```json
{
  "message": "Login Successful",
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "username": "John"
}
```

3. `POST /refresh`
- Body:
```json
{
  "refreshToken": "<jwt>"
}
```
- Success `200`:
```json
{
  "accessToken": "<new-jwt>"
}
```

4. `GET /verify-email/:token`
- Success `200`:
```json
{
  "message": "Email verified successfully"
}
```

5. `POST /resend-verification`
- Body:
```json
{
  "email": "john@example.com"
}
```
- Success `200`:
```json
{
  "message": "Verification email resent successfully"
}
```

6. `POST /forget-password`
- Body:
```json
{
  "email": "john@example.com"
}
```
- Success `200`:
```json
{
  "message": "Password Reset Link Send"
}
```

7. `PATCH /reset-password/:token`
- Body:
```json
{
  "newPassword": "NewSecret@123"
}
```
- Success `200`:
```json
{
  "message": "Passowrd Reset Successful"
}
```

8. `POST /logout` (Protected)
- Header:
```http
Authorization: Bearer <accessToken>
```
- Success `200`:
```json
{
  "message": "Logged out successfully"
}
```

9. `POST /google`
- Body:
```json
{
  "token": "<google-id-token>"
}
```
- Success `200`:
```json
{
  "message": "Google Login Successful",
  "accessToken": "<jwt>",
  "user": {
    "_id": "<mongo-id>",
    "username": "John",
    "email": "john@example.com",
    "googleId": "<google-sub>",
    "avatar": "https://...",
    "authProvider": "google",
    "isVerified": true
  }
}
```

### User Routes

1. `GET /users` (Protected)
- Header:
```http
Authorization: Bearer <accessToken>
```

2. `GET /admin/users` (Protected + role restricted)
- Header:
```http
Authorization: Bearer <accessToken>
```

3. `GET /users/:id` (Protected via router scope)

4. `POST /users` (Protected via router scope)

5. `PATCH /users/:id` (Protected via router scope)

6. `DELETE /users/:id` (Protected via router scope)

Note: `/users*` endpoints operate on in-memory `data.js`, not MongoDB auth users.

## Frontend Pages

- `frontend/index.html`
  - Register and login forms
  - Verify email token action
  - Resend verification form
  - Refresh access token action
  - Forgot password form
  - Reset password form
  - Logout action
  - URL token parsing for email verification and password reset flows

- `frontend/dashboard.html`
  - Checks `localStorage.token`
  - Calls `GET /users` with bearer token
  - Redirects to auth page if unauthorized

## Example cURL Commands

1. Register
```bash
curl -X POST http://localhost:4000/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"Demo\",\"email\":\"demo@example.com\",\"password\":\"Demo@123\"}"
```

2. Login
```bash
curl -X POST http://localhost:4000/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@example.com\",\"password\":\"Demo@123\"}"
```

3. Refresh token
```bash
curl -X POST http://localhost:4000/refresh ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"<refresh-token>\"}"
```

4. Protected users route
```bash
curl http://localhost:4000/users ^
  -H "Authorization: Bearer <access-token>"
```

5. Google auth
```bash
curl -X POST http://localhost:4000/google ^
  -H "Content-Type: application/json" ^
  -d "{\"token\":\"<google-id-token>\"}"
```

## Scripts

- `npm start`: starts backend server (`node src/server.js`)
- `npm test`: placeholder

## Error Handling

- Custom `AppError` class (`src/utils/AppError.js`)
- `catchAsync` helper wraps async controllers
- Central error middleware (`src/middlewares/error.middleware.js`)
- Standard error response:

```json
{
  "status": "Error",
  "message": "Some error message"
}
```

## Current Limitations

- No real mail service integration (verification/reset links are logged to console)
- `users` module is in-memory and separate from auth DB model
- No request payload validation library in place
- No automated tests yet
- Role values are case-sensitive (`Admin`/`user` in model; route check uses `"admin"`)
- Google login exists as a backend route, but the current frontend does not render a dedicated Google sign-in button yet

## Recommended Improvements

1. Add input validation (Joi/Zod/express-validator)
2. Integrate email provider (SendGrid, SES, Nodemailer + SMTP)
3. Move refresh token to secure HTTP-only cookie strategy
4. Unify users module with MongoDB user model
5. Add unit/integration tests (Jest + Supertest)
6. Add linting/formatting and CI
7. Add `.env.example` and remove real secrets from tracked `.env`
8. Add a frontend Google Sign-In button that sends the Google ID token to `/google`

## Author

Prashant kumar
