require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const { pool, initDb } = require("./db"); 

const tasksRouter = require('./routes/tasks');
const authRouter = require('./routes/auth');

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

app.use("/tasks", tasksRouter);
app.use("/auth", authRouter);

app.listen(port, (error) => {
    if (error) throw error;
    console.log(`App is listenin on port ${port} and connected to supabase`);
});