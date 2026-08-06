const express = require('express');
const router = express.Router();
const { pool } = require('../db');

//req.query => /tasks?search..
//req.param => /tasks/:id
// Stage 2:
// Read: /tasks?search=...
// GET /tasks (supports ?search= and ?done=)
router.get("/", async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Something went wrong in tasks retrieval!" });
    }
});

// GET /tasks/:id
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
        const task = result.rows[0];

        if (!task) return res.status(404).json({ error: "Task not found" });

        res.status(200).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong in task retrieval!" });
    }
});

// POST /tasks
router.post("/", async (req, res) => {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: "Title is required and cannot be empty!" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
            [title.trim(), false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong in adding the task!" });
    }
});

// PUT /tasks/:id
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const existingResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
        const existingTask = existingResult.rows[0];

        if (!existingTask) {
            return res.status(404).json({ error: "Task not found!" });
        }

        const { title, done } = req.body;

        const titleProvided = title !== undefined;
        const doneProvided = done !== undefined;

        if (!titleProvided && !doneProvided) {
            return res.status(400).json({ error: "Provide a title or done to update!" });
        }

        if (titleProvided && (typeof title !== 'string' || title.trim() === "")) {
            return res.status(400).json({ error: "Title must be non-empty string!" });
        }

        if (doneProvided && typeof done !== "boolean") {
            return res.status(400).json({ error: "Parameter 'done' must be true or false!" });
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
        res.status(500).json({ error: "Something went wrong in updating the task!" });
    }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

        if (result.rowCount === 0) return res.status(404).json({ error: "Task not found for deleting!" });

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong in deleting the task!" });
    }
});

module.exports = router;