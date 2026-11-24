# Student Management System

## Project overview

EduPulse is a student management application with a React/Vite frontend, an Express API, and MongoDB storage. It supports administrator, staff, and student accounts, with role-specific access to students, courses, enrollments, attendance, and profiles.

## Requirements

- Node.js 24 and npm (the GitHub Actions workflow uses Node.js 24).
- A running MongoDB instance, either local or hosted, such as MongoDB Atlas.
- PowerShell or another terminal.

## First-time setup

From the repository root, install the backend and frontend dependencies:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
```

Create `backend/.env` with the MongoDB connection string and a private JWT signing key:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/students_management
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, use the connection string for your cluster instead of the local `MONGO_URI`. Do not commit or share real credentials or signing keys.

## Start the application

Start MongoDB first. Open two terminals at the repository root.

**Terminal 1 - backend:**

```powershell
npm run dev
```

The backend listens on `http://localhost:5000`. The root `npm run dev` command starts only the backend.

**Terminal 2 - frontend:**

```powershell
npm run dev:frontend
```

Open `http://localhost:5173` in your browser. The Vite development server proxies `/api` requests to the backend on port 5000.

Alternatively, run `npm run dev` from each of the `backend` and `frontend` folders in separate terminals.

## Local demo administrator

On startup, the backend creates this account only if the connected database does not already contain an administrator:

- Email: `admin@school.edu`
- Password: `admin123`

These are development/demo credentials. Change them before using a deployed or shared environment. If an administrator already exists, the seed process does not replace its credentials.

## Run the Playwright test

The frontend test checks that an administrator can sign in and reach the dashboard. It mocks API responses and starts the Vite frontend automatically, so **the test does not require the backend or MongoDB**.

Install the Chromium browser once if Playwright reports that it is missing:

```powershell
cd frontend
npx playwright install chromium
```

Then run the test from the repository root:

```powershell
npm --prefix frontend test
```

You can also run `npm test` after changing into the `frontend` folder. There is no root-level `npm test` script.

## Lint and build

Run both linters and build the production frontend from the repository root:

```powershell
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix frontend run build
```

The backend CI build check also runs `node --check server.js` from the `backend` folder.

## GitHub Actions

The workflow installs dependencies separately in `backend` and `frontend`. The frontend job installs Chromium and its Linux dependencies, runs lint and the Vite production build, then runs `npm test` from the frontend folder. CI uses Node.js 24.

## Troubleshooting

### `npm` reports `Missing script: "test"`

The test script belongs to the frontend package. From the repository root, run:

```powershell
npm --prefix frontend test
```

Or change into `frontend` before running `npm test`.

### MongoDB connection fails

Confirm MongoDB is running and `backend/.env` contains a valid `MONGO_URI`. Check the backend terminal for connection errors.

### The page loads but API calls fail

Start the backend and confirm it is listening on port 5000. The Vite development server proxies API requests to that port.

### Playwright cannot find Chromium

From the `frontend` folder, run `npx playwright install chromium`. GitHub Actions installs Chromium and its Linux dependencies automatically.

### Demo login does not work

The default account is seeded only when no administrator exists. Check the backend startup output and confirm that it is connected to the expected MongoDB database.
