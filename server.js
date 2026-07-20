import express from "express";
import { triggerAsyncId } from "node:async_hooks";

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


app.get("/tasks", (req, res) => {
    res.status(200).json(tasks);
});


app.get("/task/:id", (req, res) => {
    const id = Number(req.params.id);
    const task = tasks.find((t) => t.id === id);

    if (!task) {
        return res.status(404).json({ error: `Task ${id} not found!`});
    }

    res.status(200).json(task);
});

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

app.listen(port, () => {
    console.log(`App is listenin on port ${port}`);
});