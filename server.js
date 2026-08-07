require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const { initDb } = require("./db"); 
const supabase = require('./supabaseClient');

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
app.get("/protected/profile", async (req, res) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access token required!"});
    }

    const token = authHeader.split(" ")[1]; //gets the toekn part Bearer ...

    if(!token) {
        return res.status(401).json({ error: "Access token reqiured."});
    }

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if(error || !data.user) {
            return res.status(401).json({ error: "Invalid or expired token"});
        }

        res.status(200).json({
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong verifying the token"});
    }

    res.status(200).json({ message: "You reached a protected route.", token});
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