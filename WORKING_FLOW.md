# Secure-Auth-System Working Flow (Team Guide)

This document explains exactly how the project works end-to-end, from frontend actions to backend processing.

## 1. High-Level Architecture

Frontend:
- `frontend/index.html` + `frontend/script.js`: Auth UI and API calls
- `frontend/dashboard.html`: Protected page check

Backend:
- `src/server.js`: bootstraps env, DB, HTTP server
- `src/app.js`: Express app setup, CORS, route mounting, error middleware
- `src/modules/auth/*`: registration, login, refresh, verify email, forgot/reset password, logout
- `src/config/googleClient.js`: Google OAuth client used to verify Google ID tokens
- `src/modules/users/*`: protected users routes (currently in-memory data)

Database:
- MongoDB stores auth users via `auth.model.js`
- `users` module uses `users/data.js` array (not MongoDB)

## 2. Startup Flow (Backend)

1. `src/server.js` loads `.env` (`dotenv.config()`).
2. Express app is imported from `src/app.js`.
3. `app.listen(PORT)` starts API server.
4. `connectDB()` connects to MongoDB using `MONGO_URI`.
5. If DB connect fails, server process exits (`process.exit(1)`).
6. Google auth verification uses `GOOGLE_CLIENT_ID` via `src/config/googleClient.js`.

In `src/app.js`:
1. CORS is enabled only for `http://127.0.0.1:5500`.
2. JSON + URL-encoded parsers are enabled.
3. Auth routes mounted (`app.use(authRouter)`).
4. User routes mounted (`app.use(userRoute)`).
5. Global error middleware is mounted last.

## 3. Frontend Working Flow

## 3.1 Auth Page (`index.html` + `script.js`)

UI sections:
- Register form
- Login form
- Email verification actions
- Resend verification form
- Refresh token action
- Forgot password form
- Reset password form
- Logout action

Main browser storage keys:
- `token` (access token)
- `refreshToken`
- `username`
- `verifyToken`

URL-assisted flows:
- `?verifyToken=<token>` can be used by the verify action
- `?resetToken=<token>` can prefill reset password flow

## 3.2 Dashboard (`dashboard.html`)

1. Reads `localStorage.token`.
2. If no token: redirect to `index.html`.
3. Calls `GET /users` with `Authorization: Bearer <token>`.
4. If API returns non-200 or throws:
- clears token/user local storage
- redirects to `index.html`.
5. If success: dashboard stays accessible.

## 4. Core End-to-End User Journeys

## 4.1 Registration Flow

Frontend:
1. User submits register form.
2. `POST /register` with `{ username, email, password }`.
3. Stores returned `accessToken`, `refreshToken`, `verificationToken`.
4. Shows verification guidance message.

Backend:
1. `auth.routes.js` -> `register`.
2. `register` controller -> `registerfn`.
3. `registerfn`:
- checks existing email
- hashes password (`bcrypt`)
- creates MongoDB user
- generates access + refresh tokens
- generates email verification token
- saves refresh token + verification token fields
4. Returns auth payload.

## 4.2 Login Flow

Frontend:
1. User submits login form.
2. `POST /login` with `{ email, password }`.
3. On success, stores tokens and redirects to `dashboard.html`.

Backend:
1. Route -> `login` controller.
2. Validates email/password presence.
3. `loginfn` finds user by email.
4. Compares password using `bcrypt.compare`.
5. Generates new access + refresh token.
6. Saves refresh token on user document.
7. Returns tokens + username.

## 4.3 Accessing Protected API

Frontend:
1. Sends `Authorization: Bearer <accessToken>`.

Backend:
1. `authMiddleware` checks bearer header.
2. Verifies JWT using `JWT_SECRET`.
3. Adds decoded payload to `req.user`.
4. Calls next controller.
5. If invalid/missing token -> 401 via `AppError`.

## 4.4 Refresh Token Flow

Frontend:
1. User clicks refresh button.
2. `POST /refresh` with `{ refreshToken }`.
3. Stores returned new access token.

Backend:
1. Route uses `verifyRefreshToken` middleware first.
2. Middleware validates refresh token JWT using `JWT_REFRESH`.
3. Finds user by decoded `id`.
4. Compares provided refresh token with DB stored token.
5. If valid, sets `req.user` and continues.
6. Controller creates new access token and returns it.

## 4.5 Email Verification Flow

Registration:
1. Backend generates raw verification token.
2. Hash of token stored in DB with expiry (10 min).

Verification:
1. Frontend calls `GET /verify-email/:token`.
2. Controller hashes provided token.
3. Finds user where hashed token matches and expiry > now.
4. Sets `isVerified=true`, clears verification fields.
5. Saves and returns success.

Resend:
1. Frontend posts email to `/resend-verification`.
2. Controller validates user and `isVerified` status.
3. Generates new verification token + expiry.
4. Saves user and logs URL in server console.

## 4.6 Forgot + Reset Password Flow

Forgot:
1. Frontend `POST /forget-password` with email.
2. Backend finds user.
3. Creates raw reset token, stores hashed token + 10 min expiry.
4. Logs reset URL in console.

Reset:
1. Frontend submits new password and token to `PATCH /reset-password/:token`.
2. Controller hashes token from URL.
3. Finds user by hashed token + valid expiry.
4. Hashes `newPassword` and updates user password.
5. Clears reset token fields.
6. Saves and returns success.

## 4.7 Logout Flow

Frontend:
1. Sends `POST /logout` with access token in bearer header.
2. On success clears local storage auth keys.

Backend:
1. `authMiddleware` validates access token.
2. Controller finds user by `req.user.id`.
3. Clears `refreshToken` in DB.
4. Saves and returns success.

## 4.8 Google Authentication Flow

Backend:
1. Frontend or another client sends `POST /google` with a Google ID token.
2. Controller validates the token with `google-auth-library`.
3. Token is verified against `process.env.GOOGLE_CLIENT_ID`.
4. Payload fields such as `sub`, `email`, `name`, and `picture` are extracted.
5. If the user does not already exist, a new MongoDB user is created with:
- `googleId`
- `avatar`
- `authProvider`
- `isVerified = true`
6. Backend generates a local SmartAuth access token.
7. Response returns `accessToken` and the user document.

Behavior notes:
- This flow bypasses password hashing because the identity is delegated to Google.
- Current implementation returns only an access token, not a refresh token.
- Current frontend does not expose a Google login button, so this route is API-only unless another client calls it.

## 5. Backend Request Lifecycle (Generic)

1. Request enters Express app.
2. CORS + body parsing middleware runs.
3. Matching route is resolved.
4. Route-level middleware runs (auth, refresh-check, role-check).
5. Controller executes business logic.
6. Service functions interact with DB or in-memory data.
7. Success response sent as JSON.
8. Any thrown/rejected errors pass through `catchAsync` to global `errorMiddleware`.

## 6. File Responsibility Map

Auth module:
- `auth.routes.js`: endpoint mapping
- `auth.controller.js`: request/response layer
- `auth.services.js`: token/password business logic
- `auth.middleware.js`: access/refresh/role middleware
- `auth.model.js`: Mongo user schema
- `googleClient.js`: shared Google OAuth2 client

Users module:
- `users.routes.js`: protected routes
- `users.controllers.js`: users route handlers
- `users.services.js`: in-memory user operations
- `data.js`: source data array

Utilities:
- `catchAsync.js`: async error wrapper
- `AppError.js`: operational error object
- `error.middleware.js`: final error response formatter

## 7. Known Behaviors Team Should Know

1. Auth users and users module are separate data sources.
2. CORS only allows `http://127.0.0.1:5500`.
3. Verification and reset links are printed to backend console, not emailed.
4. `GET /admin/users` uses `restrictTo("admin")` but role enum includes `"Admin"` and `"user"` (case mismatch risk).
5. Dashboard access depends on `GET /users` returning success with valid bearer token.
6. Google-authenticated users are stored in the same MongoDB collection as local users, with provider-specific fields.
7. The Google auth route currently appears to have a provider casing mismatch risk because the schema enum is `["local","Google"]` while the controller writes `"google"`.

## 8. Quick Troubleshooting Flow

If login succeeds but dashboard redirects:
1. Confirm backend is running on `http://localhost:4000`.
2. Confirm `GET /users` route exists and is protected.
3. Confirm browser has `localStorage.token`.
4. Confirm token is sent in `Authorization` header.

If refresh fails:
1. Check `refreshToken` exists in localStorage.
2. Check DB user `refreshToken` matches sent token.
3. Check `JWT_REFRESH` secret and token expiry.

If reset password succeeds but login fails:
1. Ensure login uses updated password.
2. Confirm reset token was not expired.
3. Check backend logs for auth errors.

## 9. Suggested Team Workflow

1. Start backend (`npm start`) and MongoDB first.
2. Open frontend through static server at `127.0.0.1:5500`.
3. Test flows in order:
- register
- verify/resend verify
- login
- dashboard protected check
- refresh
- forgot/reset
- login with new password
- logout
- optional API test for `POST /google` if `GOOGLE_CLIENT_ID` is configured
