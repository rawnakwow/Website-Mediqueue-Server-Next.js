# MediQueue Server

MediQueue Server is an Express and MongoDB REST API for tutor discovery, tutor management and learning-session bookings.

The server verifies Better Auth JWT access tokens through the client application's public JWKS endpoint.

This project uses **JavaScript only**. No TypeScript is used.

## Live Links

- Server: https://website-mediqueue-server-next-js.vercel.app
- API Health: https://website-mediqueue-server-next-js.vercel.app/api/health
- Client: https://website-mediqueue-online-tutor-book-alpha.vercel.app

## Main Features

- Express 5 REST API
- MongoDB native driver
- Public tutor discovery
- Featured tutor endpoint
- Tutor search by name
- Subject filtering
- Registration-date filtering
- Protected tutor creation
- Owner-only tutor update and deletion
- Better Auth JWT verification
- Remote JWKS verification
- Protected booking system
- Tutor slot validation
- Session-start-date validation
- Atomic slot reduction
- Unique session-token generation
- Booking cancellation
- Automatic slot restoration
- CORS origin protection
- Centralized error handling
- API health endpoint
- Demo data seeding
- Utility tests

## Technologies

- Node.js 20+
- Express 5
- MongoDB 7
- JOSE 6
- CORS
- Dotenv
- Nodemon
- Node Test Runner

## Project Structure

```text
src/
├── config/
│   └── db.js
├── middleware/
│   ├── auth.js
│   └── errors.js
├── routes/
│   ├── bookings.js
│   └── tutors.js
├── scripts/
│   └── seed.js
├── utils/
│   ├── query.js
│   └── query.test.js
├── app.js
└── server.js
```

## Environment Variables

Create `.env` in the server project root:

```env
PORT=5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
DB_NAME=mediqueue

CLIENT_URL=http://localhost:3000

BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks

BETTER_AUTH_ISSUER=http://localhost:3000

BETTER_AUTH_AUDIENCE=http://localhost:3000
```

Never upload `.env` to GitHub.

## Installation

```bash
npm install
```

## Run Locally

Start the Next.js client on port `3000`, and then run:

```bash
npm run dev
```

The server will run at:

```text
http://localhost:5000
```

Check the API:

```text
http://localhost:5000/api/health
```

## Available Commands

```bash
npm run dev
npm start
npm run seed
npm run check
npm test
```

## Seed Demo Data

Make sure MongoDB is configured, and then run:

```bash
npm run seed
```

## API Base URL

Local:

```text
http://localhost:5000/api
```

Production:

```text
https://website-mediqueue-server-next-js.vercel.app/api
```

## General Endpoint

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Check API status |

## Tutor Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/tutors/featured` | Public | Get six featured tutors |
| GET | `/tutors` | Public | Get and filter tutors |
| GET | `/tutors/:id` | Public | Get one tutor |
| GET | `/tutors/mine` | Private | Get authenticated user’s tutors |
| POST | `/tutors` | Private | Add a tutor |
| PATCH | `/tutors/:id` | Private/owner | Update an owned tutor |
| DELETE | `/tutors/:id` | Private/owner | Delete an owned tutor |

## Booking Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/bookings` | Private | Book a tutor session |
| GET | `/bookings/mine` | Private | Get personal bookings |
| PATCH | `/bookings/:id/cancel` | Private/owner | Cancel a booking |

## Tutor Search Parameters

`GET /api/tutors` supports:

| Parameter | Example | Description |
|---|---|---|
| `name` | `Ayesha` | Case-insensitive name search |
| `subject` | `Mathematics` | Subject filter |
| `startDate` | `2026-08-01` | Minimum creation date |
| `endDate` | `2026-12-31` | Maximum creation date |

Example:

```text
/api/tutors?name=Ayesha&subject=Mathematics&startDate=2026-08-01&endDate=2026-12-31
```

## JWT Verification

Private routes require:

```http
Authorization: Bearer JWT_TOKEN
```

The authentication middleware:

1. Reads the Bearer token.
2. Downloads the public key from `BETTER_AUTH_JWKS_URL`.
3. Verifies the JWT signature.
4. Verifies the issuer.
5. Verifies the audience.
6. Verifies the expiration date.
7. Reads the user ID, email and name from the payload.
8. Continues the protected operation.

The JWKS endpoint is:

```text
https://website-mediqueue-online-tutor-book-alpha.vercel.app/api/auth/jwks
```

The JWT issuer and audience must match the Better Auth client URL exactly.

## Booking Rules

A booking succeeds only when:

- The user provides a valid JWT
- The tutor ID is valid
- The tutor exists
- `totalSlot` is greater than zero
- Current date is on or after `sessionStartDate`
- Student name is provided
- Phone number is valid

After successful booking:

- Tutor slots decrease by one
- Booking status becomes `booked`
- A unique `MQ-...` token is generated
- Authenticated user information is attached
- Booking is saved in MongoDB

Example token:

```text
MQ-MEHS98H2-9A3F
```

After cancellation:

- Status becomes `cancelled`
- One tutor slot is restored
- Repeated cancellation does not restore additional slots

## CORS Configuration

Only origins included in `CLIENT_URL` are accepted.

Local:

```env
CLIENT_URL=http://localhost:3000
```

Multiple origins can be separated with commas:

```env
CLIENT_URL=http://localhost:3000,https://your-client.vercel.app
```

## Production Variables

Add these variables to the server Vercel project:

```env
MONGODB_URI=your-mongodb-atlas-uri
DB_NAME=mediqueue

CLIENT_URL=https://website-mediqueue-online-tutor-book-alpha.vercel.app

BETTER_AUTH_JWKS_URL=https://website-mediqueue-online-tutor-book-alpha.vercel.app/api/auth/jwks

BETTER_AUTH_ISSUER=https://website-mediqueue-online-tutor-book-alpha.vercel.app

BETTER_AUTH_AUDIENCE=https://website-mediqueue-online-tutor-book-alpha.vercel.app
```

Do not add trailing `/` to these URLs.

Redeploy the server after changing environment variables.

## Vercel Configuration

Create `vercel.json` in the server root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.js"
    }
  ]
}
```

## Common Problems

### CORS error

Check that `CLIENT_URL` exactly matches the deployed client origin.

Correct:

```text
https://website-mediqueue-online-tutor-book-alpha.vercel.app
```

Incorrect:

```text
https://website-mediqueue-online-tutor-book-alpha.vercel.app/
```

### API returns `401`

Check that:

- The user has a Better Auth session
- Client `/api/auth/token` returns a JWT
- The request contains an Authorization header
- JWKS URL is reachable
- JWT issuer and audience match the client URL

### Booking returns `409`

Check that:

- Tutor slots are greater than zero
- Session start date is today or earlier

### MongoDB fails to connect

Check that:

- `MONGODB_URI` is correct
- MongoDB username and password are correct
- `DB_NAME` is configured
- MongoDB Atlas Network Access allows the deployment

## Validation

Check JavaScript syntax:

```bash
npm run check
```

Run tests:

```bash
npm test
```

Run both:

```bash
npm run check
npm test
```

## Security

- Environment variables remain outside Git
- Private operations require JWT verification
- Tutor changes require creator ownership
- Booking cancellation requires student ownership
- The server does not trust client-provided owner emails
- Atomic MongoDB updates prevent slot conflicts
- CORS restricts unknown frontend origins

## License

Created for educational and assignment purposes.