# 1. Authentication Flow Diagram

    ┌───────────────┐
    │   Client      │
    │ (Frontend)    │
    └──────┬────────┘
           │
           │ 1. Register / Login
           ▼
    ┌───────────────────────┐
    │   Auth API (Express)  │
    └──────┬────────────────┘
           │
           │ 2. Validate credentials
           ▼
    ┌───────────────────────┐
    │   MongoDB (User DB)   │
    └──────┬────────────────┘
           │
           │ 3. Generate tokens
           │   - Access Token (short-lived)
           │   - Refresh Token (long-lived)
           ▼
    ┌────────────────────────────┐
    │   Send Response to Client  │
    │{accessToken, refreshToken }|
    └──────────┬─────────────────┘
           │
           │ 4. Store tokens
           │ (localStorage / memory)
           ▼
    ┌────────────────────────────┐
    │   Client uses API          │
    │ Authorization: Bearer AT   │
    └──────────┬─────────────────┘
               │
               │ 5. Access protected routes
               ▼
    ┌────────────────────────────┐
    │   Auth Middleware          │
    │ Verify Access Token        │
    └──────────┬─────────────────┘
               │
               ▼
      Authorized Response and get access

# 2. Token Lifecycle Diagram (IMPORTANT – High Value)

                ┌──────────────────────┐
                │      LOGIN           │
                └─────────┬────────────┘
                          │
                          ▼
        ┌──────────────────────────────────┐
        │ Issue Tokens                     │
        │ - Access Token (15 min)          │
        │ - Refresh Token (7 days)         │
        └─────────┬────────────────────────┘
                  │
                  ▼
        ┌──────────────────────────────┐
        │ Client uses Access Token     │
        │ for API requests             │
        └─────────┬────────────────────┘
                  │
                  │ (Access Token expires)
                  ▼
        ┌──────────────────────────────┐
        │ Client calls /refresh        │
        │ with Refresh Token           │
        └─────────┬────────────────────┘
                  │
                  ▼
        ┌──────────────────────────────┐
        │ Server verifies RT           │
        │ (exists in DB?)              │
        └─────────┬────────────────────┘
                  │
        ┌─────────┴──────────────┐
        │                        │
        ▼                        ▼
    Invalid RT               Valid RT
    (reject request)         (ROTATION FLOW)
                              │
                              ▼
        ┌──────────────────────────────────┐
        │ Invalidate old Refresh Token     │
        │ Generate new RT + new AT         │
        │ Save new RT in DB                │
        └─────────┬────────────────────────┘
                  │
                  ▼
        ┌──────────────────────────────┐
        │ Send new Access Token        │
        │ (optionally new Refresh)     │
        └─────────┬────────────────────┘
                  │
                  ▼
        🔁 Cycle continues securely


# 3. Logout Flow (Security Critical)

    Client → POST /logout (with Access Token)
            │
            ▼
    Server:
      - Identify user
      - Delete refresh token from DB
            │
            ▼
    Response:
      "Logged out successfully"

    Any future refresh attempt = ❌ rejected

# 4. Email Verification Flow

    Register User
         │
         ▼
    Generate Verification Token
         │
     ▼
    Send (or log) verification link
         │
         ▼
    User clicks:
    GET /verify-email/:token
         │
         ▼
    Server:
      - Match token
      - Mark isVerified = true
           │
           ▼
        Email verified


# 5. Password Reset Flow
    User → POST /forget-password
            │
            ▼
    Generate Reset Token
            │
            ▼
    Send reset link
            │
            ▼
    User → PATCH /reset-password/:token
            │
            ▼
    Server:
      - Validate token
      - Update password (bcrypt)
            │
            ▼
    Password reset successful


