require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");

const wsServer = require("./src/ws/wsServer");
const vmRoutes = require("./src/routes/vmRoutes");
const agentRoutes = require("./src/routes/agentRoutes");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();

// ---- ADD CORS HERE ----
app.use(cors());  // allow all origins
// -----------------------

app.use(express.json());
app.use("/vms", vmRoutes);
app.use("/agents", agentRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => res.send("Backend API"));

const server = http.createServer(app);

// attach ws server to same HTTP server
wsServer.attachToServer(server);

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () =>
    console.log(`Server + WS listening on ${PORT} (0.0.0.0)`)
);

// mongodb connect
mongoose.connect("mongodb+srv://aomk_db_user:aom123456789@cluster0.niqidxk.mongodb.net/?appName=Cluster0")
    .then(() => console.log("Mongo connected"))
    .catch((e) => console.error("Mongo error", e.message));
