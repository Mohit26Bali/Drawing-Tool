# CanvasFlow

A shared whiteboard. Sketch shapes, arrows, freehand lines and text on an endless board, invite people by email as
editors or viewers, and watch their cursors and drawings appear live.

- **Draw:** rectangle, ellipse, arrow, freehand, text; select, move, resize, rotate; pan, zoom; undo and redo.
- **Work together:** live shapes and cursors over WebSockets. The owner invites people by email as **editors** (draw
  and comment) or **viewers** (look only). Role changes and removals apply to open boards immediately.
- **Comment** on any shape.
- **Version history:** save snapshots (the newest 50 are kept) and restore one. Restoring first saves a copy of the
  current board.
- **Export** a board as PNG or JSON, and **import** a JSON export.
- **Keyboard shortcuts:** `V` select, `H` pan, `R` rectangle, `O` ellipse, `A` arrow, `F` freehand, `T` text,
  `Delete`, `Ctrl+Z` / `Ctrl+Shift+Z`.

## Stack

| Part | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS v4, Konva (canvas), Zustand, TanStack Query, Framer Motion, Socket.IO client |
| Backend | Node.js, Express 4, TypeScript, Socket.IO, Prisma, Zod, JWT (HS256), bcrypt |
| Database | PostgreSQL |

```text
backend/    REST API + WebSocket server (Express, Socket.IO, Prisma)
frontend/   the website (Next.js)
```

## Run it locally

You need Node.js 20 or newer and a PostgreSQL database.

```bash
# 1. the API
cd backend
cp .env.example .env            # then fill in DATABASE_URL and JWT_SECRET (see the comments inside)
npm install
npx prisma migrate deploy       # creates the tables
npm run dev                     # http://localhost:4000  (check: /health/ready)

# 2. the website (in a second terminal)
cd frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                     # http://localhost:3000
```

Create two accounts (use a private window for the second one) to try sharing: open a board, press **Share** and invite
the other account's email.

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | at least 32 random characters; the server refuses to start with a weaker one |
| `CLIENT_URL` | in production | the website's address, comma separated if several; the only origins allowed to call the API |
| `JWT_EXPIRES_IN` | no | sign-in lifetime, default `7d` |
| `PORT` | no | default `4000` |
| `TRUST_PROXY` | no | number of reverse proxies in front of the API (hosting platforms: `1`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | the API's address. It is built into the site, so set it before `npm run build`. |

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| `backend` | `npm run dev` | start the API with reload |
| `backend` | `npm run build` / `npm start` | compile to `dist/` and run it |
| `backend` | `npm run migrate:deploy` | apply database migrations |
| `frontend` | `npm run dev` / `npm run build` / `npm start` | develop, build, serve |
| `frontend` | `npm run lint` | ESLint |

## Deployment

The API needs a host that keeps WebSocket connections open (Render, Railway, Fly.io, a VPS). Serverless platforms such
as Vercel Functions cannot hold them, so the **website** goes on Vercel (or similar) and the **API** goes elsewhere.

1. **Database:** create a PostgreSQL database and keep its connection string.
2. **API** (`render.yaml` is a ready blueprint for Render; it has not been run end to end):
   - build: `npm ci --include=dev && npm run build` (in `backend`)
   - start: `npx prisma migrate deploy && node dist/index.js`
   - environment: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (the website's address) and
     `TRUST_PROXY=1`
   - health check path: `/health/ready`
3. **Website:** import the repository, set the root directory to `frontend`, and set `NEXT_PUBLIC_API_URL` to the API's
   `https://` address. Deploy.
4. Open the website, create an account and a board, and invite a second account to check sharing.

> **Free-tier note:** some hosts delete free PostgreSQL databases after a period or put free web services to sleep.
> Use a paid or permanent database for anything that matters.

## Security

- Passwords are hashed with bcrypt (cost 12). Sign-in answers are identical for an unknown email and a wrong password.
- Tokens are HS256 JWTs that expire; the server checks the algorithm and rejects forged, expired or `none` tokens.
- Every REST route and every socket event checks the person's role on that board. Strangers get "not found", viewers
  cannot change anything, and shape changes are scoped to the board, so an id from another board cannot be touched.
- Every request body and every socket message is validated (types, sizes, ranges). A malformed message cannot crash
  the server; limits apply to shapes per board (5000), members per board (50), boards per person (200) and versions per
  board (50).
- Rate limits on the API, on sign-in and sign-up, and per socket connection. Helmet security headers on the API, and a
  Content-Security-Policy and other security headers on the website.
- CORS and WebSocket origins are restricted to `CLIENT_URL`.

### Known limitations

- The sign-in token is kept in the browser's local storage (a common approach, but readable by any script that runs on
  the page). The site's Content-Security-Policy limits what can run.
- Rate limits and live presence are held in the API's memory, which is right for one API instance. Running several
  needs a shared store (for example Redis with the Socket.IO adapter).
- You can only invite people who already have an account; the app does not send email.

## Photo credits

The home page photos are from [Pexels](https://www.pexels.com) and are credited in the page footer.
