# MediQueue Express API — Assignment 9 (CAT_02)

Express 5 + MongoDB API for the MediQueue tutor-booking system. Public routes support tutor discovery; private routes verify Better Auth JWTs against the client application's JWKS endpoint.

## Features

- MongoDB indexes for tutor discovery, owner records, student bookings, and unique session tokens
- Featured endpoint with MongoDB `.limit(6)`
- Escaped case-insensitive tutor-name `$regex` search
- Exact subject filter and `$gte` / `$lte` tutor-registration date range
- JWT signature, issuer, audience, expiration, and email verification through remote Better Auth JWKS
- Owner-only tutor creation, update, deletion, and My Tutors query
- Server-attached creator identity; client-submitted ownership fields are never trusted
- Start-date restriction and atomic conditional slot decrement
- Generated digital session token and automatic `booked` status
- Compensating slot restore if booking insertion fails
- Race-safe cancellation that restores exactly one slot
- CORS allowlist, centralized API errors, health endpoint, and demo seed

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Default base URL: `http://localhost:5001/api`

The client must run on the exact origin configured in `CLIENT_URL`. `BETTER_AUTH_ISSUER` and `BETTER_AUTH_AUDIENCE` must match the Better Auth base URL exactly.

## Endpoints

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Service health |
| GET | `/api/tutors/featured` | Public | Six recent tutors |
| GET | `/api/tutors` | Public | Search/filter tutors |
| GET | `/api/tutors/:id` | Public API | Tutor detail data |
| GET | `/api/tutors/mine` | JWT | Current user's tutors |
| POST | `/api/tutors` | JWT | Create tutor |
| PATCH | `/api/tutors/:id` | JWT owner | Update tutor |
| DELETE | `/api/tutors/:id` | JWT owner | Delete tutor |
| GET | `/api/bookings/mine` | JWT | Current user's bookings |
| POST | `/api/bookings` | JWT | Reserve an eligible slot |
| PATCH | `/api/bookings/:id/cancel` | JWT owner | Cancel and restore slot |

## Checks

```bash
npm run check
npm test
```

The included Node test suite checks safe regex escaping, ObjectId validation, and MongoDB response serialization.

## Deployment

Deploy this folder to Render or Vercel, configure every key from `.env.example`, set `CLIENT_URL` to the deployed client origin, and point the JWKS URL to `https://your-client-domain/api/auth/jwks`.

Never commit `.env` or real credentials.
