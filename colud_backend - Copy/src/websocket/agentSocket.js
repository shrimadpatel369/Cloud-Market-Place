const WebSocket = require("ws");
const Vm = require("../models/vm");

let clientSocket = null;

// Store promises waiting for responses
let pendingRequests = {};

function initWebSocket() {
    const wss = new WebSocket.Server({ port: 8080 });

    wss.on("connection", (ws) => {
        console.log("Agent connected");
        clientSocket = ws;

        ws.on("message", async (data) => {
            const msg = JSON.parse(data);

            // VM CREATED RESPONSE
            if (msg.type === "vm-created") {
                const { vmId, success } = msg.payload;

                if (pendingRequests["create-vm"]) {
                    pendingRequests["create-vm"].resolve({ vmId, success });
                    delete pendingRequests["create-vm"];
                }

                if (success) {
                    await Vm.create({ vmId });
                    console.log("VM saved in DB:", vmId);
                }
            }

            // COMMAND OUTPUT
            if (msg.type === "vm-output") {
                console.log("VM Output:", msg.payload.output);
            }
        });
    });
}

// Send WebSocket message & wait for result
function sendRequest(type, payload = {}) {
    return new Promise((resolve, reject) => {
        if (!clientSocket) return reject("Agent not connected");

        pendingRequests[type] = { resolve, reject };

        clientSocket.send(JSON.stringify({ type, payload }));
    });
}

module.exports = { initWebSocket, sendRequest };
