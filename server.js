const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');

const app = express();
const port = 3000;

app.use(express.json());


let tasks = [{id: 1, title: "Laundary", done: false},
        {id: 2, title: "Coding NodeJS", done: true}, 
        {id: 3, title: "Garden Irrigation", done:false}]


app.get("/", (req, res) => {
    res.send("Hello World!");
});


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

// Stage 2:
// Read: list and single task
app.get("/tasks", (req, res) => {
    res.status(200).json(tasks);
});


app.get("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);
    const task = tasks.find((t) => t.id === id);

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

    //const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
    const nextId = tasks.length + 1;
    
    const newTask = {id: nextId, title: title.trim(), done: false};
    tasks.push(newTask);

    res.status(201).json(newTask);

});

// Stage 4: 
// Update & Delete
app.put("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find((t) => t.id === id);
    
    const { title, done} = req.body;

    if(!task) {
        return res.status(404).json({error: `Task ${id} is not found!`});
    }

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

    if (titleProvided) task.title = title.trim();
    if (doneProvided) task.done = done;

    res.status(200).json(task);
});

//Delete
app.delete("/tasks/:id", (req, res) => {
    const id  = Number(req.params.id);

    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) return res.status(404).json({ error: `Task ${id} could not found!`});
    tasks.splice(taskIndex, 1);
    return res.status(204).send();
});

app.listen(port, (error) => {
    if (error) throw error;
    console.log(`App is listenin on port ${port}`);
});