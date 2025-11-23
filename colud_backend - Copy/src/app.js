const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const vmRoutes = require('./routes/vmRoutes');
const agentRoutes = require('./routes/agentRoutes');
const wsService = require('./services/wsService');
const clientsStore = require('./clients/clientsStore');


const app = express();
app.use(bodyParser.json());


// API routes
app.use('/vms', vmRoutes);
app.use('/agents', agentRoutes);


// health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));


// HTTP server + WS server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


// initialize ws service with wss and clients store
wsService.init(wss, clientsStore);


module.exports = server;