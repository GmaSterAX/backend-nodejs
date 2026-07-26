require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const { pool, initDb } = require("./db"); 

initDb()
    .then(() => console.log("Connected to Postgres and ready!"))
    .catch((err) => {
        console.error("Failed to connect to Postgres: ", err);
        process.exit(1);
    });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

//ROUTERS 
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
app.get("/tasks", async (req, res) => {
    const { search, done } = req.query;

    let query = "SELECT * FROM tasks WHERE 1=1";
    const params = [];

    if (search) {
    params.push(`%${search}%`);
    query += ` AND title LIKE $${params.length}`;
}

     if (done !== undefined) {
        params.push(done === "true");
        query += ` AND done = $${params.length}`;
    }

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Something went wrong in tasks retrieval!"});
    }
});


app.get("/tasks/:id", async (req, res) => {
    const id = Number(req.params.id);
    
    try {
        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
        const task = result.rows[0];

        if (!task) return res.status(404).json({error: "Task not found"});
        
        res.status(200).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong in task retrieval!"});
    }
});

// Stage 3:
//POST /tasks - create a new task
app.post("/tasks", async (req, res) => {
    const {title} = req.body;
    if(!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: "Title is required and cannot be empty!"});
    }

    try {
        const result = await pool.query(
            "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
            [title.trim(), false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong in adding the task!"});
    }
});

// Stage 4: 
// Update & Delete
app.put("/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const existingResult = await pool.query("SELECT * FROM tasks WHERE id =  $1", [id]);
        const existingTask = existingResult.rows[0];

        if (!existingTask) {
            return res.status(404).json({ error: "Task not found!"});
        }

        const { title, done } = req.body;

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
    const newDone = doneProvided ? done : existingTask.done;

    const result = await pool.query(
        "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
        [newTitle, newDone, id]
    );

    res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong in updating the task!"});
    }
});

//Delete
app.delete("/tasks/:id", async (req, res) => {
    const id  = Number(req.params.id);
    
    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

        if (result.rowCount === 0) return res.status(404).json({error: "Task not found for deleting!"});

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong in deleting the task!"});
    }
});

app.listen(port, (error) => {
    if (error) throw error;
    console.log(`App is listenin on port ${port}`);
});