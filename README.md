# Task API

A simple in-memory Task management REST API, built with Node.js and Express as a learning project. It supports full CRUD (Create, Read, Update, Delete) on tasks, follows proper HTTP status code conventions, and comes with interactive Swagger documentation.

## What this is

A backend API that lets you create, list, update, and delete tasks. Data is stored in memory (a plain JavaScript array), so it resets every time the server restarts — there's no database yet, by design, since the goal here was learning the fundamentals of REST APIs and status codes.

## Requirements

- [Node.js](https://nodejs.org/) v18 or later (includes npm)

## Install & Run

Clone the repo, install dependencies, and start the server with one command:

```bash
git clone https://github.com/<your-username>/<your-repo>.git && cd <your-repo> && npm install && npm start
```

The server will start on **http://localhost:3000**.

> If `npm start` isn't defined in your `package.json`, use `node server.js` instead, or add this to `package.json`:
> ```json
> "scripts": {
>   "start": "node server.js"
> }
> ```

## API Documentation (Swagger)

Once the server is running, open **http://localhost:3000/docs** in your browser for interactive API documentation, where you can try out every endpoint directly.

![Swagger UI screenshot](./docs/swagger-screenshot.png)

## Endpoints

| Method | Path         | Description                          | Success | Error(s)         |
|--------|--------------|---------------------------------------|---------|-------------------|
| GET    | `/health`    | Health check                          | 200     | —                 |
| GET    | `/tasks`     | List all tasks                        | 200     | —                 |
| GET    | `/tasks/:id` | Get a single task by id               | 200     | 404 (not found)   |
| POST   | `/tasks`     | Create a new task                     | 201     | 400 (invalid body)|
| PUT    | `/tasks/:id` | Update a task's title and/or done     | 200     | 400, 404          |
| DELETE | `/tasks/:id` | Delete a task                         | 204     | 404 (not found)   |

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

{"id":1,"title":"Laundary","done":false}
```

```
$ curl -i http://localhost:3000/tasks/99

HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 32

{"error":"Task 99 not found!"}
```

## Notes

- Data lives in memory only — restarting the server resets tasks back to the 3 built-in examples.
- Built as part of a step-by-step backend learning exercise (routing → CRUD → validation → docs).
