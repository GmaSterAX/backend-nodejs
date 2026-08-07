require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const { initDb } = require("./db"); 
const supabase = require('./supabaseClient');
const requireAuth = require('./middleware/authGuard');

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

// GET /public/info
app.get("/public/info", (req, res) => {
    res.status(200).json({ message: "Welcome stranger! This info is public."});
});

// GET /protected/profile 
app.get("/protected/profile", requireAuth, (req, res) => {
        res.status(200).json({
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
        });
});

// GET /protected/dashboard with auth middleware (requireAuth)
// They work in the order they are written => first requireAuth then req.res cycle.
app.get("/protected/dashboard", requireAuth, (req, res) => {
    res.status(200).json({ message: `Welcome to your dashboard, ${req.user.email}`})
})

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