import express from "express";
import { triggerAsyncId } from "node:async_hooks";

const app = express();
const port = 3000;


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
        return res.status(400).json({ error: `Task ${id} not found!`});
    }

    res.status(200).json(task);
});


app.listen(port, () => {
    console.log(`App is listenin on port ${port}`);
});