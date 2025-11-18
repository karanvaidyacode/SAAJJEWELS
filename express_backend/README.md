Express backend for SaajJewels

Setup:

1. Copy .env.example to .env and fill values.
2. Install dependencies: npm install
3. Run in development: npm run dev

Endpoints:

- POST /auth/send-otp { email }
- POST /auth/verify-otp { email, otp }
- GET /auth/google -> redirects to Google
- GET /auth/google/callback -> Google callback

Notes:

- Uses MongoDB (local or Atlas)
- Uses Mailtrap for email in development
