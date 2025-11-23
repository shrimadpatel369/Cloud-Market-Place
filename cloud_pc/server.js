const express = require("express");
const startWebSocket = require("./ws/websocket");
const { CLIENT_PORT } = require("./config");
const logger = require("./utils/logger");

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("VM Client is running 🚀"));

app.listen(CLIENT_PORT, () => {
  logger.success(`VM Client API running on http://localhost:${CLIENT_PORT}`);
});

// Start WebSocket client
startWebSocket();
