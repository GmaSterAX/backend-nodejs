const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const Database = require('better-sqlite3');

const db = new Database('tasks.db');

const app = express();
const port = 3000;

app.use(express.json());

// DB STARTS HERE
// -------------------------------------------------------------
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0)
    `);

const rows = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();

if (rows.count === 0) {
    console.log("The table is empty. Seed tasks will be added!");
    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    
    const seedTasks = db.transaction(() => {
        insert.run("Do grocery", 1);
        insert.run("Clean the house", 0);
        insert.run("Do internship assignments", 0);
    });

    seedTasks();

} else {
    console.log(`The table has already ${rows.count} rows!`);
}

// -------------------------------------------------------------

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/", (req, res) => {
    res.json({
        name: "Task API",
        version: "1.0",
        endpoints: ["/tasks"]
    });
});

app.get("/health", (req, res) => {
res.json({status: "ok"});
});
//req.query => /tasks?search..
//req.param => /tasks/:id
// Stage 2:
// Read: /tasks?search=...
app.get("/tasks", (req, res) => {
    const { search, done } = req.query;

    let query = "SELECT * FROM tasks WHERE 1=1";
    const params = [];

    if (search) {
        query += " AND title LIKE ?";
        params.push(`%${search}%`);
    }

    if (done !== undefined) {
        query += " AND done = ?";
        params.push(done === "true" ? 1 : 0);
    }

    const allTasks = db.prepare(query).all(...params);
    res.status(200).json(allTasks);
});


app.get("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
        return res.status(404).json({ error: `Task ${id} not found!`});
    }

    res.status(200).json(task);
});

// Stage 3:
//POST /tasks - create a new task
app.post("/tasks", (req, res) => {
    const {title} = req.body;
    if(!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: "Title is required and cannot be empty!"});
    }

    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    const result = insert.run(title.trim(), 0);

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newTask);

});

// Stage 4: 
// Update & Delete
app.put("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if(!existingTask) {
        return res.status(404).json({error: `Task ${id} is not found!`});
    }

    const { title, done} = req.body;

    const titleProvided = title !== undefined;
    const doneProvided = done !== undefined;

    if (!titleProvided && !doneProvided) {
        return res.status(400).json({error: "Provide a title or done to update!"});
    }

    if (titleProvided && (typeof title !== 'string' || title.trim() == "")){
        return res.status(400).json({error: "Title must be non-empty string!"});
    }
    
    if (doneProvided && (typeof done !== "boolean")) {
        return res.status(400).json({error: "Parameter 'done' must be true or false!"});
    }

    const newTitle = titleProvided ? title.trim() : existingTask.title;
    const newDone = doneProvided ? (done ? 1 : 0) : existingTask.done;

    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.status(200).json(updatedTask);
});

//Delete
app.delete("/tasks/:id", (req, res) => {
    const id  = Number(req.params.id);
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!existingTask) return res.status(404).json({ error: `Task ${id} could not found!`});

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    return res.status(204).send();
});

app.listen(port, (error) => {
    if (error) throw error;
    console.log(`App is listenin on port ${port}`);
});