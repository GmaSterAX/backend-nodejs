# Task API

A Task management REST API, built with Node.js, Express, and PostgreSQL. It supports full CRUD (Create, Read, Update, Delete) on tasks, search and filtering, follows proper HTTP status code conventions, and comes with interactive Swagger documentation. The whole stack (API + database) runs with a single Docker Compose command.

## What this is

A backend API that lets you create, list, search, update, and delete tasks. Data is stored in a PostgreSQL database running in its own container, with a Docker volume, so your tasks survive restarts — including full stack restarts (`docker compose down && docker compose up`).

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Podman) — that's it. Node.js and PostgreSQL both run inside containers, you don't need to install them separately.

## Install & Run

Clone the repo, set up your environment file, and start everything with one command:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
cp .env.example .env
docker compose up
```

That single `docker compose up` command builds the API image, starts PostgreSQL, waits for the database to be ready, then starts the API — no manual database setup required.

The API will be available at **http://localhost:3000**.

## Environment variables

Copy `.env.example` to `.env` before running (see command above). The variables are:

| Variable       | Description                              | Example (matches docker-compose defaults) |
|----------------|-------------------------------------------|---------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string              | `postgres://postgres:dev@localhost:5432/tasks` |
| `PORT`         | Port the API listens on                   | `3000`                                       |

> Note: inside Docker Compose, the API reaches the database via the service name `db` (not `localhost`) — this is handled automatically in `compose.yaml`, you don't need to change anything.

## API Documentation (Swagger)

Once the stack is running, open **http://localhost:3000/docs** in your browser for interactive API documentation, where you can try out every endpoint directly.

![Swagger UI screenshot](./docs/swagger-screenshot.png)

## Endpoints

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

### Request bodies

**POST /tasks**
```json
{ "title": "Buy milk" }
```

**PUT /tasks/:id** (send `title`, `done`, or both)
```json
{ "done": true }
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

## Data in the database

Screenshot below, taken via `psql` inside the running `db` container:

```
docker exec -it tasksdb psql -U postgres -d tasks -c "\dt"
docker exec -it tasksdb psql -U postgres -d tasks -c "SELECT * FROM tasks;"
```

![Database screenshot](./docs/database-screenshot.png)

## Stopping the stack

```bash
# Stop containers, keep data
docker compose down

# Stop containers AND wipe the database volume (fresh start)
docker compose down -v
```

## Notes

- Data lives in a Postgres volume (`taskdata`), managed by Docker Compose — it survives container restarts, but `docker compose down -v` will wipe it intentionally.
- Never commit your real `.env` file — only `.env.example` should be tracked in git.
- Built as part of a step-by-step backend learning exercise (routing → validation → SQLite → PostgreSQL → Docker Compose).