# Task API

A Task management REST API with authentication, built with Node.js, Express, PostgreSQL, and Supabase Auth. It supports full CRUD (Create, Read, Update, Delete) on tasks, search and filtering, a complete signup/login/logout auth flow, protected routes guarded by a reusable middleware, proper HTTP status code conventions, and interactive Swagger documentation with a built-in "Authorize" flow. The whole stack (API + database) runs with a single Docker Compose command.

## What this is

A backend API that lets you:
- Manage tasks (create, list, search, filter, update, delete) — data lives in PostgreSQL, in its own container with a Docker volume, so it survives restarts (including full stack restarts: `docker compose down && docker compose up`).
- Register, log in, and log out users via Supabase Auth.
- Protect routes with a reusable auth guard (middleware) that verifies a Bearer token before letting a request through.

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Podman) for the API + PostgreSQL.
- A free [Supabase](https://supabase.com) project, for authentication.

## Install & Run

Clone the repo, set up your environment file, and start the API + database with one command:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
cp .env.example .env
docker compose up
```

That single `docker compose up` command builds the API image, starts PostgreSQL, waits for the database to be healthy, then starts the API — no manual database setup required.

The API will be available at **http://localhost:3000**.

> You still need to fill in your own Supabase values in `.env` (see below) — those can't be provided by Docker Compose, since they come from your own Supabase project.

## Environment variables

Copy `.env.example` to `.env` before running (see command above), then fill in your own Supabase project values. The variables are:

| Variable       | Description                                          | Example                                             |
|----------------|-------------------------------------------------------|------------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string                          | `postgres://postgres:dev@localhost:5432/tasks`       |
| `PORT`         | Port the API listens on                                | `3000`                                                |
| `SUPABASE_URL` | Your Supabase project URL (Project Settings → API)     | `https://xxxxxxxx.supabase.co`                        |
| `SUPABASE_KEY` | Your Supabase **anon/publishable** key — never the `service_role` key | `eyJhbGci...` |

> Note: inside Docker Compose, the API reaches the database via the service name `db` (not `localhost`) — this is handled automatically in `compose.yaml`, you don't need to change anything. Supabase, being an external cloud service, is reached the same way whether you're in Docker or running locally.

> In your Supabase project (Authentication → Sign In / Providers → Email), turn **"Confirm email" off** for local development, so a fresh signup can log in immediately.

## API Documentation (Swagger)

Once the stack is running, open **http://localhost:3000/docs** in your browser for interactive API documentation. Protected endpoints show a 🔒 lock icon. Click **Authorize**, paste an `access_token` from `/auth/login`, and you can call protected routes directly from the browser — no curl needed.

![Swagger UI screenshot](./docs/swagger-screenshot.png)

## Endpoints

### Tasks

| Method | Path                          | Description                                  | Success | Error(s)          |
|--------|-------------------------------|-----------------------------------------------|---------|--------------------|
| GET    | `/health`                     | Health check                                  | 200     | —                  |
| GET    | `/tasks`                      | List all tasks                                | 200     | —                  |
| GET    | `/tasks?search=<text>`        | Filter tasks whose title contains `<text>`    | 200     | —                  |
| GET    | `/tasks?done=true\|false`     | Filter tasks by completion status             | 200     | —                  |
| GET    | `/tasks/:id`                  | Get a single task by id                       | 200     | 404 (not found)    |
| POST   | `/tasks`                      | Create a new task                             | 201     | 400 (invalid body) |
| PUT    | `/tasks/:id`                  | Update a task's title and/or done             | 200     | 400, 404           |
| DELETE | `/tasks/:id`                  | Delete a task                                 | 204     | 404 (not found)    |

Query parameters can be combined, e.g. `/tasks?search=milk&done=false`.

### Auth

| Method | Path            | Description                                | Auth required | Success | Error(s)     |
|--------|-----------------|---------------------------------------------|:---:|---------|--------------|
| POST   | `/auth/signup`  | Register a new user                        | No  | 201     | 400          |
| POST   | `/auth/login`   | Log in, receive `access_token` + `refresh_token` | No | 200 | 400, 401     |
| POST   | `/auth/logout`  | Log out the current user                   | Yes 🔒 | 204  | 401          |

### Protected (require `Authorization: Bearer <token>`)

| Method | Path                    | Description                              | Success | Error(s) |
|--------|--------------------------|-------------------------------------------|---------|----------|
| GET    | `/public/info`           | Public info, no auth required             | 200     | —        |
| GET    | `/protected/profile`     | Returns the authenticated user's safe metadata (id, email, created_at) | 200 | 401 |
| GET    | `/protected/dashboard`   | Example second route reusing the same auth guard | 200 | 401 |

All protected routes share one middleware (`middleware/authGuard.js`) that verifies the token with Supabase and attaches the user to `req.user` — adding a new protected route means pointing it at the same guard, no new auth code.

### Request bodies

**POST /tasks**
```json
{ "title": "Buy milk" }
```

**PUT /tasks/:id** (send `title`, `done`, or both)
```json
{ "done": true }
```

**POST /auth/signup / POST /auth/login**
```json
{ "email": "test@example.com", "password": "password123" }
```

## Example

```
$ curl -i http://localhost:3000/tasks/1

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 43

{"id":1,"title":"Do grocery","done":true}
```

```
$ curl -i http://localhost:3000/tasks/999

HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 26

{"error":"Task not found"}
```

```
$ curl -i http://localhost:3000/protected/profile

HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 34

{"error":"Access token required"}
```

## Data in the database

Screenshot below, taken via `psql` inside the running `db` container:

```
docker compose ps
docker exec -it <db-container-name> psql -U postgres -d tasks -c "\dt"
docker exec -it <db-container-name> psql -U postgres -d tasks -c "SELECT * FROM tasks;"
```

![Database screenshot](./docs/database-screenshot.png)

## Project structure

```
├── server.js              # App entry point: wires up middleware, routers, listens on PORT
├── db.js                  # PostgreSQL pool + table creation/seed logic (all in one module)
├── supabaseClient.js      # Supabase client, initialized from env vars
├── middleware/
│   └── authGuard.js        # Reusable middleware: verifies Bearer token, attaches req.user
├── routes/
│   ├── tasks.js            # All /tasks endpoints
│   └── auth.js             # All /auth endpoints (signup, login, logout)
├── openapi.json            # OpenAPI spec served at /docs via swagger-ui-express
├── Dockerfile
├── compose.yaml
├── .env.example
└── README.md
```

## Stopping the stack

```bash
# Stop containers, keep data
docker compose down

# Stop containers AND wipe the database volume (fresh start)
docker compose down -v
```

## Notes

- Task data lives in a Postgres volume (`taskdata`), managed by Docker Compose — it survives container restarts, but `docker compose down -v` will wipe it intentionally.
- User accounts (signup/login) are managed entirely by Supabase, not by this app's own database.
- Never commit your real `.env` file — only `.env.example` should be tracked in git. Never use a Supabase `service_role` key in this app — it bypasses all security and should only ever be used server-side in trusted, non-public contexts.
- Built as part of a step-by-step backend learning exercise (routing → validation → SQLite → PostgreSQL → Docker Compose → Supabase Auth).